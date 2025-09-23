const Fornecedor = require('../models/estoque/fornecedorModel');
const Estoque = require('../models/estoque/estoqueModel');

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
      return res.render('dados-fornecedor', { fornecedores: fornecedores || [] });
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

      let { nome, email, cnpj, telefone, telefone_alternativo, pessoa_responsavel } = req.body;
      const nomeTrim = (nome || '').trim();
      const emailTrim = email?.trim() || null;
      const telTrim = telefone?.trim() || null;
      const telAltTrim = telefone_alternativo?.trim() || null;
      const pessoaRespTrim = pessoa_responsavel?.trim() || null;
      const temTelAlt = telAltTrim && telAltTrim !== '' ? 'sim' : 'nao';

      if (!nomeTrim) {
        const msg = 'Nome é obrigatório.';
        return wantsJSON(req)
          ? res.status(400).json({ error: msg })
          : res.redirect('/estoque?ok=0&msg=' + encodeURIComponent(msg));
      }

      let cnpjDigits = null;
      if (cnpj) {
        cnpjDigits = onlyDigits(cnpj);
        if (cnpjDigits.length !== 14) {
          const msg = 'CNPJ deve ter 14 dígitos (somente números).';
          return wantsJSON(req)
            ? res.status(400).json({ error: msg })
            : res.redirect('/estoque?ok=0&msg=' + encodeURIComponent(msg));
        }
      }

      await Fornecedor.create(
        {
          nome: nomeTrim,
          email: emailTrim,
          cnpj: cnpjDigits,
          telefone: telTrim,
          telefone_alternativo: telAltTrim,
          pessoa_responsavel: pessoaRespTrim
        },
        usuarioId
      );

      const okMsg = 'Fornecedor cadastrado com sucesso!';
      return wantsJSON(req)
        ? res.status(201).json({ ok: true, message: okMsg })
        : res.redirect('/estoque?ok=1&msg=' + encodeURIComponent(okMsg));
    } catch (err) {
      console.error('Erro ao cadastrar fornecedor:', err);

      if (err && err.code === 'ER_DUP_ENTRY') {
        const msg = 'Já existe fornecedor com estes dados para o seu usuário.';
        return wantsJSON(req)
          ? res.status(409).json({ error: msg })
          : res.redirect('/estoque?ok=0&msg=' + encodeURIComponent(msg));
      }

      const msg = 'Erro ao cadastrar fornecedor.';
      return wantsJSON(req)
        ? res.status(500).json({ error: msg })
        : res.redirect('/estoque?ok=0&msg=' + encodeURIComponent(msg));
    }
  },

  update: async (req, res) => {
    try {
      const usuarioId = req.session?.userId;
      const id = req.params.id;
      const {
        nome, email, cnpj, telefone, telefone_alternativo, pessoa_responsavel,
        website, cep, rua, numero, complemento, bairro, cidade, estado, inscricao_estadual,
        formas_pagamento, limite_credito,
        banco, agencia, conta, tipo_conta, chave_pix, favorecido
      } = req.body;

      // Calcula temTelefoneAlternativo automático
      const telAltTrim = telefone_alternativo?.trim() || null;
      const temTelefoneAlternativo = telAltTrim && telAltTrim !== '' ? 'sim' : 'nao';

      const data = {
        nome: nome?.trim() || null,
        email: email?.trim() || null,
        cnpj: cnpj ? onlyDigits(cnpj) : null,
        telefone: telefone?.trim() || null,
        telefone_alternativo: telAltTrim,
        pessoa_responsavel: pessoa_responsavel?.trim() || null,
        temTelefoneAlternativo,
        website: website?.trim() || null,
        cep: cep?.trim() || null,
        rua: rua?.trim() || null,
        numero: numero?.trim() || null,
        complemento: complemento?.trim() || null,
        bairro: bairro?.trim() || null,
        cidade: cidade?.trim() || null,
        estado: estado?.trim() || null,
        inscricao_estadual: inscricao_estadual?.trim() || null,
        formas_pagamento: formas_pagamento?.trim() || null,
        limite_credito: limite_credito ? Number(limite_credito) : null,
        banco: banco?.trim() || null,
        agencia: agencia?.trim() || null,
        conta: conta?.trim() || null,
        tipo_conta: tipo_conta?.trim() || null,
        chave_pix: chave_pix?.trim() || null,
        favorecido: favorecido?.trim() || null
      };

      await Fornecedor.update(id, data, usuarioId);
      res.redirect(`/fornecedores/${id}`);
    } catch (err) {
      console.error('Erro ao atualizar fornecedor:', err);
      res.status(500).send('Erro ao atualizar fornecedor');
    }
  },

  delete: async (req, res) => {
    try {
      const usuarioId = req.session?.userId; 
      if (!usuarioId) {
        return res.status(401).json({ ok: false, error: 'Não autenticado.' });
      }

      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ ok: false, error: 'ID do fornecedor não informado.' });
      }

      const sucesso = await Fornecedor.delete(id, usuarioId);
      if (sucesso) {
        return res.redirect('/estoque?ok=1&msg=' + encodeURIComponent('Fornecedor excluído com sucesso.'));
      } else {
        return res.redirect('/estoque?ok=0&msg=' + encodeURIComponent('Fornecedor não encontrado ou não pertence ao usuário.'));
      }
    } catch (err) {
      console.error('Erro ao deletar fornecedor:', err);
      return res.redirect('/estoque?ok=0&msg=' + encodeURIComponent('Erro ao excluir fornecedor.'));
    }
  }, 

  detalhes: async (req, res, next) => {
    try{
      const usuarioId = req.session?.userId;
      const id = req.params.id;
      const fornecedor = await Fornecedor.getById(id, usuarioId);
      const historicoCompras = await Estoque.getHistoricoComprasPorFornecedor(fornecedor.nome, usuarioId);
      res.render('detalhes-fornecedor', { fornecedor, historicoCompras });
    }
    catch(err) {
      console.error('[fornecedorController.detalhes]', err);
      return next?.(err);
    }
  }
};