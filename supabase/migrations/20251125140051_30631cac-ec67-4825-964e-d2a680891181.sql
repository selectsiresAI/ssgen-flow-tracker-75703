-- Atualizar o cliente Adriano para ordem_servico_ssgen = 361
UPDATE clients 
SET ordem_servico_ssgen = 361,
    updated_at = now()
WHERE id = 'dcdfadf2-64a3-434d-a114-4d6c34f376ee';

-- Verificar e ajustar a sequência de service_orders para continuar de 362
-- Isso garante que novas ordens sejam criadas com números crescentes
SELECT setval('service_orders_os_seq', 361, true);