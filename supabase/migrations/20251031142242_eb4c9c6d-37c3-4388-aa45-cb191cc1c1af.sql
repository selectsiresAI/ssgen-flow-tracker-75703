-- =========================================================
-- SSGEN Billing — KPIs Financeiros e Ordens Prontas para Faturar
-- =========================================================

-- View: Resumo financeiro agregado
CREATE OR REPLACE VIEW public.v_billing_summary AS
WITH base_billing AS (
  SELECT
    so.id,
    so.ordem_servico_ssgen,
    so.dt_faturamento,
    so.envio_resultados_data,
    so.numero_amostras,
    c.nome as cliente,
    c.representante,
    c.coordenador,
    -- Valor estimado por amostra (pode ajustar conforme regra de negócio)
    COALESCE(so.numero_amostras, 0) * 150.00 as valor_estimado
  FROM public.service_orders so
  JOIN public.clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen
  WHERE so.dt_faturamento IS NOT NULL
)
SELECT
  COUNT(DISTINCT id) as total_ordens_faturadas,
  COALESCE(SUM(numero_amostras), 0) as total_amostras_faturadas,
  COALESCE(SUM(valor_estimado), 0) as valor_total_faturado,
  CASE 
    WHEN COUNT(DISTINCT id) > 0 
    THEN ROUND(SUM(valor_estimado) / COUNT(DISTINCT id), 2)
    ELSE 0 
  END as ticket_medio,
  COUNT(DISTINCT id) FILTER (WHERE DATE_TRUNC('month', dt_faturamento) = DATE_TRUNC('month', CURRENT_DATE)) as ordens_mes_atual,
  COALESCE(SUM(valor_estimado) FILTER (WHERE DATE_TRUNC('month', dt_faturamento) = DATE_TRUNC('month', CURRENT_DATE)), 0) as faturamento_mes_atual,
  COUNT(DISTINCT representante) as total_representantes,
  COUNT(DISTINCT coordenador) as total_coordenadores
FROM base_billing;

-- View: Ordens prontas para faturar (resultados liberados mas ainda não faturadas)
CREATE OR REPLACE VIEW public.v_ready_to_invoice AS
SELECT
  so.id,
  so.ordem_servico_ssgen,
  so.ordem_servico_neogen,
  so.envio_resultados_data,
  so.numero_amostras,
  so.nome_produto,
  c.nome as cliente,
  c.cpf_cnpj,
  c.representante,
  c.coordenador,
  -- Valor estimado por amostra
  COALESCE(so.numero_amostras, 0) * 150.00 as valor_estimado,
  -- Dias desde liberação dos resultados
  CURRENT_DATE - so.envio_resultados_data as dias_desde_liberacao,
  so.created_at,
  so.updated_at
FROM public.service_orders so
JOIN public.clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen
WHERE so.envio_resultados_data IS NOT NULL
  AND so.dt_faturamento IS NULL
ORDER BY so.envio_resultados_data ASC;

-- View: Faturamento mensal (últimos 12 meses)
CREATE OR REPLACE VIEW public.v_billing_monthly AS
WITH monthly_data AS (
  SELECT
    DATE_TRUNC('month', so.dt_faturamento) as mes,
    COUNT(DISTINCT so.id) as total_ordens,
    COALESCE(SUM(so.numero_amostras), 0) as total_amostras,
    COALESCE(SUM(so.numero_amostras * 150.00), 0) as valor_faturado
  FROM public.service_orders so
  WHERE so.dt_faturamento IS NOT NULL
    AND so.dt_faturamento >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', so.dt_faturamento)
)
SELECT
  TO_CHAR(mes, 'YYYY-MM') as mes,
  TO_CHAR(mes, 'Mon/YY') as mes_label,
  total_ordens,
  total_amostras,
  ROUND(valor_faturado, 2) as valor_faturado
FROM monthly_data
ORDER BY mes ASC;

-- View: Faturamento por representante
CREATE OR REPLACE VIEW public.v_billing_by_rep AS
SELECT
  c.representante,
  COUNT(DISTINCT so.id) as total_ordens,
  COALESCE(SUM(so.numero_amostras), 0) as total_amostras,
  COALESCE(SUM(so.numero_amostras * 150.00), 0) as valor_total
FROM public.service_orders so
JOIN public.clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen
WHERE so.dt_faturamento IS NOT NULL
GROUP BY c.representante
ORDER BY valor_total DESC;

-- View: Faturamento por coordenador
CREATE OR REPLACE VIEW public.v_billing_by_coord AS
SELECT
  c.coordenador,
  COUNT(DISTINCT so.id) as total_ordens,
  COALESCE(SUM(so.numero_amostras), 0) as total_amostras,
  COALESCE(SUM(so.numero_amostras * 150.00), 0) as valor_total
FROM public.service_orders so
JOIN public.clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen
WHERE so.dt_faturamento IS NOT NULL
GROUP BY c.coordenador
ORDER BY valor_total DESC;