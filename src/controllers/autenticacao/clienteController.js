
const pool = require('../../../db');
const bcrypt = require('bcryptjs');
let Carrinho;
try { Carrinho = require('../../models/vendas/carrinhoModel'); } catch { Carrinho = {}; }

exports.status = (req, res) => {
  return res.json({ loggedIn: !!req.session.clienteId });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
};

exports.login = async (req, res) => {
  try {
    const { email, senha, next } = req.body || {};
    if (!email || !senha) return res.status(400).json({ erro: 'Informe email e senha' });

    const [rows] = await pool.query('SELECT * FROM clientes WHERE email = ? LIMIT 1', [email]);
    const cliente = rows[0];
    if (!cliente) return res.status(400).json({ erro: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(senha, cliente.senha_hash);
    if (!ok) return res.status(400).json({ erro: 'Credenciais inválidas' });

    req.session.regenerate(async (err) => {
      if (err) return res.status(500).json({ erro: 'Falha de sessão' });

      req.session.clienteId = cliente.id;
      try { await Carrinho.mergeSessionCartIntoCliente?.(req, cliente.id); } catch {}

      req.session.save((err2) => {
        if (err2) return res.status(500).json({ erro: 'Falha ao salvar sessão' });
        return res.json({ ok: true, redirect: next || '/checkout' });
      });
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao autenticar' });
  }
};

exports.cadastrar = async (req, res) => {
  try {
    const { nome, email, senha, next } = req.body || {};
    if (!nome || !email || !senha) return res.status(400).json({ erro: 'Dados obrigatórios' });

    const [existe] = await pool.query('SELECT id FROM clientes WHERE email = ? LIMIT 1', [email]);
    if (existe[0]) return res.status(400).json({ erro: 'E-mail já cadastrado' });

    const senha_hash = await bcrypt.hash(senha, 10);
    const [ins] = await pool.query(
      'INSERT INTO clientes (nome, email, senha_hash, criado_em) VALUES (?,?,?,NOW())',
      [nome, email, senha_hash]
    );

    req.session.regenerate(async (err) => {
      if (err) return res.status(500).json({ erro: 'Falha de sessão' });

      req.session.clienteId = ins.insertId;

      // Opcional: mesclar carrinho de sessão → cliente
      try { await Carrinho.mergeSessionCartIntoCliente?.(req, ins.insertId); } catch {}

      req.session.save((err2) => {
        if (err2) return res.status(500).json({ erro: 'Falha ao salvar sessão' });
        return res.json({ ok: true, redirect: next || '/checkout' });
      });
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao cadastrar' });
  }
};
