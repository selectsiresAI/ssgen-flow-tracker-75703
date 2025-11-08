-- =========================================================
-- SSGEN Tracker — SQL Completo (Idempotente)
-- Execute este script no SQL Editor do Supabase
-- =========================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Extensão de service_orders
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS cliente_lat numeric,
  ADD COLUMN IF NOT EXISTS cliente_lon numeric,
  ADD COLUMN IF NOT EXISTS prioridade text DEFAULT 'media' CHECK (prioridade IN ('alta','media','baixa')),
  ADD COLUMN IF NOT EXISTS flag_reagendamento boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS issue_text text,
  ADD COLUMN IF NOT EXISTS dt_faturamento date,
  ADD COLUMN IF NOT EXISTS dt_receb_resultados date;

-- Suporte a exclusão lógica
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_deleted_at
  ON public.orders (deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_orders_deleted_at
  ON public.service_orders (deleted_at)
  WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.soft_delete_service_order(p_target_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_at timestamptz := now();
  v_service_order_id uuid;
  v_os_ssgen text;
  v_os_numeric numeric;
BEGIN
  BEGIN
    v_service_order_id := p_target_id::uuid;
  EXCEPTION
    WHEN others THEN
      v_service_order_id := NULL;
  END;

  IF v_service_order_id IS NOT NULL THEN
    UPDATE public.service_orders
    SET deleted_at = v_deleted_at
    WHERE id = v_service_order_id
      AND deleted_at IS NULL
    RETURNING ordem_servico_ssgen::text INTO v_os_ssgen;
  END IF;

  IF v_os_ssgen IS NULL THEN
    SELECT os_ssgen
    INTO v_os_ssgen
    FROM public.orders
    WHERE id::text = p_target_id
      AND deleted_at IS NULL;
  END IF;

  IF v_os_ssgen IS NOT NULL THEN
    UPDATE public.orders
    SET deleted_at = v_deleted_at
    WHERE os_ssgen = v_os_ssgen
      AND deleted_at IS NULL;

    BEGIN
      v_os_numeric := v_os_ssgen::numeric;
    EXCEPTION
      WHEN others THEN
        v_os_numeric := NULL;
    END;

    IF v_os_numeric IS NOT NULL THEN
      UPDATE public.service_orders
      SET deleted_at = v_deleted_at
      WHERE ordem_servico_ssgen = v_os_numeric
        AND deleted_at IS NULL;
    END IF;
  ELSE
    IF v_service_order_id IS NOT NULL THEN
      UPDATE public.service_orders
      SET deleted_at = v_deleted_at
      WHERE id = v_service_order_id
        AND deleted_at IS NULL;
    END IF;

    UPDATE public.orders
    SET deleted_at = v_deleted_at
    WHERE id::text = p_target_id
      AND deleted_at IS NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_service_order(text)
  TO anon, authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_service_orders_cliente_geo ON public.service_orders (cliente_lat, cliente_lon) WHERE cliente_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_orders_prioridade ON public.service_orders (prioridade);

-- 2) Tabela team_locations
CREATE TABLE IF NOT EXISTS public.team_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  lat numeric NOT NULL,
  lon numeric NOT NULL,
  status text DEFAULT 'online' CHECK (status IN ('online','ocupado','offline')),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_locations_updated ON public.team_locations (updated_at DESC);
ALTER TABLE public.team_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "team_locations_select" ON public.team_locations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "team_locations_insert" ON public.team_locations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "team_locations_update" ON public.team_locations FOR UPDATE USING (user_id = auth.uid());

-- 3) Views
CREATE OR REPLACE VIEW public.v_map_orders AS
SELECT so.id, so.ordem_servico_ssgen, c.nome AS cliente, so.cliente_lat AS lat, so.cliente_lon AS lon,
  so.prioridade, so.flag_reagendamento, so.envio_planilha_status_sla, so.vri_status_sla, 
  so.lpr_status_sla, so.envio_resultados_status_sla, c.representante, c.coordenador, c.status AS cliente_status
