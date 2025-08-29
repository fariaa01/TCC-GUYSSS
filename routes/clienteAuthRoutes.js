// routes/clienteAuthRoutes.js (adicione no final do arquivo)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const Carrinho = require('../models/carrinhoModel');

// 1) Status de login (JSON)
router.get('/api/cliente/status', (req, res) => {
  return res.json({ loggedIn: !!req.session.clienteId });
});

// 2) Login do cliente (JSON)
router.post('/cliente/login', async (req, res) => {
  try {
    const { email, senha, next } = req.body || {};
    if (!email || !senha) return res.status(400).json({ erro: 'Informe email e senha' });

    const [rows] = await pool.query('SELECT * FROM clientes WHERE email = ? LIMIT 1', [email]);
    const cliente = rows[0];
    if (!cliente) return res.status(400).json({ erro: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(senha, cliente.senha_hash);
    if (!ok) return res.status(400).json({ erro: 'Credenciais inválidas' });

    req.session.clienteId = cliente.id;

    // Mescla carrinho anônimo no do cliente
    await Carrinho.mergeSessionCartIntoCliente(req, cliente.id);

    return res.json({ ok: true, redirect: next || '/checkout' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao autenticar' });
  }
});

// 3) Cadastro do cliente (JSON)
router.post('/cliente/cadastrar', async (req, res) => {
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

    req.session.clienteId = ins.insertId;

    // Mescla carrinho anônimo no do cliente
    await Carrinho.mergeSessionCartIntoCliente(req, ins.insertId);

    return res.json({ ok: true, redirect: next || '/checkout' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao cadastrar' });
  }
});

module.exports = router;
