const Fornecedor = require('../models/estoque/fornecedorModel');

function wantsJSON(req) {
  return req.xhr || req.is('application/json') || req.get('accept')?.includes('application/json');
}
function onlyDigits(str = '') {
  return String(str).replace(/\D+/g, '');
}

module.exports = {
  listar: async (req, res, next) => {
    try {
      const usuarioId = req.session?.userId;
      if (!usuarioId) {
        if (wantsJSON(req)) return res.status(401).json({ error: 'Não autenticado.' });
        return res.redirect('/login');
      }

      const fornecedores = await Fornecedor.getAll(usuarioId);
      return res.render('dados-fornecedor', {
        fornecedores: fornecedores || [],
        cspNonce: res.locals.cspNonce,
      });
    } catch (err) {
      console.error('[fornecedorController.listar]', err);
      return next?.(err);
    }
  },

  create: async (req, res) => {
    try {
      const usuarioId = req.session?.userId;
      if (!usuarioId) {
        if (wantsJSON(req)) return res.status(401).json({ error: 'Não autenticado.' });
        return res.redirect('/login');
      }

      let { nome, email, cnpj, telefone } = req.body;
      const nomeTrim = (nome || '').trim();
      const emailTrim = email?.trim() || null;
      const telTrim   = telefone?.trim() || null;

      if (!nomeTrim) {
        const msg = 'Nome é obrigatório.';
        return wantsJSON(req)
          ? res.status(400).json({ error: msg })
          : res.redirect('/dados-fornecedor?ok=0&msg=' + encodeURIComponent(msg));
      }

      let cnpjDigits = null;
      if (cnpj) {
        cnpjDigits = onlyDigits(cnpj);
        if (cnpjDigits && cnpjDigits.length !== 14) {
          const msg = 'CNPJ deve ter 14 dígitos (somente números).';
          return wantsJSON(req)
            ? res.status(400).json({ error: msg })
            : res.redirect('/dados-fornecedor?ok=0&msg=' + encodeURIComponent(msg));
        }
      }

      await Fornecedor.create(
        { nome: nomeTrim, email: emailTrim, cnpj: cnpjDigits, telefone: telTrim },
        usuarioId
      );

      const okMsg = 'Fornecedor cadastrado com sucesso!';
      return wantsJSON(req)
        ? res.status(201).json({ ok: true, message: okMsg })
        : res.redirect('/dados-fornecedor?ok=1&msg=' + encodeURIComponent(okMsg));
    } catch (err) {
      console.error('[fornecedorController.create]', err);

      if (err?.code === 'ER_DUP_ENTRY') {
        const msg = 'Já existe fornecedor com estes dados para o seu usuário.';
        return wantsJSON(req)
          ? res.status(409).json({ error: msg })
          : res.redirect('/dados-fornecedor?ok=0&msg=' + encodeURIComponent(msg));
      }

      const msg = 'Erro ao cadastrar fornecedor.';
      return wantsJSON(req)
        ? res.status(500).json({ error: msg })
        : res.redirect('/dados-fornecedor?ok=0&msg=' + encodeURIComponent(msg));
    }
  },

  editar: async (req, res) => {
    try {
      const usuarioId = req.session?.userId;
      if (!usuarioId) {
        if (wantsJSON(req)) return res.status(401).json({ error: 'Não autenticado.' });
        return res.redirect('/login');
      }

      const { id } = req.params;
      let { nome, email, cnpj, telefone } = req.body;

      const nomeTrim = (nome || '').trim();
      const emailTrim = email?.trim() || null;
      const telTrim   = telefone?.trim() || null;

      if (!nomeTrim) {
        const msg = 'Nome é obrigatório.';
        return wantsJSON(req)
          ? res.status(400).json({ error: msg })
          : res.redirect('/dados-fornecedor?ok=0&msg=' + encodeURIComponent(msg));
      }

      let cnpjDigits = null;
      if (cnpj) {
        cnpjDigits = onlyDigits(cnpj);
        if (cnpjDigits && cnpjDigits.length !== 14) {
          const msg = 'CNPJ deve ter 14 dígitos (somente números).';
          return wantsJSON(req)
            ? res.status(400).json({ error: msg })
            : res.redirect('/dados-fornecedor?ok=0&msg=' + encodeURIComponent(msg));
        }
      }

      // ATENÇÃO: o model que te passei espera (id, usuarioId, data)
      const result = await Fornecedor.updateById(id, usuarioId, {
        nome: nomeTrim,
        email: emailTrim,
        cnpj: cnpjDigits,
        telefone: telTrim
      });

      if (!result || !result.affectedRows) {
        const msg = 'Fornecedor não encontrado.';
        return wantsJSON(req)
          ? res.status(404).json({ error: msg })
          : res.redirect('/dados-fornecedor?ok=0&msg=' + encodeURIComponent(msg));
      }

      const okMsg = 'Fornecedor atualizado com sucesso!';
      return wantsJSON(req)
        ? res.json({
            ok: true,
            message: okMsg,
            fornecedor: { id, nome: nomeTrim, email: emailTrim, cnpj: cnpjDigits, telefone: telTrim }
          })
        : res.redirect('/dados-fornecedor?ok=1&msg=' + encodeURIComponent(okMsg));
    } catch (err) {
      console.error('[fornecedorController.editar]', err);

      if (err?.code === 'ER_DUP_ENTRY') {
        const msg = 'Já existe fornecedor com estes dados para o seu usuário.';
        return wantsJSON(req)
          ? res.status(409).json({ error: msg })
          : res.redirect('/dados-fornecedor?ok=0&msg=' + encodeURIComponent(msg));
      }

      const msg = 'Erro ao atualizar fornecedor.';
      return wantsJSON(req)
        ? res.status(500).json({ error: msg })
        : res.redirect('/dados-fornecedor?ok=0&msg=' + encodeURIComponent(msg));
    }
  },

  deletar: async (req, res) => {
    try {
      const usuarioId = req.session?.userId;
      if (!usuarioId) {
        if (wantsJSON(req)) return res.status(401).json({ error: 'Não autenticado.' });
        return res.redirect('/login');
      }

      const { id } = req.params;
      const result = await Fornecedor.deleteById(id, usuarioId);

      if (!result || !result.affectedRows) {
        const msg = 'Fornecedor não encontrado.';
        return wantsJSON(req)
          ? res.status(404).json({ error: msg })
          : res.redirect('/dados-fornecedor?ok=0&msg=' + encodeURIComponent(msg));
      }

      const okMsg = 'Fornecedor excluído com sucesso!';
      return wantsJSON(req)
        ? res.json({ ok: true, message: okMsg })
        : res.redirect('/dados-fornecedor?ok=1&msg=' + encodeURIComponent(okMsg));
    } catch (err) {
      console.error('[fornecedorController.deletar]', err);
      const msg = 'Erro ao excluir fornecedor.';
      return wantsJSON(req)
        ? res.status(500).json({ error: msg })
        : res.redirect('/dados-fornecedor?ok=0&msg=' + encodeURIComponent(msg));
    }
  }
};