FROM public.service_orders so
JOIN public.clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen
WHERE so.cliente_lat IS NOT NULL AND so.cliente_lon IS NOT NULL;

CREATE OR REPLACE VIEW public.v_tracker_timeline AS
SELECT so.id, so.ordem_servico_ssgen, c.nome AS cliente, so.prioridade, so.flag_reagendamento, so.issue_text,
  so.cra_data AS etapa1_cra_data, so.envio_planilha_data AS etapa2_envio_planilha_data, so.envio_planilha_status_sla AS etapa2_status_sla,
  so.vri_data AS etapa3_vri_data, so.vri_status_sla AS etapa3_status_sla, so.vri_resolvido_data AS etapa4_vri_resolucao_data,
  so.lpr_data AS etapa5_lpr_data, so.lpr_status_sla AS etapa5_status_sla, so.dt_receb_resultados AS etapa6_receb_resultados_data,
  so.envio_resultados_data AS etapa7_envio_resultados_data, so.envio_resultados_status_sla AS etapa7_status_sla,
  so.dt_faturamento AS etapa8_faturamento_data,
  CASE WHEN so.cra_data IS NOT NULL THEN CURRENT_DATE - so.cra_data ELSE NULL END AS aging_dias_total,
  CASE WHEN so.dt_faturamento IS NOT NULL THEN 'Faturamento' WHEN so.envio_resultados_data IS NOT NULL THEN 'Envio Resultados'
    WHEN so.dt_receb_resultados IS NOT NULL THEN 'Recebimento Resultados' WHEN so.lpr_data IS NOT NULL THEN 'LPR'
    WHEN so.vri_resolvido_data IS NOT NULL THEN 'VRI Resolvido' WHEN so.vri_data IS NOT NULL THEN 'VRI'
    WHEN so.envio_planilha_data IS NOT NULL THEN 'Envio Planilha' WHEN so.cra_data IS NOT NULL THEN 'CRA' ELSE 'Pendente' END AS etapa_atual
FROM public.service_orders so JOIN public.clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen;

CREATE OR REPLACE VIEW public.v_tracker_kpi_topline AS
WITH stats AS (SELECT COUNT(*) AS total_os, COUNT(*) FILTER (WHERE dt_faturamento IS NULL) AS em_processamento,
  COUNT(*) FILTER (WHERE envio_resultados_data IS NOT NULL AND dt_faturamento IS NULL) AS a_faturar,
  COUNT(*) FILTER (WHERE dt_faturamento = CURRENT_DATE) AS concluidas_hoje,
  COUNT(*) FILTER (WHERE flag_reagendamento = true) AS reagendamentos, COUNT(*) FILTER (WHERE prioridade = 'alta') AS alta_prioridade,
  COUNT(*) FILTER (WHERE envio_planilha_status_sla = 'no_prazo') AS sla_envio_ok,
  COUNT(*) FILTER (WHERE vri_status_sla = 'no_prazo') AS sla_vri_ok, COUNT(*) FILTER (WHERE lpr_status_sla = 'no_prazo') AS sla_lpr_ok,
  AVG(CURRENT_DATE - cra_data) FILTER (WHERE dt_faturamento IS NOT NULL) AS tma_dias FROM public.service_orders)
SELECT total_os, em_processamento, a_faturar, concluidas_hoje, reagendamentos, alta_prioridade,
  CASE WHEN total_os > 0 THEN ROUND((sla_envio_ok::numeric / total_os) * 100, 1) ELSE 0 END AS pct_sla_envio_ok, 0 AS sla_envio_atrasado,
  CASE WHEN total_os > 0 THEN ROUND((sla_vri_ok::numeric / total_os) * 100, 1) ELSE 0 END AS pct_sla_vri_ok, 0 AS sla_vri_atrasado,
  CASE WHEN total_os > 0 THEN ROUND((sla_lpr_ok::numeric / total_os) * 100, 1) ELSE 0 END AS pct_sla_lpr_ok, 0 AS sla_lpr_atrasado,
  0 AS pct_sla_envio_res_ok, 0 AS sla_envio_res_atrasado, ROUND(tma_dias::numeric, 1) AS tma_dias FROM stats;

