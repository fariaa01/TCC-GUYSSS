const express = require('express');
const router = express.Router();
const Empresa = require('../../../models/sistema/empresaModel');

router.post('/atualizar-nome-empresa', async (req, res) => {
  const usuarioId = req.session.userId;
  const { nome_empresa } = req.body;

  if (!usuarioId || !nome_empresa) {
    return res.json({ sucesso: false });
  }

  try {
    await Empresa.updateNomeEmpresa(usuarioId, nome_empresa);
    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro ao atualizar nome da empresa:', err);
    res.json({ sucesso: false });
  }
});

module.exports = router;
