  const Estoque = require('../models/estoque/estoqueModel');
  const produtosModel = require('../models/estoque/produtoModel');
  const fornecedoresModel = require('../models/estoque/fornecedorModel');

  function uniq(arr) {
    return [...new Set(arr.filter(Boolean))];
  }

  module.exports = {
    listar: async (req, res) => {
      try {
        const usuarioId = req.session.userId;
        if (!usuarioId) return res.redirect('/login');

        const filtrosAtuais = {
          categoria: req.query.categoria || '',
          fornecedor: req.query.fornecedor || '',
          validade: req.query.validade || ''
        };

        const produtosRaw = await Estoque.getFiltrado({
          categoria: filtrosAtuais.categoria || null,
          fornecedor: filtrosAtuais.fornecedor || null,
          validade: filtrosAtuais.validade || null,
          usuarioId
        });

        const produtos = (produtosRaw || []).map(p => ({
          ...p,
          valor: p?.valor != null ? Number(p.valor) : 0
        }));

        const categoriasUnicas = uniq((produtosRaw || []).map(p => p.categoria));
        const fornecedoresUnicos = uniq((produtosRaw || []).map(p => p.fornecedor));

        const produtosCadastrados = await produtosModel.listarTodos(usuarioId);
        const fornecedoresCadastrados = await fornecedoresModel.listarTodos(usuarioId);

        return res.render('estoque', {
          produtos,
          categoriasUnicas,
          fornecedoresUnicos,
          filtrosAtuais,
          produtosCadastrados,
          fornecedoresCadastrados,
          cspNonce: res.locals.cspNonce 
        });
      } catch (err) {
        console.error('[Estoque.listar] Erro:', err);
        return res.redirect('/estoque?ok=0&msg=Erro ao carregar o estoque');
      }
    },

    criar: async (req, res) => {
      try {
        const usuarioId = req.session.userId;
        if (!usuarioId) return res.redirect('/login');

        await Estoque.create(req.body, usuarioId);
        return res.redirect('/estoque?ok=1&msg=Produto adicionado ao estoque');
      } catch (err) {
        console.error('[Estoque.criar] Erro:', err);
        return res.redirect('/estoque?ok=0&msg=Não foi possível adicionar o produto');
      }
    },

    atualizar: async (req, res) => {
      try {
        const usuarioId = req.session.userId;
        if (!usuarioId) return res.redirect('/login');

        await Estoque.update(req.params.id, req.body, usuarioId);
        return res.redirect('/estoque?ok=1&msg=Registro atualizado');
      } catch (err) {
        console.error('[Estoque.atualizar] Erro:', err);
        return res.redirect('/estoque?ok=0&msg=Não foi possível atualizar o registro');
      }
    },

    deletar: async (req, res) => {
      try {
        const usuarioId = req.session.userId;
        if (!usuarioId) return res.redirect('/login');

        await Estoque.delete(req.params.id, usuarioId);
        return res.redirect('/estoque?ok=1&msg=Registro excluído');
      } catch (err) {
        console.error('[Estoque.deletar] Erro:', err);
        return res.redirect('/estoque?ok=0&msg=Não foi possível excluir o registro');
      }
    }
  };
