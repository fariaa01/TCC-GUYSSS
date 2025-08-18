
const User = require('../models/userModel');
const bcrypt = require('bcrypt');

module.exports = {
  register: async (req, res) => {
    const { nome, email, senha } = req.body;
    await User.createUser(nome, email, senha);
    res.redirect('/login');
  },
  login: async (req, res) => {
    const { email, senha } = req.body;
    const user = await User.findByEmail(email);
    if (user && await bcrypt.compare(senha, user.senha)) {
      req.session.userId = user.id;
      res.redirect('/dashboard');
    } else {
      res.send('Login inválido');
    }
  },
  logout: (req, res) => {
    req.session.destroy(() => {
      res.redirect('/login');
    });
  }
};
