-- Drop existing views
DROP VIEW IF EXISTS v_tracker_timeline CASCADE;
DROP VIEW IF EXISTS v_tracker_kpi_topline CASCADE;
DROP VIEW IF EXISTS v_map_orders CASCADE;

-- Recreate v_tracker_timeline with SECURITY DEFINER
CREATE OR REPLACE VIEW v_tracker_timeline 
WITH (security_invoker = false)
AS
SELECT 
  so.id,
  so.ordem_servico_ssgen,
  c.nome as cliente,
  so.prioridade,
  so.flag_reagendamento,
  so.issue_text,
  
  -- Etapa 1: CRA
  so.cra_data as etapa1_cra_data,
  
  -- Etapa 2: Envio Planilha
  so.envio_planilha_data as etapa2_envio_planilha_data,
  so.envio_planilha_status_sla as etapa2_status_sla,
  
  -- Etapa 3: VRI
  so.vri_data as etapa3_vri_data,
  so.vri_status_sla as etapa3_status_sla,
  
  -- Etapa 4: VRI Resolução
  so.vri_resolvido_data as etapa4_vri_resolucao_data,
  
  -- Etapa 5: LPR
  so.lpr_data as etapa5_lpr_data,
  so.lpr_status_sla as etapa5_status_sla,
  
  -- Etapa 6: Recebimento Resultados
  so.dt_receb_resultados as etapa6_receb_resultados_data,
  
  -- Etapa 7: Envio Resultados
  so.envio_resultados_data as etapa7_envio_resultados_data,
  so.envio_resultados_status_sla as etapa7_status_sla,
  
  -- Etapa 8: Faturamento
  so.dt_faturamento as etapa8_faturamento_data,
  
  -- Calcular aging total
  COALESCE(CURRENT_DATE - so.cra_data, 0) as aging_dias_total,
  
  -- Etapa atual
  CASE
    WHEN so.dt_faturamento IS NOT NULL THEN 'Faturada'
    WHEN so.envio_resultados_data IS NOT NULL THEN 'Envio Resultados'
    WHEN so.dt_receb_resultados IS NOT NULL THEN 'Recebimento Resultados'
    WHEN so.lpr_data IS NOT NULL THEN 'LPR'
    WHEN so.vri_resolvido_data IS NOT NULL THEN 'VRI Resolvida'
    WHEN so.vri_data IS NOT NULL THEN 'VRI'
    WHEN so.envio_planilha_data IS NOT NULL THEN 'Envio Planilha'
    WHEN so.cra_data IS NOT NULL THEN 'CRA'
    ELSE 'Iniciada'
  END as etapa_atual
FROM service_orders so
LEFT JOIN clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen
ORDER BY aging_dias_total DESC;

-- Recreate v_tracker_kpi_topline with SECURITY DEFINER
CREATE OR REPLACE VIEW v_tracker_kpi_topline
WITH (security_invoker = false)
AS
SELECT
  COUNT(DISTINCT so.id) as total_ordens,
  SUM(so.numero_amostras) as total_amostras,
  COUNT(DISTINCT c.nome) as total_clientes,
  COUNT(CASE WHEN so.dt_faturamento IS NULL THEN 1 END) as em_processamento,
  COUNT(CASE WHEN so.envio_resultados_data IS NOT NULL AND so.dt_faturamento IS NULL THEN 1 END) as a_faturar,
  COUNT(CASE WHEN so.dt_faturamento::date = CURRENT_DATE THEN 1 END) as concluidas_hoje,
  COUNT(CASE WHEN so.flag_reagendamento = true THEN 1 END) as reagendamentos,
  COUNT(CASE WHEN so.prioridade = 'alta' THEN 1 END) as alta_prioridade,
  ROUND(AVG(CURRENT_DATE - so.cra_data)::numeric, 1) as tma_dias,
  
  -- SLA Envio Planilha
  COUNT(CASE WHEN so.envio_planilha_status_sla = 'no_prazo' THEN 1 END) as sla_envio_ok,
  COUNT(CASE WHEN so.envio_planilha_status_sla = 'atrasado' THEN 1 END) as sla_envio_atrasado,
  
  -- SLA VRI
  COUNT(CASE WHEN so.vri_status_sla = 'no_prazo' THEN 1 END) as sla_vri_ok,
  COUNT(CASE WHEN so.vri_status_sla = 'atrasado' THEN 1 END) as sla_vri_atrasado,
  
  -- SLA LPR
  COUNT(CASE WHEN so.lpr_status_sla = 'no_prazo' THEN 1 END) as sla_lpr_ok,
  COUNT(CASE WHEN so.lpr_status_sla = 'atrasado' THEN 1 END) as sla_lpr_atrasado,
  
  -- SLA Envio Resultados
  COUNT(CASE WHEN so.envio_resultados_status_sla = 'no_prazo' THEN 1 END) as sla_envio_res_ok,
  COUNT(CASE WHEN so.envio_resultados_status_sla = 'atrasado' THEN 1 END) as sla_envio_res_atrasado,
  
  -- Percentuais de SLA
  ROUND(
    100.0 * COUNT(CASE WHEN so.envio_planilha_status_sla = 'no_prazo' THEN 1 END) / 
    NULLIF(COUNT(CASE WHEN so.envio_planilha_status_sla IS NOT NULL THEN 1 END), 0),
    1
  ) as pct_sla_envio_ok,
  
  ROUND(
    100.0 * COUNT(CASE WHEN so.vri_status_sla = 'no_prazo' THEN 1 END) / 
    NULLIF(COUNT(CASE WHEN so.vri_status_sla IS NOT NULL THEN 1 END), 0),
    1
  ) as pct_sla_vri_ok,
  
  ROUND(
    100.0 * COUNT(CASE WHEN so.lpr_status_sla = 'no_prazo' THEN 1 END) / 
    NULLIF(COUNT(CASE WHEN so.lpr_status_sla IS NOT NULL THEN 1 END), 0),
    1
  ) as pct_sla_lpr_ok,
  
  ROUND(
    100.0 * COUNT(CASE WHEN so.envio_resultados_status_sla = 'no_prazo' THEN 1 END) / 
    NULLIF(COUNT(CASE WHEN so.envio_resultados_status_sla IS NOT NULL THEN 1 END), 0),
    1
  ) as pct_sla_envio_res_ok
FROM service_orders so
LEFT JOIN clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen;

-- Recreate v_map_orders with SECURITY DEFINER
CREATE OR REPLACE VIEW v_map_orders
WITH (security_invoker = false)
AS
SELECT 
  so.id,
  so.ordem_servico_ssgen,
  c.nome as cliente,
  c.representante,
  c.coordenador,
  so.cliente_lat as lat,
  so.cliente_lon as lon,
  so.prioridade,
  so.flag_reagendamento,
  so.issue_text,
  so.envio_planilha_status_sla,
  so.vri_status_sla,
  so.lpr_status_sla,
  so.envio_resultados_status_sla,
  so.created_at,
  so.updated_at
FROM service_orders so
LEFT JOIN clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen
WHERE so.cliente_lat IS NOT NULL AND so.cliente_lon IS NOT NULL;