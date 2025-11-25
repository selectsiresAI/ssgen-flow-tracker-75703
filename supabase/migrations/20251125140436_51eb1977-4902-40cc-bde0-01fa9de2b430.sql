-- Corrigir OS SSGEN da ordem de serviço do cliente Adriano
UPDATE service_orders
SET ordem_servico_ssgen = 361,
    updated_at = now()
WHERE id = 'd6f64049-62e7-40c4-94e1-b703bafd28bf';