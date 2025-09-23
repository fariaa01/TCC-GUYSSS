const Menu = require('../models/menuModel');
const Audit = require('../models/auditModel');
const Usuario = require('../models/userModel');

module.exports = {
  renderMenu: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) return res.redirect('/login');

      const pratos = await Menu.getAllByUsuario(usuarioId, { incluirArquivados: true });
      res.render('menu', { pratos });
    } catch (err) {
      console.error('Erro ao carregar o menu:', err);
      res.status(500).send('Erro ao carregar o menu');
    }
  },

  createPrato: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      const precoNum = Number(String(req.body.preco).replace(',', '.'));

      const dados = {
        ...req.body,
        preco: Number.isNaN(precoNum) ? 0 : precoNum,
        imagem: req.file ? req.file.filename : null,
        usuario_id: usuarioId,
        destaque: req.body.destaque ? 1 : 0,
        is_disponivel: 1,
        arquivado: 0,
        atualizado_por: usuarioId
      };

      await Menu.create(dados);
      res.redirect('/menu');
    } catch (err) {
      console.error('Erro ao cadastrar prato:', err);
      res.status(500).send('Erro ao cadastrar prato');
    }
  },

  editarPrato: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      const precoNum = req.body.preco !== undefined
        ? Number(String(req.body.preco).replace(',', '.'))
        : undefined;

      const dados = {
        ...req.body,
        destaque: req.body.destaque ? 1 : 0,
        atualizado_por: usuarioId
      };

      if (req.file) dados.imagem = req.file.filename;
      if (precoNum !== undefined && !Number.isNaN(precoNum)) dados.preco = precoNum;

      await Menu.update(req.params.id, dados);
      res.redirect('/menu');
    } catch (err) {
      console.error('Erro ao editar prato:', err);
      res.status(500).send('Erro ao editar prato');
    }
  },

  excluirPrato: async (req, res) => {
    try {
      await Menu.delete(req.params.id);
      res.redirect('/menu');
    } catch (err) {
      console.error('Erro ao excluir prato:', err);
      res.status(500).send('Erro ao excluir prato');
    }
  },

  updateParcial: async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ ok: false, msg: 'Não autenticado.' });

      const permitidos = ['nome_prato', 'preco', 'is_disponivel', 'arquivado'];
      const payload = {};
      for (const k of permitidos) {
        if (k in req.body) payload[k] = req.body[k];
      }
      if (!Object.keys(payload).length) {
        return res.status(400).json({ ok: false, msg: 'Nenhum campo permitido enviado.' });
      }

      const antes = await Menu.getById(id, userId);
      if (!antes) return res.status(404).json({ ok: false, msg: 'Prato não encontrado.' });

      if (payload.preco !== undefined) {
        const n = Number(String(payload.preco).replace(',', '.'));
        if (Number.isNaN(n) || n < 0) {
          return res.status(422).json({ ok: false, msg: 'Preço inválido.' });
        }
        payload.preco = n;
      }

      if (payload.is_disponivel !== undefined) {
        payload.is_disponivel = Number(payload.is_disponivel) ? 1 : 0;
      }
      if (payload.arquivado !== undefined) {
        payload.arquivado = Number(payload.arquivado) ? 1 : 0;
      }

      const finalArquivado = payload.arquivado !== undefined ? payload.arquivado : antes.arquivado;
      if (finalArquivado === 1) {
        payload.is_disponivel = 0;
      } else if (payload.arquivado === 0) {
        payload.is_disponivel = 1;
      }

      payload.atualizado_por = userId;

      await Menu.updatePartial(id, userId, payload);
      const depois = await Menu.getById(id, userId);
      
      await Audit.log({
        user_id: userId,
        entity: 'menu',
        entity_id: id,
        action: 'update_inline',
        before_json: antes,
        after_json: depois
      });

      return res.json({ ok: true, data: depois });
    } catch (err) {
      console.error('Erro ao atualizar prato (inline):', err);
      return res.status(500).json({ ok: false, msg: 'Erro ao atualizar prato.' });
    }
  },

  publicoPorUsuario: async (req, res) => {
    try {
      const usuarioId = Number(req.params.usuarioId);
      if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.status(400).send('ID de usuário inválido.');
      }

      const dono = await Usuario.findById(usuarioId);
      if (!dono || !dono.nome_empresa) {
        return res.status(404).send('Restaurante não encontrado.');
      }

      const itens = await Menu.getPublicByUsuario(usuarioId);
      return res.render('cardapio_publico', {
        itens,
        empresaNome: dono.nome_empresa
      });
    } catch (err) {
      console.error('Erro ao carregar cardápio público:', err);
      return res.status(500).send('Erro ao carregar cardápio público.');
    }
  },
};
