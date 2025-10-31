-- =========================================================
-- SSGEN Tracker — KPIs de Ordens e Amostras (Atualizado)
-- =========================================================

-- Remove view antiga se existir
DROP VIEW IF EXISTS public.v_tracker_kpi_topline CASCADE;

-- Cria view nova com todos os KPIs detalhados
CREATE OR REPLACE VIEW public.v_tracker_kpi_topline AS
WITH base AS (
  SELECT
    so.id,
    so.ordem_servico_ssgen,
    so.cra_data,
    so.dt_faturamento,
    so.envio_resultados_data,
    so.prioridade,
    so.flag_reagendamento,
    so.envio_planilha_status_sla,
    so.vri_status_sla,
    so.lpr_status_sla,
    so.envio_resultados_status_sla,
    so.numero_amostras,
    -- Calcular aging em dias desde CRA até hoje (ou até faturamento)
    CASE 
      WHEN so.dt_faturamento IS NOT NULL THEN so.dt_faturamento - so.cra_data
      WHEN so.cra_data IS NOT NULL THEN CURRENT_DATE - so.cra_data
      ELSE 0
    END as aging_dias,
    c.nome as cliente,
    c.representante,
    c.coordenador
  FROM public.service_orders so
  JOIN public.clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen
)
SELECT
  COUNT(DISTINCT id) as total_ordens,
  COALESCE(SUM(numero_amostras), 0) as total_amostras,
  COUNT(DISTINCT cliente) as total_clientes,
  COUNT(*) FILTER (WHERE dt_faturamento IS NULL) as em_processamento,
  COUNT(*) FILTER (WHERE envio_resultados_data IS NOT NULL AND dt_faturamento IS NULL) as a_faturar,
  COUNT(*) FILTER (WHERE dt_faturamento = CURRENT_DATE) as concluidas_hoje,
  COUNT(*) FILTER (WHERE flag_reagendamento = true) as reagendamentos,
  COUNT(*) FILTER (WHERE prioridade = 'alta') as alta_prioridade,
  ROUND(AVG(aging_dias), 1) as tma_dias,
  
  -- SLA - Contadores
  COUNT(*) FILTER (WHERE envio_planilha_status_sla = 'no_prazo') as sla_envio_ok,
  COUNT(*) FILTER (WHERE vri_status_sla = 'no_prazo') as sla_vri_ok,
  COUNT(*) FILTER (WHERE lpr_status_sla = 'no_prazo') as sla_lpr_ok,
  COUNT(*) FILTER (WHERE envio_resultados_status_sla = 'no_prazo') as sla_envio_res_ok,
  
  COUNT(*) FILTER (WHERE envio_planilha_status_sla = 'atrasado') as sla_envio_atrasado,
  COUNT(*) FILTER (WHERE vri_status_sla = 'atrasado') as sla_vri_atrasado,
  COUNT(*) FILTER (WHERE lpr_status_sla = 'atrasado') as sla_lpr_atrasado,
  COUNT(*) FILTER (WHERE envio_resultados_status_sla = 'atrasado') as sla_envio_res_atrasado,
  
  -- SLA - Percentuais
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE envio_planilha_status_sla = 'no_prazo') * 100.0 / COUNT(*)), 1)
    ELSE 0 
  END as pct_sla_envio_ok,
  
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE vri_status_sla = 'no_prazo') * 100.0 / COUNT(*)), 1)
    ELSE 0 
  END as pct_sla_vri_ok,
  
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE lpr_status_sla = 'no_prazo') * 100.0 / COUNT(*)), 1)
    ELSE 0 
  END as pct_sla_lpr_ok,
  
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE envio_resultados_status_sla = 'no_prazo') * 100.0 / COUNT(*)), 1)
    ELSE 0 
  END as pct_sla_envio_res_ok
  
FROM base;