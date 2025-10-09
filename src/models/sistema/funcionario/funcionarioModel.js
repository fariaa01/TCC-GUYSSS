const db = require('../../../../db');

module.exports = {
  getAll: async (usuarioId) => {
    const [rows] = await db.query('SELECT * FROM funcionarios WHERE usuario_id = ?', [usuarioId]);
    return rows;
  },

  getById: async (id, usuarioId) => {
    const [rows] = await db.query('SELECT * FROM funcionarios WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
    return rows[0];
  },

  create: async (dados, usuarioId) => {
    const { nome, cargo, email, data_admissao, salario, cpf, telefone, estado, foto } = dados;

    try {
      await db.query(`
        INSERT INTO funcionarios 
        (nome, cargo, email, data_admissao, salario, cpf, telefone, estado, usuario_id, foto)  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [nome, cargo, email, data_admissao, salario, cpf, telefone, estado, usuarioId, foto]
      );
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('CPF_DUPLICADO');
      }
      throw error;
    }
  },

  update: async (id, dados, usuarioId) => {
    const camposParaAtualizar = [];
    const params = [];

    if (dados.nome !== undefined) {
      camposParaAtualizar.push('nome = ?');
      params.push(dados.nome);
    }
    if (dados.cargo !== undefined) {
      camposParaAtualizar.push('cargo = ?');
      params.push(dados.cargo);
    }
    if (dados.email !== undefined) {
      camposParaAtualizar.push('email = ?');
      params.push(dados.email);
    }
    if (dados.data_admissao !== undefined) {
      camposParaAtualizar.push('data_admissao = ?');
      params.push(dados.data_admissao);
    }
    if (dados.salario !== undefined) {
      camposParaAtualizar.push('salario = ?');
      params.push(dados.salario);
    }
    if (dados.cpf !== undefined) {
      camposParaAtualizar.push('cpf = ?');
      params.push(dados.cpf);
    }
    if (dados.telefone !== undefined) {
      camposParaAtualizar.push('telefone = ?');
      params.push(dados.telefone);
    }
    if (dados.estado !== undefined) {
      camposParaAtualizar.push('estado = ?');
      params.push(dados.estado);
    }
    if (dados.foto !== undefined) {
      camposParaAtualizar.push('foto = ?');
      params.push(dados.foto);
    }

    if (camposParaAtualizar.length === 0) {
      console.log('Nenhum campo para atualizar');
      return;
    }
    
    const query = `UPDATE funcionarios SET ${camposParaAtualizar.join(', ')} WHERE id = ? AND usuario_id = ?`;
    params.push(id, usuarioId);
    
    console.log('Query de atualização:', query);
    console.log('Parâmetros:', params);
    
    await db.query(query, params);
  },

  delete: async (id, usuarioId) => {
    await db.query('DELETE FROM funcionarios WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  }
};
