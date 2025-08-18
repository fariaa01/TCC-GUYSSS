const Funcionario = require('../models/funcionarioModel');

module.exports = {
  listar: async (req, res) => {
    const funcionarios = await Funcionario.getAll(req.session.userId);
    res.render('funcionario', { funcionarios });
  },

  criar: async (req, res) => {
    try {
      const dados = req.body;

      if (req.file) {
        dados.foto = req.file.filename;
      }

      await Funcionario.create(dados, req.session.userId);
      res.redirect('/funcionarios?success=1');
    } catch (error) {
      if (error.message === 'CPF_DUPLICADO') {
        return res.redirect('/funcionarios?erro=cpf');
      }
      console.error('Erro ao criar funcionário:', error);
      res.redirect('/funcionarios?erro=1');
    }
  },

  atualizar: async (req, res) => {
    await Funcionario.update(req.params.id, req.body, req.session.userId);
    res.redirect('/funcionarios');
  },

  deletar: async (req, res) => {
    await Funcionario.delete(req.params.id, req.session.userId);
    res.redirect('/funcionarios');
  }
};
