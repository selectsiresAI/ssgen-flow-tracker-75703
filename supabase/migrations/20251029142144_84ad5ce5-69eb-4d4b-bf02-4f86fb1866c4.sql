-- Limpar dados de demonstração de todas as tabelas
-- ATENÇÃO: Esta operação irá deletar TODOS os dados existentes

-- Limpar ordens de serviço
DELETE FROM service_orders;

-- Limpar clientes
DELETE FROM clients;

-- Limpar representantes
DELETE FROM representantes;

-- Limpar coordenadores
DELETE FROM coordenadores;

-- Limpar ordens (PowerBI)
DELETE FROM orders;
