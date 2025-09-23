const Funcionario = require('../models/funcionarioModel');
const GastosFixos = require('../models/financeiro/gastos-fixosModel');

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function findGastoFixoSalarioByNome(nomeFuncionario, userId) {
  const lista = await GastosFixos.getAll(userId);
  const nomeOld = `Salário - ${nomeFuncionario}`;
  return (lista || []).find(g => g.nome === nomeOld) || null;
}

module.exports = {
  listar: async (req, res) => {
    const funcionarios = await Funcionario.getAll(req.session.userId);
    res.render('funcionario', { funcionarios });
  },

  criar: async (req, res) => {
    try {
      const userId = req.session.userId;
      const dados = { ...req.body };

      if (req.file) {
        dados.foto = req.file.filename;
      }

      await Funcionario.create(dados, userId);

      if (dados.salario && Number(dados.salario) > 0) {
        const existente = await findGastoFixoSalarioByNome(dados.nome, userId);
        if (!existente) {
          await GastosFixos.create(
            {
              nome: `Salário - ${dados.nome}`,
              valor: Number(dados.salario),
              data_inicio: dados.data_admissao || todayStr(),
              data_fim: null,
              recorrencia: 'mensal',
              observacao: `Salário do funcionário ${dados.nome}`
            },
            userId
          );
        }
      }

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
    try {
      const userId = req.session.userId;
      const id = req.params.id;

      const antes = await Funcionario.getById(id, userId);
      await Funcionario.update(id, req.body, userId);

      const nomeNovo = req.body.nome || (antes && antes.nome);
      const salarioNovo = req.body.salario !== undefined ? Number(req.body.salario) : (antes ? Number(antes.salario || 0) : 0);

      if (nomeNovo) {
        const fixos = await GastosFixos.getAll(userId);
        const nomeAntigo = antes ? `Salário - ${antes.nome}` : null;
        const nomePossivelNovo = `Salário - ${nomeNovo}`;
        let gf = null;

        if (nomeAntigo) gf = (fixos || []).find(g => g.nome === nomeAntigo) || null;
        if (!gf) gf = (fixos || []).find(g => g.nome === nomePossivelNovo) || null;

        if (salarioNovo > 0) {
          if (gf) {
            await GastosFixos.update(
              gf.id,
              {
                nome: nomePossivelNovo,
                valor: salarioNovo,
                data_fim: null,
                recorrencia: 'mensal',
                observacao: `Salário do funcionário ${nomeNovo}`
              },
              userId
            );
          } else {
            await GastosFixos.create(
              {
                nome: nomePossivelNovo,
                valor: salarioNovo,
                data_inicio: todayStr(),
                data_fim: null,
                recorrencia: 'mensal',
                observacao: `Salário do funcionário ${nomeNovo}`
              },
              userId
            );
          }
        } else if (gf && (!req.body.salario || Number(req.body.salario) <= 0)) {
          await GastosFixos.update(gf.id, { data_fim: todayStr() }, userId);
        }
      }

      res.redirect('/funcionarios');
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      res.redirect('/funcionarios?erro=1');
    }
  },

  deletar: async (req, res) => {
    try {
      const userId = req.session.userId;
      const id = req.params.id;

      const func = await Funcionario.getById(id, userId);
      await Funcionario.delete(id, userId);

      if (func && func.nome) {
        const gf = await findGastoFixoSalarioByNome(func.nome, userId);
        if (gf) {
          await GastosFixos.update(gf.id, { data_fim: todayStr() }, userId);
        }
      }

      res.redirect('/funcionarios');
    } catch (error) {
      console.error('Erro ao deletar funcionário:', error);
      res.redirect('/funcionarios?erro=1');
    }
  }
};
