// ...existing code...
const db = require('../db');
const Empresa = require('../models/empresaModel');

module.exports = {
  renderDashboard: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) return res.redirect('/login');

      const [rowsTotalFunc] = await db.query(
        'SELECT COUNT(*) as total_func FROM funcionarios WHERE usuario_id = ?',
        [usuarioId]
      );
      const total_func = rowsTotalFunc[0]?.total_func || 0;

      const [rowsTotalEstoque] = await db.query(
        'SELECT COUNT(*) as total_estoque FROM estoque WHERE usuario_id = ?',
        [usuarioId]
      );
      const total_estoque = rowsTotalEstoque[0]?.total_estoque || 0;

      const [rowsProdutosBaixa] = await db.query(
        'SELECT COUNT(*) as produtos_em_baixa FROM estoque WHERE usuario_id = ? AND quantidade < quantidade_minima',
        [usuarioId]
      );
      const produtos_em_baixa = rowsProdutosBaixa[0]?.produtos_em_baixa || 0;

      // conta produtos vencidos e próximos (detecção de coluna de validade)
      let total_vencidos = 0;
      let total_proximos = 0;
      try {
        const [cols] = await db.query("SHOW COLUMNS FROM estoque");
        const colNames = cols.map(c => c.Field);
        const cand = colNames.find(n => /validade|venc|data.*venc|data_valid|data_vencimento|data_venc/i.test(n));

        if (cand) {
          const diasProximo = 30; // ajuste o intervalo conforme necessário

          const [rowsVencidos] = await db.query(
            `SELECT COUNT(*) as total_vencidos FROM estoque WHERE usuario_id = ? AND \`${cand}\` < CURDATE()`,
            [usuarioId]
          );
          const [rowsProximos] = await db.query(
            `SELECT COUNT(*) as total_proximos FROM estoque WHERE usuario_id = ? AND \`${cand}\` BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)`,
            [usuarioId, diasProximo]
          );

          total_vencidos = rowsVencidos[0]?.total_vencidos || 0;
          total_proximos = rowsProximos[0]?.total_proximos || 0;
        } else {
          console.warn("Nenhuma coluna de validade encontrada em 'estoque'. Verifique DESCRIBE estoque.");
        }
      } catch (e) {
        console.warn("Falha ao detectar coluna de validade em 'estoque':", e.message);
      }

      const [rowsEntrada] = await db.query(
        `SELECT SUM(valor) as total_entrada 
         FROM financeiro 
         WHERE usuario_id = ? 
         AND tipo = 'entrada' 
         AND MONTH(data) = MONTH(CURDATE()) 
         AND YEAR(data) = YEAR(CURDATE())`,
        [usuarioId]
      );
      const total_entrada = rowsEntrada[0]?.total_entrada || 0;

      const [rowsSaida] = await db.query(
        `SELECT SUM(valor) as total_saida 
         FROM financeiro 
         WHERE usuario_id = ? 
         AND tipo = 'saida' 
         AND MONTH(data) = MONTH(CURDATE()) 
         AND YEAR(data) = YEAR(CURDATE())`,
        [usuarioId]
      );
      const total_saida = rowsSaida[0]?.total_saida || 0;

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
        total_vencidos,
        total_proximos,
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
