const db = require('../../../../db');

class HistoricoSalarialModel {
    static async criar(dados) {
        try {
            console.log('[HistoricoSalarialModel.criar] Dados recebidos:', dados);
            
            const { 
                funcionario_id, 
                tipo, 
                salario_anterior, 
                salario_novo, 
                cargo_anterior, 
                cargo_novo, 
                data_reajuste, 
                motivo, 
                usuario_responsavel, 
                duracao_meses 
            } = dados;
            
            // Validação básica
            if (!funcionario_id || !tipo || !data_reajuste) {
                throw new Error('Campos obrigatórios não fornecidos: funcionario_id, tipo, data_reajuste');
            }
            
            // Validação específica para bônus
            if (tipo === 'Bônus' && !duracao_meses) {
                throw new Error('Duração em meses é obrigatória para bônus');
            }
            
            const queryParams = [
                funcionario_id, 
                tipo, 
                salario_anterior, 
                salario_novo, 
                cargo_anterior, 
                cargo_novo, 
                data_reajuste, 
                motivo, 
                usuario_responsavel, 
                duracao_meses
            ];
            
            console.log('[HistoricoSalarialModel.criar] Parâmetros da query:', queryParams);
            
            const query = `INSERT INTO historico_salarial 
                         (funcionario_id, tipo, salario_anterior, salario_novo, cargo_anterior, cargo_novo, data_reajuste, motivo, usuario_responsavel, duracao_meses) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            console.log('[HistoricoSalarialModel.criar] Executando query:', query);
            
            const [result] = await db.query(query, queryParams);
            
            console.log('[HistoricoSalarialModel.criar] Resultado da inserção:', result);
            
            return result;
        } catch (error) {
            console.error('[HistoricoSalarialModel.criar] Erro:', error);
            throw error;
        }
    }
    
    static async obterPorFuncionario(funcionario_id) {
        try {
            const [rows] = await db.query(
                `SELECT h.*, f.nome as funcionario_nome
                 FROM historico_salarial h
                 INNER JOIN funcionarios f ON h.funcionario_id = f.id
                 WHERE h.funcionario_id = ?
                 ORDER BY h.data_reajuste DESC, h.created_at DESC`,
                [funcionario_id]
            );
            
            return rows;
        } catch (error) {
            console.error('[HistoricoSalarialModel.obterPorFuncionario] Erro:', error);
            throw error;
        }
    }
    
    static async obterTodos() {
        try {
            const [rows] = await db.query(
                `SELECT h.*, f.nome as funcionario_nome
                 FROM historico_salarial h
                 INNER JOIN funcionarios f ON h.funcionario_id = f.id
                 ORDER BY h.data_reajuste DESC, h.created_at DESC`
            );
            
            return rows;
        } catch (error) {
            console.error('[HistoricoSalarialModel.obterTodos] Erro:', error);
            throw error;
        }
    }
    
    static async excluir(id) {
        try {
            const [result] = await db.query('DELETE FROM historico_salarial WHERE id = ?', [id]);
            return result;
        } catch (error) {
            console.error('[HistoricoSalarialModel.excluir] Erro:', error);
            throw error;
        }
    }
    
    static async calcularEstatisticas(funcionario_id) {
        try {
            const [rows] = await db.query(
                `SELECT 
                    COUNT(*) as total_reajustes,
                    MIN(salario_anterior) as menor_salario,
                    MAX(salario_novo) as maior_salario,
                    AVG(salario_novo - salario_anterior) as media_aumento
                 FROM historico_salarial 
                 WHERE funcionario_id = ?`,
                [funcionario_id]
            );
            
            return rows[0] || {
                total_reajustes: 0,
                menor_salario: 0,
                maior_salario: 0,
                media_aumento: 0
            };
        } catch (error) {
            console.error('[HistoricoSalarialModel.calcularEstatisticas] Erro:', error);
            return {
                total_reajustes: 0,
                menor_salario: 0,
                maior_salario: 0,
                media_aumento: 0
            };
        }
    }
}

module.exports = HistoricoSalarialModel;
