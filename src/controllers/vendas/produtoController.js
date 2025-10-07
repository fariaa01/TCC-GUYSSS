const Produto = require('../../models/sistema/estoque/produtoModel');

function wantsJSON(req) {
  return req.xhr || req.is('application/json') || req.get('accept')?.includes('application/json');
}

module.exports = {
  create: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) {
        if (wantsJSON(req)) return res.status(401).json({ error: 'Não autenticado.' });
        return res.redirect('/login');
      }

      const { nome, categoria, unidade_padrao, marca, ean } = req.body;
      const nomeTrim = (nome || '').trim();

      if (!nomeTrim) {
        const msg = 'Nome é obrigatório.';
        if (wantsJSON(req)) return res.status(400).json({ error: msg });
        return res.redirect('/estoque?ok=0&msg=' + encodeURIComponent(msg));
      }

      const jaExiste = await Produto.existsByNomeNormalizado(nomeTrim, usuarioId);
      if (jaExiste) {
        const msg = 'Produto já cadastrado para este usuário.';
        if (wantsJSON(req)) return res.status(409).json({ error: msg });
        return res.redirect('/estoque?ok=0&msg=' + encodeURIComponent(msg));
      }

      await Produto.create(
        { nome: nomeTrim, categoria, unidade_padrao, marca, ean },
        usuarioId
      );

      const okMsg = 'Produto cadastrado com sucesso!';
      if (wantsJSON(req)) return res.status(201).json({ ok: true, message: okMsg });
      return res.redirect('/estoque?ok=1&msg=' + encodeURIComponent(okMsg));
    } catch (err) {
      console.error('Erro ao cadastrar produto:', err);
      const msg = 'Erro ao cadastrar produto.';
      if (wantsJSON(req)) return res.status(500).json({ error: msg });
      return res.redirect('/estoque?ok=0&msg=' + encodeURIComponent(msg));
    }
  }
};
