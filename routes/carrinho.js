const express = require('express');
const router = express.Router();
const Menu = require('../models/menuModel');

router.get('/', (req, res) => {
  const carrinho = req.session.carrinho || [];
  res.render('carrinho', { carrinho });
});

router.post('/', async (req, res) => {
  try {
    const itemId = Number(req.body.item_id);
    if (!itemId) {
      return res.status(400).json({ ok: false, msg: 'ID inválido' });
    }

    const prato = await Menu.getById(itemId);
    if (!prato) {
      return res.status(404).json({ ok: false, msg: 'Prato não encontrado' });
    }

    if (!req.session.carrinho) req.session.carrinho = [];

    // Verifica se o item já está no carrinho
    const existente = req.session.carrinho.find(item => item.id === prato.id);
    if (existente) {
      existente.quantidade = (existente.quantidade || 1) + 1;
    } else {
      // Cria um novo objeto para evitar mutação do original
      req.session.carrinho.push({
        ...prato,
        quantidade: 1
      });
    }

    // Soma total de itens no carrinho
    const qtdCarrinho = req.session.carrinho.reduce((soma, item) => soma + (item.quantidade || 1), 0);

    res.json({ ok: true, msg: 'Adicionado ao carrinho', qtdCarrinho });
  } catch (err) {
    console.error('Erro ao adicionar ao carrinho:', err);
    res.status(500).json({ ok: false, msg: 'Erro interno do servidor' });
  }
});

module.exports = router;