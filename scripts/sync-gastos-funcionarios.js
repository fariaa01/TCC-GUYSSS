const db = require('../db');
const GastosFixos = require('../src/models/sistema/financeiro/gastos-fixosModel');

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function syncGastosFuncionarios() {
  try {
    console.log('🔄 Sincronizando gastos fixos com funcionários...');
    
    const [funcionarios] = await db.query('SELECT * FROM funcionarios WHERE salario > 0');
    console.log(`📋 Encontrados ${funcionarios.length} funcionários com salário`);
    
    for (const funcionario of funcionarios) {
      const userId = funcionario.usuario_id;
      const nomeFuncionario = funcionario.nome;
      const salario = funcionario.salario;
      const dataAdmissao = funcionario.data_admissao;
      
      console.log(`\n👤 Verificando: ${nomeFuncionario} (Salário: R$ ${salario})`);
      
      // Buscar gastos fixos existentes
      const gastosFixos = await GastosFixos.getAll(userId);
      const nomeGastoEsperado = `Salário - ${nomeFuncionario}`;
      
      const gastoExistente = gastosFixos.find(gasto => gasto.nome === nomeGastoEsperado);
      
      if (gastoExistente) {
        console.log(`✅ Gasto fixo já existe: ${nomeGastoEsperado}`);
        
        // Verificar se o valor está correto
        if (parseFloat(gastoExistente.valor) !== parseFloat(salario)) {
          console.log(`🔧 Atualizando valor: R$ ${gastoExistente.valor} → R$ ${salario}`);
          await GastosFixos.update(
            gastoExistente.id,
            {
              valor: parseFloat(salario)
            },
            userId
          );
        }
      } else {
        console.log(`➕ Criando novo gasto fixo: ${nomeGastoEsperado}`);
        await GastosFixos.create(
          {
            nome: nomeGastoEsperado,
            valor: parseFloat(salario),
            data_inicio: dataAdmissao || todayStr(),
            data_fim: null,
            recorrencia: 'mensal',
            observacao: `Salário do funcionário ${nomeFuncionario}`
          },
          userId
        );
        console.log(`✅ Gasto fixo criado com sucesso!`);
      }
    }
    
    console.log('\n🎉 Sincronização concluída com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    process.exit(1);
  }
}

// Executar a sincronização
syncGastosFuncionarios();