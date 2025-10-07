const Estoque = require('../../../models/sistema/estoque/estoqueModel');
const produtosModel = require('../../../models/sistema/estoque/produtoModel');
const fornecedoresModel = require('../../../models/sistema/estoque/fornecedorModel');

function uniq(arr) {
  return [...new Set((arr || []).filter(v => v !== null && v !== undefined && String(v).trim() !== ''))];
}

function soData(d) {
  if (!d) return null;
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

function calcularAlertas(rows) {
  const hoje = soData(new Date());
  let cntVencidos = 0;
  let cntProx7   = 0;
  let cntBaixo   = 0;

  for (const p of (rows || [])) {
    const validade = p.validade ? soData(p.validade) : null;
    const qtd = Number(p.quantidade);
    const min = Number(p.quantidade_minima);

    if (!Number.isNaN(qtd) && !Number.isNaN(min) && qtd < min) cntBaixo++;

    if (validade) {
      const diffDias = Math.ceil((validade - hoje) / (1000*60*60*24));
      if (validade < hoje) cntVencidos++;
      else if (diffDias >= 0 && diffDias <= 7) cntProx7++;
    }
  }
  return { cntVencidos, cntProx7, cntBaixo, totalAlerts: cntVencidos + cntProx7 + cntBaixo };
}

module.exports = {
  listar: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) return res.redirect('/login');

      const filtrosAtuais = {
        produto:    req.query.produto    || '',
        categoria:  req.query.categoria  || '',
        fornecedor: req.query.fornecedor || '',
        validade:   req.query.validade   || '',
        status:     req.query.status     || ''
      };

      const todos = await Estoque.getFiltrado({
        categoria: null,
        fornecedor: null,
        validade: null,
        usuarioId
      });

      let produtosRaw = await Estoque.getFiltrado({
        categoria: filtrosAtuais.categoria || null,
        fornecedor: filtrosAtuais.fornecedor || null,
        validade: filtrosAtuais.validade || null,
        usuarioId
      });

      if (filtrosAtuais.produto) {
        produtosRaw = produtosRaw.filter(p => String(p.produto) === filtrosAtuais.produto);
      }
      if (filtrosAtuais.status === 'abaixoMinimo') {
        produtosRaw = produtosRaw.filter(p => Number(p.quantidade) < Number(p.quantidade_minima));
      }

      const produtos = (produtosRaw || []).map(p => ({
        ...p,
        valor: p?.valor != null ? Number(p.valor) : 0
      }));
      
      produtos.sort((a, b) => {
        const hoje = new Date();
        const va = a.validade ? new Date(a.validade) : null;
        const vb = b.validade ? new Date(b.validade) : null;

        // Produtos vencidos vêm primeiro
        const aVencido = va && va < hoje;
        const bVencido = vb && vb < hoje;

        if (aVencido && !bVencido) return -1;
        if (!aVencido && bVencido) return 1;

        if (va && vb) return va - vb;
        if (va) return -1;
        if (vb) return 1;
        return 0;
      });

      const nomesProdutos        = uniq((todos || []).map(p => p.produto)).sort((a,b)=>a.localeCompare(b,'pt-BR'));
      const categoriasUnicas     = uniq((todos || []).map(p => p.categoria)).sort((a,b)=>a.localeCompare(b,'pt-BR'));
      const fornecedoresUnicos   = uniq((todos || []).map(p => p.fornecedor)).sort((a,b)=>a.localeCompare(b,'pt-BR'));

      const produtosCadastrados     = await produtosModel.listarTodos(usuarioId);
      const fornecedoresCadastrados = await fornecedoresModel.listarTodos(usuarioId);

      const { cntVencidos, cntProx7, cntBaixo, totalAlerts } = calcularAlertas(todos);

      // Verificar se há um produto para editar (vindo do QR Code)
      const editId = req.query.edit || null;

      return res.render('sistema/estoque', {
        produtos,
        nomesProdutos,
        categoriasUnicas,
        fornecedoresUnicos,
        filtrosAtuais,
        produtosCadastrados,
        fornecedoresCadastrados,
        cntVencidos,
        cntProx7,
        cntBaixo,
        totalAlerts,
        editId,
        cspNonce: res.locals.cspNonce
      });
    } catch (err) {
      console.error('[Estoque.listar] Erro:', err);
      return res.redirect('/estoque?ok=0&msg=Erro ao carregar o estoque');
    }
  },

  criar: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) return res.redirect('/login');

      // Criar o produto no estoque e obter o ID único
      const produtoId = await Estoque.create(req.body, usuarioId);
      
      // Se a requisição é AJAX/JSON, retornar o ID para uso no QR Code
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ 
          success: true, 
          id: produtoId, 
          message: 'Produto adicionado ao estoque',
          qrUrl: `${req.protocol}://${req.get('host')}/produto/${produtoId}`
        });
      }
      return res.redirect('/estoque?ok=1&msg=Produto adicionado ao estoque');
    } catch (err) {
      console.error('[Estoque.criar] Erro:', err);

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(500).json({ 
          success: false, 
          message: 'Não foi possível adicionar o produto' 
        });
      }
      
      return res.redirect('/estoque?ok=0&msg=Não foi possível adicionar o produto');
    }
  },

  atualizar: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) {
        if (req.xhr || req.headers.accept?.includes('json')) {
          return res.status(401).json({ ok: false, message: 'Não autenticado' });
        }
        return res.redirect('/login');
      }

      await Estoque.update(req.params.id, req.body, usuarioId);

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ ok: true, message: 'Registro atualizado' });
      }

      return res.redirect('/estoque?ok=1&msg=Registro atualizado');
    } catch (err) {
      console.error('[Estoque.atualizar] Erro:', err);

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(500).json({ ok: false, message: 'Erro ao atualizar' });
      }

      return res.redirect('/estoque?ok=0&msg=Não foi possível atualizar o registro');
    }
  },

  deletar: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) return res.redirect('/login');

      await Estoque.delete(req.params.id, usuarioId);
      return res.redirect('/estoque?ok=1&msg=Registro excluído');
    } catch (err) {
      console.error('[Estoque.deletar] Erro:', err);
      return res.redirect('/estoque?ok=0&msg=Não foi possível excluir o registro');
    }
  },

  visualizar: async (req, res) => {
    try {
      const produtoId = req.params.id;
      const produto = await Estoque.getById(produtoId);
      
      if (!produto) {
        return res.status(404).json({ 
          error: 'Produto não encontrado',
          id: produtoId 
        });
      }
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({
          success: true,
          produto: produto,
          qrUrl: `${req.protocol}://${req.get('host')}/produto/${produtoId}`
        });
      }

      return res.redirect(`/estoque?edit=${produtoId}`);
      
    } catch (err) {
      console.error('[Estoque.visualizar] Erro:', err);
      
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(500).json({ 
          error: 'Erro interno do servidor' 
        });
      }

      return res.redirect('/estoque?error=produto_nao_encontrado');
    }
  },

  movimento: async (req, res) => {
    try {
      const produtoId = req.params.id;
      const usuarioId = req.session.userId;
      const { quantidade, tipo } = req.body;
      
      if (!usuarioId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      if (!quantidade || !tipo) {
        return res.status(400).json({ error: 'Quantidade e tipo são obrigatórios' });
      }

      // Buscar produto atual
      const produto = await Estoque.getById(produtoId);
      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Calcular nova quantidade
      const quantidadeAtual = Number(produto.quantidade);
      const movimentacao = Number(quantidade);
      const novaQuantidade = quantidadeAtual + movimentacao;

      if (novaQuantidade < 0) {
        return res.status(400).json({ error: 'Quantidade insuficiente em estoque' });
      }

      // Atualizar quantidade no banco
      await Estoque.update(produtoId, { quantidade: novaQuantidade }, usuarioId);

      // Registrar movimentação (opcional - pode implementar tabela de histórico depois)
      console.log(`Movimento aplicado: Produto ${produtoId}, ${tipo}, quantidade: ${movimentacao}, nova quantidade: ${novaQuantidade}`);

      return res.json({ 
        success: true, 
        message: 'Movimento aplicado com sucesso',
        quantidadeAnterior: quantidadeAtual,
        quantidadeNova: novaQuantidade
      });

    } catch (err) {
      console.error('[Estoque.movimento] Erro:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};