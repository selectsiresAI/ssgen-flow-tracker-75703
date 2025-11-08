BEGIN;

-- Add deleted_at column to orders and service_orders tables
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.service_orders 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add indexes for better performance when filtering deleted records
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON public.orders(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_service_orders_deleted_at ON public.service_orders(deleted_at) WHERE deleted_at IS NULL;

-- Update views to exclude deleted records
CREATE OR REPLACE VIEW public.vw_orders_powerbi AS
SELECT 
  o.id,
  o.os_ssgen AS "OS_SSGEN",
  o.cliente AS "CLIENTE",
  o.coord AS "COORD",
  o.rep AS "REP",
  o.prod_ssg AS "PROD_SSG",
  o.n_amostras_ssg AS "N_AMOSTRAS_SSG",
  o.dt_ssgen_os AS "DT_SSGEN_OS",
  o.dt_prev_result_ssg AS "DT_PREV_RESULT_SSG",
  o.result_ssg AS "RESULT_SSG",
  o.dt_result_ssg AS "DT_RESULT_SSG",
  o.fatur_tipo AS "FATUR_TIPO",
  o.fatur_ssg AS "FATUR_SSG",
  o.dt_fatur_ssg AS "DT_FATUR_SSG",
  o.os_neogen AS "OS_NEOGEN",
  o.plan_neogen AS "PLAN_NEOGEN",
  o.dt_cra AS "DT_CRA",
  o.dt_plan_neogen AS "DT_PLAN_NEOGEN",
  o.dt_vri AS "DT_VRI",
  o.dt_lpr AS "DT_LPR",
  o.dt_lr AS "DT_LR",
  o.n_vri AS "N_VRI",
  o.n_lpr AS "N_LPR",
  o.n_lr AS "N_LR",
  o.lr_rastreio AS "LR_RASTREIO"
FROM public.orders o
WHERE o.deleted_at IS NULL;

CREATE OR REPLACE VIEW public.vw_orders_unified AS
SELECT 
  so.id,
  so.ordem_servico_ssgen,
  c.nome AS cliente_nome,
  c.coordenador,
  c.representante,
  COALESCE(so.nome_produto, o.prod_ssg) AS nome_produto,
  COALESCE(so.numero_amostras, o.n_amostras_ssg) AS numero_amostras,
  COALESCE(so.created_at, o.created_at) AS created_at,
  so.cra_data AS dt_cra,
  so.envio_planilha_data AS dt_planilha_neogen,
  so.vri_data AS dt_vri,
  so.lpr_data AS dt_lpr,
  so.liberacao_data AS dt_lr,
  so.envio_resultados_data AS dt_resultado,
  so.envio_resultados_previsao AS dt_prev_resultado,
  so.envio_resultados_status AS resultado,
  so.dt_faturamento,
  NULL::TEXT AS faturamento_tipo,
  NULL::NUMERIC AS valor_faturamento,
  so.ordem_servico_neogen AS os_neogen,
  so.envio_planilha_status AS plano_neogen,
  so.vri_n_amostras AS n_vri,
  so.lpr_n_amostras AS n_lpr,
  so.liberacao_n_amostras AS n_lr,
  NULL::TEXT AS lr_rastreio,
  so.prioridade,
  so.flag_reagendamento,
  so.issue_text,
  'service_orders' AS source_table
FROM public.service_orders so
LEFT JOIN public.clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen AND c.deleted_at IS NULL
LEFT JOIN public.orders o ON o.os_ssgen = so.ordem_servico_ssgen::TEXT AND o.deleted_at IS NULL
WHERE so.deleted_at IS NULL
UNION ALL
SELECT 
  o.id,
  o.os_ssgen::NUMERIC AS ordem_servico_ssgen,
  o.cliente AS cliente_nome,
  o.coord AS coordenador,
  o.rep AS representante,
  o.prod_ssg AS nome_produto,
  o.n_amostras_ssg AS numero_amostras,
  o.created_at,
  o.dt_cra,
  o.dt_plan_neogen,
  o.dt_vri,
  o.dt_lpr,
  o.dt_lr,
  o.dt_result_ssg,
  o.dt_prev_result_ssg,
  o.result_ssg,
  o.dt_fatur_ssg,
  o.fatur_tipo,
  o.fatur_ssg,
  o.os_neogen,
  o.plan_neogen,
  o.n_vri,
  o.n_lpr,
  o.n_lr,
  o.lr_rastreio,
  'media' AS prioridade,
  FALSE AS flag_reagendamento,
  NULL::TEXT AS issue_text,
  'orders' AS source_table
FROM public.orders o
WHERE o.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.service_orders so2 
    WHERE so2.ordem_servico_ssgen = o.os_ssgen::NUMERIC
      AND so2.deleted_at IS NULL
  );

COMMIT;
