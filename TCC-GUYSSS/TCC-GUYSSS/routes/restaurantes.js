const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const resultados = await User.searchByEmpresaNome(q, 100);
    res.render('restaurantes', { q, resultados });
  } catch (err) { next(err); }
});

router.post('/ir', (req, res) => {
  const id = Number(req.body.usuarioId);
  if (!id) return res.redirect('/restaurantes');
  return res.redirect(`/cardapio/u/${id}`);
});

module.exports = router;
