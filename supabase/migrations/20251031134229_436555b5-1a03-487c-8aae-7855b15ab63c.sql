-- Drop views existentes
DROP VIEW IF EXISTS public.v_tracker_kpi_topline CASCADE;
DROP VIEW IF EXISTS public.v_tracker_timeline CASCADE;
DROP VIEW IF EXISTS public.v_map_orders CASCADE;

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Extensão de service_orders
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS cliente_lat numeric,
  ADD COLUMN IF NOT EXISTS cliente_lon numeric,
  ADD COLUMN IF NOT EXISTS prioridade text DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS flag_reagendamento boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS issue_text text,
  ADD COLUMN IF NOT EXISTS dt_faturamento date,
  ADD COLUMN IF NOT EXISTS dt_receb_resultados date;

-- Remover constraint antiga se existir e adicionar nova
DO $$ 
BEGIN
  ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_prioridade_check;
  ALTER TABLE public.service_orders ADD CONSTRAINT service_orders_prioridade_check 
    CHECK (prioridade IN ('alta','media','baixa'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_orders_cliente_geo ON public.service_orders (cliente_lat, cliente_lon) WHERE cliente_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_orders_prioridade ON public.service_orders (prioridade);

-- 2) Tabela team_locations
CREATE TABLE IF NOT EXISTS public.team_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  nome text NOT NULL,
  lat numeric NOT NULL,
  lon numeric NOT NULL,
  status text DEFAULT 'online',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar constraint se não existir
DO $$ 
BEGIN
  ALTER TABLE public.team_locations DROP CONSTRAINT IF EXISTS team_locations_status_check;
  ALTER TABLE public.team_locations ADD CONSTRAINT team_locations_status_check 
    CHECK (status IN ('online','ocupado','offline'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_team_locations_updated ON public.team_locations (updated_at DESC);
ALTER TABLE public.team_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies para team_locations
DROP POLICY IF EXISTS team_locations_read_policy ON public.team_locations;
DROP POLICY IF EXISTS team_locations_insert_policy ON public.team_locations;
DROP POLICY IF EXISTS team_locations_update_policy ON public.team_locations;
DROP POLICY IF EXISTS team_locations_delete_policy ON public.team_locations;

CREATE POLICY team_locations_read_policy ON public.team_locations FOR SELECT 
  USING (has_role(auth.uid(), 'ADM') OR has_role(auth.uid(), 'COORDENADOR') OR user_id = auth.uid());

CREATE POLICY team_locations_insert_policy ON public.team_locations FOR INSERT 
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'ADM'));

CREATE POLICY team_locations_update_policy ON public.team_locations FOR UPDATE 
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'ADM'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'ADM'));

CREATE POLICY team_locations_delete_policy ON public.team_locations FOR DELETE 
  USING (has_role(auth.uid(), 'ADM'));

-- 3) Recriar Views
CREATE VIEW public.v_map_orders AS
SELECT 
  so.id,
  so.ordem_servico_ssgen,
  c.nome AS cliente,
  so.cliente_lat AS lat,
  so.cliente_lon AS lon,
  so.prioridade,
  so.flag_reagendamento,
  so.envio_planilha_status_sla,
  so.vri_status_sla,
  so.lpr_status_sla,
  so.envio_resultados_status_sla,
  c.representante,
  c.coordenador,
  so.issue_text,
  so.created_at,
  so.updated_at
FROM public.service_orders so
JOIN public.clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen
WHERE so.cliente_lat IS NOT NULL AND so.cliente_lon IS NOT NULL;

