const cron = require('node-cron');
const { gerarParcelasDoMes, criarAlertasVencimento5d, gerarProvisoesPessoais } = require('../services/fixedExpenseService');
const db = require('../db');

async function empresasAtivas() {
  const [rows] = await db.query(`SELECT id FROM empresas WHERE status = 'ativa'`);
  return rows.map(r => r.id);
}

cron.schedule('0 3 * * *', async () => {
  try {
    const empresas = await empresasAtivas();
    for (const empId of empresas) {
      await gerarParcelasDoMes(empId, new Date());
      await criarAlertasVencimento5d(empId);
      await gerarProvisoesPessoais(empId, new Date());
    }
    console.log('[CRON] Rotinas financeiras executadas');
  } catch (e) {
    console.error('[CRON] Erro', e);
  }
}, { timezone: 'America/Sao_Paulo' });

module.exports = {};
