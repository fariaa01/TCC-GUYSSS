const Cliente = require('../models/clienteModel');

module.exports = {
  // GET /api/cliente/status
  status: async (req, res) => {
    const isLogged = !!req.session?.clienteId;
    if (!isLogged) return res.json({ loggedIn: false });
    return res.json({ loggedIn: true, clienteId: req.session.clienteId });
  },

  // POST /cliente/login  { email, senha, next? }
  loginPost: async (req, res) => {
    try {
      const { email, senha, next = '/' } = req.body || {};
      if (!email || !senha) return res.status(400).json({ erro: 'Informe email e senha' });

      const cliente = await Cliente.findByEmail(email);
      if (!cliente) return res.status(401).json({ erro: 'Credenciais inválidas' });

      const ok = await Cliente.checkPassword(senha, cliente.senha_hash);
      if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas' });

      req.session.clienteId = cliente.id;
      return res.json({ sucesso: true, redirect: next || '/' });
    } catch (e) {
      console.error(e);
      return res.status(400).json({ erro: e.message || 'Erro no login' });
    }
  },

  // POST /cliente/cadastrar  { nome, email, senha, next? }
  cadastrarPost: async (req, res) => {
    try {
      const { nome, email, senha, next = '/' } = req.body || {};
      if (!nome || !email || !senha) return res.status(400).json({ erro: 'Preencha todos os campos' });

      const ja = await Cliente.findByEmail(email);
      if (ja) return res.status(409).json({ erro: 'Email já cadastrado' });

      const novo = await Cliente.create({ nome, email, senha });
      req.session.clienteId = novo.id;
      return res.json({ sucesso: true, redirect: next || '/' });
    } catch (e) {
      console.error(e);
      return res.status(400).json({ erro: e.message || 'Erro no cadastro' });
    }
  },

  // POST /cliente/logout
  logoutPost: async (_req, res) => {
    try {
      // destruir apenas o login do cliente
      // (se quiser destruir toda sessão, use req.session.destroy)
      res.req.session.clienteId = null;
      return res.json({ sucesso: true });
    } catch (e) {
      console.error(e);
      return res.status(400).json({ erro: 'Erro ao sair' });
    }
  }
};