CREATE VIEW public.v_tracker_timeline AS
SELECT 
  so.id,
  so.ordem_servico_ssgen,
  c.nome AS cliente,
  so.prioridade,
  so.flag_reagendamento,
  so.issue_text,
  so.cra_data AS etapa1_cra_data,
  so.envio_planilha_data AS etapa2_envio_planilha_data,
  so.envio_planilha_status_sla AS etapa2_status_sla,
  so.vri_data AS etapa3_vri_data,
  so.vri_status_sla AS etapa3_status_sla,
  so.vri_resolvido_data AS etapa4_vri_resolucao_data,
  so.lpr_data AS etapa5_lpr_data,
  so.lpr_status_sla AS etapa5_status_sla,
  so.dt_receb_resultados AS etapa6_receb_resultados_data,
  so.envio_resultados_data AS etapa7_envio_resultados_data,
  so.envio_resultados_status_sla AS etapa7_status_sla,
  so.dt_faturamento AS etapa8_faturamento_data,
  CASE 
    WHEN so.cra_data IS NOT NULL THEN CURRENT_DATE - so.cra_data 
    ELSE NULL 
  END AS aging_dias_total,
  CASE 
    WHEN so.dt_faturamento IS NOT NULL THEN 'Faturamento'
    WHEN so.envio_resultados_data IS NOT NULL THEN 'Envio Resultados'
    WHEN so.dt_receb_resultados IS NOT NULL THEN 'Recebimento Resultados'
    WHEN so.lpr_data IS NOT NULL THEN 'LPR'
    WHEN so.vri_resolvido_data IS NOT NULL THEN 'VRI Resolvido'
    WHEN so.vri_data IS NOT NULL THEN 'VRI'
    WHEN so.envio_planilha_data IS NOT NULL THEN 'Envio Planilha'
    WHEN so.cra_data IS NOT NULL THEN 'CRA'
    ELSE 'Pendente'
  END AS etapa_atual
FROM public.service_orders so
JOIN public.clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen;

CREATE VIEW public.v_tracker_kpi_topline AS
WITH stats AS (
  SELECT 
    COUNT(*) AS total_os,
    COUNT(*) FILTER (WHERE dt_faturamento IS NULL) AS em_processamento,
    COUNT(*) FILTER (WHERE envio_resultados_data IS NOT NULL AND dt_faturamento IS NULL) AS a_faturar,
    COUNT(*) FILTER (WHERE dt_faturamento = CURRENT_DATE) AS concluidas_hoje,
    COUNT(*) FILTER (WHERE flag_reagendamento = true) AS reagendamentos,
    COUNT(*) FILTER (WHERE prioridade = 'alta') AS alta_prioridade,
    COUNT(*) FILTER (WHERE envio_planilha_status_sla = 'no_prazo') AS sla_envio_ok,
    COUNT(*) FILTER (WHERE vri_status_sla = 'no_prazo') AS sla_vri_ok,
    COUNT(*) FILTER (WHERE lpr_status_sla = 'no_prazo') AS sla_lpr_ok,
    COUNT(*) FILTER (WHERE envio_resultados_status_sla = 'no_prazo') AS sla_envio_res_ok,
    AVG(CURRENT_DATE - cra_data) FILTER (WHERE dt_faturamento IS NOT NULL) AS tma_dias
  FROM public.service_orders
)
SELECT 
  total_os,
  em_processamento,
  a_faturar,
  concluidas_hoje,
  reagendamentos,
  alta_prioridade,
  CASE WHEN total_os > 0 THEN ROUND((sla_envio_ok::numeric / total_os) * 100, 1) ELSE 0 END AS pct_sla_envio_ok,
  (total_os - sla_envio_ok) AS sla_envio_atrasado,
  CASE WHEN total_os > 0 THEN ROUND((sla_vri_ok::numeric / total_os) * 100, 1) ELSE 0 END AS pct_sla_vri_ok,
  (total_os - sla_vri_ok) AS sla_vri_atrasado,
  CASE WHEN total_os > 0 THEN ROUND((sla_lpr_ok::numeric / total_os) * 100, 1) ELSE 0 END AS pct_sla_lpr_ok,
  (total_os - sla_lpr_ok) AS sla_lpr_atrasado,
  CASE WHEN total_os > 0 THEN ROUND((sla_envio_res_ok::numeric / total_os) * 100, 1) ELSE 0 END AS pct_sla_envio_res_ok,
  (total_os - sla_envio_res_ok) AS sla_envio_res_atrasado,
  ROUND(tma_dias::numeric, 1) AS tma_dias
FROM stats;