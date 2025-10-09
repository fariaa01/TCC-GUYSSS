const db = require('../../../db');

module.exports = {
  renderRelatorio: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) return res.redirect('/login');

      const periodo = req.query.periodo || 'mes';
      const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1);
      const ano = parseInt(req.query.ano) || (new Date().getFullYear());
      const dataInicio = req.query.dataInicio;
      const dataFim = req.query.dataFim;

      // Determinar condições de filtro baseado no tipo
      let whereClause = '';
      let whereParams = [];

      if (periodo === 'intervalo' && dataInicio && dataFim) {
        // Filtro por intervalo de datas
        whereClause = 'AND data >= ? AND data <= ?';
        whereParams = [dataInicio, dataFim];
      } else if (periodo === 'ano') {
        // Filtro por ano completo
        whereClause = 'AND YEAR(data) = ?';
        whereParams = [ano];
      } else if (periodo === 'mes') {
        // Filtro por mês específico
        whereClause = 'AND MONTH(data) = ? AND YEAR(data) = ?';
        whereParams = [mes, ano];
      } else {
        // Padrão: mês atual
        whereClause = 'AND MONTH(data) = ? AND YEAR(data) = ?';
        whereParams = [mes, ano];
      }

      const [[{ total_func }]] = await db.query(
        'SELECT COUNT(*) as total_func FROM funcionarios WHERE usuario_id = ?',
        [usuarioId]
      );

      const [[{ total_estoque }]] = await db.query(
        'SELECT COUNT(*) as total_estoque FROM estoque WHERE usuario_id = ?',
        [usuarioId]
      );

      const [[{ total_entrada }]] = await db.query(
        `SELECT SUM(valor) as total_entrada 
         FROM financeiro 
         WHERE usuario_id = ? 
         AND tipo = 'entrada' 
         ${whereClause}`,
        [usuarioId, ...whereParams]
      );

      const [[{ total_saida }]] = await db.query(
        `SELECT SUM(valor) as total_saida 
         FROM financeiro 
         WHERE usuario_id = ? 
         AND tipo = 'saida' 
         ${whereClause}`,
        [usuarioId, ...whereParams]
      );

      const [[{ qtd_vendas }]] = await db.query(
        `SELECT COUNT(*) as qtd_vendas 
         FROM financeiro 
         WHERE usuario_id = ? 
         AND tipo = 'entrada' 
         ${whereClause}`,
        [usuarioId, ...whereParams]
      );

      const valorEntrada = parseFloat(total_entrada) || 0;
      const valorSaida = parseFloat(total_saida) || 0;

      const lucro_liquido = (valorEntrada - valorSaida).toFixed(2);
      const ticket_medio = qtd_vendas > 0 ? (valorEntrada / qtd_vendas).toFixed(2) : '0.00';

      let mesAnterior = mes - 1;
      let anoAtual = new Date().getFullYear();
      let anoAnterior = anoAtual;

      if (mesAnterior === 0) {
        mesAnterior = 12;
        anoAnterior -= 1;
      }

      const [[{ total_entrada_anterior }]] = await db.query(
        `SELECT SUM(valor) as total_entrada_anterior 
         FROM financeiro 
         WHERE usuario_id = ? 
         AND tipo = 'entrada' 
         AND MONTH(data) = ? 
         AND YEAR(data) = ?`,
        [usuarioId, mesAnterior, anoAnterior]
      );

      const [[{ total_saida_anterior }]] = await db.query(
        `SELECT SUM(valor) as total_saida_anterior 
         FROM financeiro 
         WHERE usuario_id = ? 
         AND tipo = 'saida' 
         AND MONTH(data) = ? 
         AND YEAR(data) = ?`,
        [usuarioId, mesAnterior, anoAnterior]
      );

      let variacaoEntrada = 0;
      if (total_entrada_anterior && total_entrada_anterior > 0) {
        variacaoEntrada = ((valorEntrada - total_entrada_anterior) / total_entrada_anterior) * 100;
      }

      let variacaoSaida = 0;
      if (total_saida_anterior && total_saida_anterior > 0) {
        variacaoSaida = ((valorSaida - total_saida_anterior) / total_saida_anterior) * 100;
      }

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

      const [categorias_totais] = await db.query(`
        SELECT categoria, SUM(valor) AS total
        FROM financeiro
        WHERE usuario_id = ?
        AND categoria IS NOT NULL
        ${whereClause}
        GROUP BY categoria
      `, [usuarioId, ...whereParams]);

      res.render('sistema/relatorios', {
        total_func,
        total_estoque,
        total_entrada: valorEntrada.toFixed(2),
        total_saida: valorSaida.toFixed(2),
        entradas,
        saidas,
        periodo,
        mes,
        ano,
        dataInicio,
        dataFim,
        variacaoEntrada: variacaoEntrada.toFixed(2),
        total_entrada_anterior: (parseFloat(total_entrada_anterior) || 0).toFixed(2),
        variacaoSaida: variacaoSaida.toFixed(2),
        total_saida_anterior: (parseFloat(total_saida_anterior) || 0).toFixed(2),
        lucro_liquido,
        ticket_medio,
        categorias_totais
      });

    } catch (err) {
      console.error("Erro ao carregar o relatório:", err);
      res.status(500).send("Erro ao carregar relatório.");
    }
  }
};
