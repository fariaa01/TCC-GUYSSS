-- Adicionar campo de duração para bônus no histórico salarial
ALTER TABLE historico_salarial 
ADD COLUMN duracao_meses INT NULL COMMENT 'Duração do bônus em meses (apenas para tipo Bônus)';

-- Adicionar comentário explicativo
ALTER TABLE historico_salarial 
MODIFY COLUMN duracao_meses INT NULL COMMENT 'Duração em meses para bônus temporários. NULL para aumentos permanentes';