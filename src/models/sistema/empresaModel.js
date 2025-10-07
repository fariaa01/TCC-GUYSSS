const db = require('../../../db');

module.exports = {
  async getByUserId(usuarioId) {
    const [[row]] = await db.query(
      'SELECT nome_empresa FROM usuarios WHERE id = ?',
      [usuarioId]
    );
    return row?.nome_empresa || null;
  },

  async updateNomeEmpresa(usuarioId, nome_empresa) {
    await db.query(
      'UPDATE usuarios SET nome_empresa = ? WHERE id = ?',
      [nome_empresa, usuarioId]
    );
  }
};