CREATE OR REPLACE VIEW public.vw_orders_powerbi
WITH (security_invoker=true) AS
SELECT
  id::TEXT,
  ord AS "Ord",
  os_ssgen AS "OS_SSGEN",
  dt_ssgen_os AS "DT_SSGEN_OS",
  cod_ssb AS "COD_SSB",
  cliente AS "CLIENTE",
  lib_cad_cliente AS "LIB_CAD_CLIENTE",
  plan_ssg AS "PLAN_SSG",
  dt_plan_ssg AS "DT_PLAN_SSG",
  prod_ssg AS "PROD_SSG",
  n_amostras_ssg AS "N_AMOSTRAS_SSG",
  dt_prev_result_ssg AS "DT_PREV_RESULT_SSG",
  result_ssg AS "RESULT_SSG",
  dt_result_ssg AS "DT_RESULT_SSG",
  fatur_tipo AS "FATUR_TIPO",
  fatur_ssg AS "FATUR_SSG",
  dt_fatur_ssg AS "DT_FATUR_SSG",
  rep AS "REP",
  coord AS "COORD",
  os_neogen AS "OS_NEOGEN",
  prod_neogen AS "PROD_NEOGEN",
  n_amostras_neogen AS "N_AMOSTRAS_NEOGEN",
  dt_cra AS "DT_CRA",
  plan_neogen AS "PLAN_NEOGEN",
  dt_plan_neogen AS "DT_PLAN_NEOGEN",
  n_vri AS "N_VRI",
  dt_vri AS "DT_VRI",
  n_lpr AS "N_LPR",
  dt_lpr AS "DT_LPR",
  n_lr AS "N_LR",
  dt_lr AS "DT_LR",
  lr_rastreio AS "LR_RASTREIO",
  nf_neogem AS "NF_NEOGEM",
  nf_na_neogen AS "NF_NA_NEOGEN",
  created_at,
  updated_at
FROM public.orders
WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.vw_orders_unified AS
SELECT
  c.codigo,
  c.representante,
  c.ordem_servico_ssgen,
  c.data AS data_cadastro,
  c.ordem_servico_neogen,
  c.cpf_cnpj,
  c.ie_rg,
  c.coordenador,
  c.nome AS cliente_nome,
  c.status AS cliente_status,
  c.id_conta_ssgen,
  c.created_at AS client_created_at,
  c.updated_at,
  so.id AS ordem_id,
  so.nome_produto,
  so.numero_amostras,
  so.numero_nf_neogen,
  so.cra_data,
  so.cra_status,
  so.envio_planilha_data,
  so.envio_planilha_status,
  so.envio_planilha_status_sla,
  so.vri_data,
  so.vri_n_amostras,
  so.vri_resolvido_data,
  so.vri_status_sla,
  so.lpr_data,
  so.lpr_n_amostras,
  so.lpr_status_sla,
  so.envio_resultados_ordem_id,
  so.envio_resultados_data,
  so.envio_resultados_previsao,
  so.envio_resultados_status,
  so.envio_resultados_status_sla,
  so.envio_resultados_data_prova,
  so.cliente_lat,
  so.cliente_lon,
  so.prioridade,
  so.flag_reagendamento,
  so.issue_text,
  so.dt_faturamento,
  so.dt_receb_resultados,
  so.created_at AS order_created_at,
  so.updated_at AS order_updated_at
FROM public.clients c
LEFT JOIN public.service_orders so
  ON c.ordem_servico_ssgen = so.ordem_servico_ssgen
 AND so.deleted_at IS NULL;
