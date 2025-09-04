const Estoque = require('../../models/estoque/estoqueModel');
const produtosModel = require('../../models/estoque/produtoModel');
const fornecedoresModel = require('../../models/estoque/fornecedorModel');

function unicos(lista) {
  return [...new Set((lista || []).filter(v => v && String(v).trim() !== ''))];
}

function soData(d) {
  if (!d) return null;
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

function contarAlertas(lista) {
  const hoje = soData(new Date());
  let vencidos = 0;
  let proximos = 0;
  let baixos = 0;

  for (const p of (lista || [])) {
    const validade = p.validade ? soData(p.validade) : null;
    const qtd = Number(p.quantidade);
    const min = Number(p.quantidade_minima);

    if (!Number.isNaN(qtd) && !Number.isNaN(min) && qtd < min) baixos++;

    if (validade) {
      const diff = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
      if (validade < hoje) vencidos++;
      else if (diff >= 0 && diff <= 7) proximos++;
    }
  }

  return {
    vencidos,
    proximos,
    baixos,
    total: vencidos + proximos + baixos
  };
}

module.exports = {
  listar: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) return res.redirect('/login');

      const filtros = {
        produto: req.query.produto || '',
        categoria: req.query.categoria || '',
        fornecedor: req.query.fornecedor || '',
        validade: req.query.validade || '',
        status: req.query.status || ''
      };

      const todos = await Estoque.getFiltrado({
        categoria: null,
        fornecedor: null,
        validade: null,
        usuarioId
      });

      let lista = await Estoque.getFiltrado({
        categoria: filtros.categoria || null,
        fornecedor: filtros.fornecedor || null,
        validade: filtros.validade || null,
        usuarioId
      });

      if (filtros.produto) {
        lista = lista.filter(p => String(p.produto) === filtros.produto);
      }
      if (filtros.status === 'abaixoMinimo') {
        lista = lista.filter(p => Number(p.quantidade) < Number(p.quantidade_minima));
      }

      const produtos = (lista || []).map(p => ({
        ...p,
        valor: p?.valor != null ? Number(p.valor) : 0
      }));

      const nomesProdutos = unicos((todos || []).map(p => p.produto)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      const categoriasUnicas = unicos((todos || []).map(p => p.categoria)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      const fornecedoresUnicos = unicos((todos || []).map(p => p.fornecedor)).sort((a, b) => a.localeCompare(b, 'pt-BR'));

      const produtosCadastrados = await produtosModel.listarTodos(usuarioId);
      const fornecedoresCadastrados = await fornecedoresModel.listarTodos(usuarioId);

      const { vencidos, proximos, baixos, total } = contarAlertas(todos);

      return res.render('estoque', {
        produtos,
        nomesProdutos,
        categoriasUnicas,
        fornecedoresUnicos,
        filtros,
        produtosCadastrados,
        fornecedoresCadastrados,
        cntVencidos: vencidos,
        cntProx7: proximos,
        cntBaixo: baixos,
        totalAlerts: total,
        cspNonce: res.locals.cspNonce
      });
    } catch (err) {
      console.error('Erro ao listar estoque:', err);
      return res.redirect('/estoque?ok=0&msg=Erro ao carregar o estoque');
    }
  },

  criar: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) return res.redirect('/login');

      await Estoque.create(req.body, usuarioId);
      return res.redirect('/estoque?ok=1&msg=Produto adicionado');
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      return res.redirect('/estoque?ok=0&msg=Não foi possível adicionar');
    }
  },

  atualizar: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) {
        if (req.xhr || req.headers.accept?.includes('json')) {
          return res.status(401).json({ ok: false, message: 'Não autenticado' });
        }
        return res.redirect('/login');
      }

      await Estoque.update(req.params.id, req.body, usuarioId);

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ ok: true, message: 'Atualizado' });
      }

      return res.redirect('/estoque?ok=1&msg=Atualizado');
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(500).json({ ok: false, message: 'Erro ao atualizar' });
      }

      return res.redirect('/estoque?ok=0&msg=Não foi possível atualizar');
    }
  },

  deletar: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) return res.redirect('/login');

      await Estoque.delete(req.params.id, usuarioId);
      return res.redirect('/estoque?ok=1&msg=Excluído');
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
      return res.redirect('/estoque?ok=0&msg=Não foi possível excluir');
    }
  }
};
