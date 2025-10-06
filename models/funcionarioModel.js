const db = require('../db');

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
    const { nome, cargo, email, data_admissao, salario, cpf, telefone, estado, foto } = dados;
    
    let query = `
      UPDATE funcionarios 
      SET nome = ?, cargo = ?, email = ?, data_admissao = ?, salario = ?, cpf = ?, telefone = ?, estado = ?`;
    let params = [nome, cargo, email, data_admissao, salario, cpf, telefone, estado];
    
    if (foto) {
      query += `, foto = ?`;
      params.push(foto);
    }
    
    query += ` WHERE id = ? AND usuario_id = ?`;
    params.push(id, usuarioId);
    
    await db.query(query, params);
  },

  delete: async (id, usuarioId) => {
    await db.query('DELETE FROM funcionarios WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  }
};
