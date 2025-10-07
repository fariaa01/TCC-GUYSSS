const pool = require('../../../../db');

function onlyDigits(str = '') {
  return String(str).replace(/\D+/g, '');
}

module.exports = {
  async create({ nome, email, cnpj, telefone, telefone_alternativo, pessoa_responsavel }, usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em fornecedorModel.create');

    const cnpjDigits = cnpj ? onlyDigits(cnpj) : null;
    const sql = `
      INSERT INTO fornecedores
        (usuario_id, nome, email, cnpj, telefone, telefone_alternativo, pessoa_responsavel, tem_telefone_alternativo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const temTelefoneAlternativo = telefone_alternativo && telefone_alternativo.trim() !== '' ? 'sim' : 'nao';
    const params = [
      usuarioId,
      nome,
      email || null,
      cnpjDigits || null,
      telefone || null,
      telefone_alternativo || null,
      pessoa_responsavel || null,
      temTelefoneAlternativo
    ];
    const [result] = await pool.execute(sql, params);
    return { id: result.insertId };
  },

  async listarTodos(usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em listarTodos');
    const [rows] = await pool.query(
      `SELECT id, nome, email, cnpj, telefone, telefone_alternativo, pessoa_responsavel, tem_telefone_alternativo
       FROM fornecedores
       WHERE usuario_id = ?
       ORDER BY nome ASC`,
      [usuarioId]
    );
    return rows;
  },

  async findAll(usuarioId) {
    return module.exports.listarTodos(usuarioId);
  },

  async getAll(usuarioId) {
    return module.exports.listarTodos(usuarioId);
  },

  async update(id, data = {}, usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em fornecedorModel.update');
    if (!id) throw new Error('id ausente em fornecedorModel.update');

    const sql = `
      UPDATE fornecedores SET
        nome = ?, email = ?, cnpj = ?, telefone = ?, telefone_alternativo = ?, pessoa_responsavel = ?,
        website = ?, cep = ?, rua = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?,
        formas_pagamento = ?, banco = ?, agencia = ?, conta = ?, tipo_conta = ?, chave_pix = ?, favorecido = ?,
        limite_credito = ?, tem_telefone_alternativo = ?, updated_at = NOW()
      WHERE id = ? AND usuario_id = ?
    `;
    const params = [
      data.nome,
      data.email || null,
      data.cnpj || null,
      data.telefone || null,
      data.telefone_alternativo || null,
      data.pessoa_responsavel || null,
      data.website || null,
      data.cep || null,
      data.rua || null,
      data.numero || null,
      data.complemento || null,
      data.bairro || null,
      data.cidade || null,
      data.estado || null,
      data.formas_pagamento || null,
      data.banco || null,
      data.agencia || null,
      data.conta || null,
      data.tipo_conta || null,
      data.chave_pix || null,
      data.favorecido || null,
      data.limite_credito !== undefined && data.limite_credito !== '' ? data.limite_credito : null,
      data.temTelefoneAlternativo || 'nao',
      id,
      usuarioId
    ];
    const [result] = await pool.execute(sql, params);
    return result.affectedRows > 0;
  },

  async delete(id, usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em fornecedorModel.delete');
    if (!id) throw new Error('id ausente em fornecedorModel.delete');

    const sql = `DELETE FROM fornecedores WHERE id = ? AND usuario_id = ?`;
    const [result] = await pool.execute(sql, [id, usuarioId]);
    return result.affectedRows > 0;
  },

  async getById(id, usuarioId) {
    const [rows] = await pool.execute(
      'SELECT * FROM fornecedores WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return rows[0] || null;
  },
};