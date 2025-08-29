// models/carrinhoModel.js
const pool = require('../db');
const crypto = require('crypto');

/** Garante uma chave de sessão para carrinho anônimo */
function ensureCartKey(req) {
  if (!req.session.cartKey) {
    req.session.cartKey = crypto.randomBytes(16).toString('hex');
  }
  return req.session.cartKey;
}

/** Busca (ou cria) rascunho por cliente logado */
async function getOrCreateDraftByCliente(clienteId, conn = pool) {
  const [rows] = await conn.query(
    'SELECT * FROM pedidos WHERE cliente_id = ? AND status = "rascunho" LIMIT 1',
    [clienteId]
  );
  if (rows[0]) return rows[0];

  const [ins] = await conn.query(
    'INSERT INTO pedidos (cliente_id, status, total) VALUES (?, "rascunho", 0)',
    [clienteId]
  );
  const [[novo]] = await conn.query('SELECT * FROM pedidos WHERE id = ?', [ins.insertId]);
  return novo;
}

/** Busca (ou cria) rascunho por sessão anônima */
async function getOrCreateDraftBySession(sessionKey, conn = pool) {
  const [rows] = await conn.query(
    'SELECT * FROM pedidos WHERE session_key = ? AND status = "rascunho" LIMIT 1',
    [sessionKey]
  );
  if (rows[0]) return rows[0];

  const [ins] = await conn.query(
    'INSERT INTO pedidos (session_key, status, total) VALUES (?, "rascunho", 0)',
    [sessionKey]
  );
  const [[novo]] = await conn.query('SELECT * FROM pedidos WHERE id = ?', [ins.insertId]);
  return novo;
}

/** Retorna (ou cria) o rascunho atual baseando-se em cliente logado ou sessão */
async function getDraft(req, conn = pool) {
  if (req.session?.clienteId) {
    return getOrCreateDraftByCliente(req.session.clienteId, conn);
  }
  const key = ensureCartKey(req);
  return getOrCreateDraftBySession(key, conn);
}

/** Retorna rascunho + itens */
async function getDraftWithItems(req) {
  const pedido = await getDraft(req);
  const [itens] = await pool.query(
    'SELECT * FROM pedido_itens WHERE pedido_id = ? ORDER BY id DESC',
    [pedido.id]
  );
  return { pedido, itens };
}

