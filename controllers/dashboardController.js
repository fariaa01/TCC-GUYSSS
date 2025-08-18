const db = require('../db');
const Empresa = require('../models/empresaModel');

module.exports = {
  renderDashboard: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) return res.redirect('/login');

      const [[{ total_func }]] = await db.query(
        'SELECT COUNT(*) as total_func FROM funcionarios WHERE usuario_id = ?',
        [usuarioId]
      );

      const [[{ total_estoque }]] = await db.query(
        'SELECT COUNT(*) as total_estoque FROM estoque WHERE usuario_id = ?',
        [usuarioId]
      );

      const [[{ produtos_em_baixa }]] = await db.query(
        'SELECT COUNT(*) as produtos_em_baixa FROM estoque WHERE usuario_id = ? AND quantidade < quantidade_minima',
        [usuarioId]
      );

      const [[{ total_entrada }]] = await db.query(
        `SELECT SUM(valor) as total_entrada 
         FROM financeiro 
         WHERE usuario_id = ? 
         AND tipo = 'entrada' 
         AND MONTH(data) = MONTH(CURRENT_DATE()) 
         AND YEAR(data) = YEAR(CURRENT_DATE())`,
        [usuarioId]
      );

      const [[{ total_saida }]] = await db.query(
        `SELECT SUM(valor) as total_saida 
         FROM financeiro 
         WHERE usuario_id = ? 
         AND tipo = 'saida' 
         AND MONTH(data) = MONTH(CURRENT_DATE()) 
         AND YEAR(data) = YEAR(CURRENT_DATE())`,
        [usuarioId]
      );

      const [resultados] = await db.query(`
        SELECT 
          MONTH(data) AS mes,
          SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) AS entradas,
          SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) AS saidas
        FROM financeiro
        WHERE usuario_id = ?
        GROUP BY MONTH(data)
        ORDER BY mes
      `, [usuarioId]);

      const entradas = Array(12).fill(0);
      const saidas = Array(12).fill(0);

      resultados.forEach(r => {
        entradas[r.mes - 1] = parseFloat(r.entradas || 0);
        saidas[r.mes - 1] = parseFloat(r.saidas || 0);
      });

      const nome_empresa = await Empresa.getByUserId(usuarioId) || '';

      res.render('dashboard', {
        nome_empresa,
        total_func,
        total_estoque,
        produtos_em_baixa,
        total_entrada: (parseFloat(total_entrada) || 0).toFixed(2),
        total_saida: (parseFloat(total_saida) || 0).toFixed(2),
        entradas,
        saidas,
        userId: usuarioId 
      });

    } catch (err) {
      console.error("Erro ao carregar o dashboard:", err);
      res.status(500).send("Erro ao carregar dashboard.");
    }
  }
};