/** Adiciona item (snapshot de nome/preço) e recalcula total */
async function addItem(req, { produto_id, nome, preco, qtd = 1 }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const pedido = await getDraft(req, conn);

    // Se existir mesmo produto, só soma a quantidade
    const [exist] = await conn.query(
      'SELECT * FROM pedido_itens WHERE pedido_id = ? AND produto_id = ? LIMIT 1',
      [pedido.id, produto_id]
    );

    if (exist[0]) {
      const novoQ = exist[0].quantidade + Number(qtd);
      const novoS = (Number(preco) * novoQ).toFixed(2);
      await conn.query(
        'UPDATE pedido_itens SET quantidade = ?, subtotal = ?, atualizado_em = NOW() WHERE id = ?',
        [novoQ, novoS, exist[0].id]
      );
    } else {
      const subtotal = (Number(preco) * Number(qtd)).toFixed(2);
      await conn.query(
        `INSERT INTO pedido_itens (pedido_id, produto_id, nome_produto, preco_unitario, quantidade, subtotal)
         VALUES (?,?,?,?,?,?)`,
        [pedido.id, produto_id, nome, preco, qtd, subtotal]
      );
    }

    // Recalcula total do pedido
    const [[sum]] = await conn.query(
      'SELECT COALESCE(SUM(subtotal),0) AS soma FROM pedido_itens WHERE pedido_id = ?',
      [pedido.id]
    );
    await conn.query('UPDATE pedidos SET total = ?, atualizado_em = NOW() WHERE id = ?', [sum.soma, pedido.id]);
    await conn.commit();
    return pedido.id;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/** Atualiza quantidade de um item do rascunho atual */
async function updateQty(req, itemId, quantidade) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const pedido = await getDraft(req, conn);

    const [[item]] = await conn.query(
      'SELECT * FROM pedido_itens WHERE id = ? AND pedido_id = ? LIMIT 1',
      [itemId, pedido.id]
    );
    if (!item) throw new Error('Item não encontrado no carrinho');

    const qtd = Math.max(1, Number(quantidade));
    const subtotal = (Number(item.preco_unitario) * qtd).toFixed(2);

    await conn.query(
      'UPDATE pedido_itens SET quantidade = ?, subtotal = ? WHERE id = ?',
      [qtd, subtotal, itemId]
    );

    const [[sum]] = await conn.query(
      'SELECT COALESCE(SUM(subtotal),0) AS soma FROM pedido_itens WHERE pedido_id = ?',
      [pedido.id]
    );
    await conn.query('UPDATE pedidos SET total = ? WHERE id = ?', [sum.soma, pedido.id]);

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/** Remove item do rascunho e recalcula total */
async function removeItem(req, itemId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const pedido = await getDraft(req, conn);
    await conn.query('DELETE FROM pedido_itens WHERE id = ? AND pedido_id = ?', [itemId, pedido.id]);

    const [[sum]] = await conn.query(
      'SELECT COALESCE(SUM(subtotal),0) AS soma FROM pedido_itens WHERE pedido_id = ?',
      [pedido.id]
    );
    await conn.query('UPDATE pedidos SET total = ? WHERE id = ?', [sum.soma, pedido.id]);

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/** Mescla carrinho anônimo na conta do cliente após login/cadastro */
async function mergeSessionCartIntoCliente(req, clienteId) {
  if (!req.session?.cartKey) return;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [sessRows] = await conn.query(
      'SELECT * FROM pedidos WHERE session_key = ? AND status = "rascunho" LIMIT 1',
      [req.session.cartKey]
    );
    if (!sessRows[0]) { await conn.commit(); return; }

    const draftCli = await getOrCreateDraftByCliente(clienteId, conn);

    const [itens] = await conn.query(
      'SELECT * FROM pedido_itens WHERE pedido_id = ?',
      [sessRows[0].id]
    );
    for (const it of itens) {
      const [ex] = await conn.query(
        'SELECT * FROM pedido_itens WHERE pedido_id = ? AND produto_id = ? LIMIT 1',
        [draftCli.id, it.produto_id]
      );
      if (ex[0]) {
        const novaQ = ex[0].quantidade + it.quantidade;
        const novoS = (Number(ex[0].preco_unitario) * novaQ).toFixed(2);
        await conn.query(
          'UPDATE pedido_itens SET quantidade = ?, subtotal = ? WHERE id = ?',
          [novaQ, novoS, ex[0].id]
        );
      } else {
        await conn.query(
          `INSERT INTO pedido_itens (pedido_id, produto_id, nome_produto, preco_unitario, quantidade, subtotal)
           VALUES (?,?,?,?,?,?)`,
          [draftCli.id, it.produto_id, it.nome_produto, it.preco_unitario, it.quantidade, it.subtotal]
        );
      }
    }

    const [[sum]] = await conn.query(
      'SELECT COALESCE(SUM(subtotal),0) AS soma FROM pedido_itens WHERE pedido_id = ?',
      [draftCli.id]
    );
    await conn.query('UPDATE pedidos SET total = ? WHERE id = ?', [sum.soma, draftCli.id]);

    await conn.query('DELETE FROM pedidos WHERE id = ?', [sessRows[0].id]);
    delete req.session.cartKey;

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/** Checkout flexível:
 *  - Se logado: finaliza vinculando ao cliente.
 *  - Se convidado: exige contato (nome + telefone) e finaliza sem cliente_id.
 *  - Salva dados de entrega se informados.
 */
async function checkout(
  req,
  {
    observacoes = '',
    statusFinal = 'aberto',
    contato = {},          // { nome, telefone }
    entrega = {}           // { endereco, bairro, cidade, uf, cep }
  } = {}
) {
  const isLogged = !!req.session?.clienteId;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Obtém rascunho por cliente OU por sessão
    let pedido;
    if (isLogged) {
      pedido = await getOrCreateDraftByCliente(req.session.clienteId, conn);
    } else {
      pedido = await getOrCreateDraftBySession(ensureCartKey(req), conn);
    }

    // Deve ter itens
    const [[qtd]] = await conn.query(
      'SELECT COUNT(*) AS n FROM pedido_itens WHERE pedido_id = ?',
      [pedido.id]
    );
    if (!qtd.n) throw new Error('Carrinho vazio');

    // Convidado precisa de contato mínimo
    const nome     = (contato?.nome || '').trim();
    const telefone = (contato?.telefone || '').trim();
    if (!isLogged && (!nome || !telefone)) {
      const err = new Error('Informe seu nome e telefone para finalizar.');
      err.needContact = true;
      throw err;
    }

    // Se logado e ainda não vinculado, vincula ao cliente
    if (isLogged && !pedido.cliente_id) {
      await conn.query('UPDATE pedidos SET cliente_id = ? WHERE id = ?', [req.session.clienteId, pedido.id]);
    }

    // Atualiza status + campos de checkout
    await conn.query(
      `UPDATE pedidos SET
         status = ?,
         observacoes = ?,
         contato_nome = COALESCE(?, contato_nome),
         contato_telefone = COALESCE(?, contato_telefone),
         entrega_endereco = COALESCE(?, entrega_endereco),
         entrega_bairro = COALESCE(?, entrega_bairro),
         entrega_cidade = COALESCE(?, entrega_cidade),
         entrega_uf = COALESCE(?, entrega_uf),
         entrega_cep = COALESCE(?, entrega_cep),
         atualizado_em = NOW()
       WHERE id = ?`,
      [
        statusFinal,
        observacoes,
        isLogged ? null : (nome || null),
        isLogged ? null : (telefone || null),
        entrega?.endereco || null,
        entrega?.bairro   || null,
        entrega?.cidade   || null,
        entrega?.uf       || null,
        entrega?.cep      || null,
        pedido.id
      ]
    );

    await conn.commit();
    return { pedidoId: pedido.id };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = {
  ensureCartKey,
  getDraftWithItems,
  addItem,
  updateQty,
  removeItem,
  mergeSessionCartIntoCliente,
  checkout,
};
