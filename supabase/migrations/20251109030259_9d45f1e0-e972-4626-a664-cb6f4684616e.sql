-- Adicionar coluna deleted_at à tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Remover a FK antiga que causa ambiguidade
ALTER TABLE public.service_orders 
DROP CONSTRAINT IF EXISTS service_orders_ordem_servico_ssgen_fkey;

-- Criar índice para deleted_at em orders
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON public.orders(deleted_at);

-- Dropar e recriar view vw_orders_unified para filtrar deleted_at
DROP VIEW IF EXISTS public.vw_orders_unified CASCADE;

CREATE VIEW public.vw_orders_unified AS
SELECT 
  o.id,
  o.ord AS "Ord",
  o.os_ssgen AS "OS_SSGEN",
  o.cod_ssb AS "COD_SSB",
  o.cliente AS "CLIENTE",
  o.lib_cad_cliente AS "LIB_CAD_CLIENTE",
  o.plan_ssg AS "PLAN_SSG",
  o.prod_ssg AS "PROD_SSG",
  o.result_ssg AS "RESULT_SSG",
  o.fatur_tipo AS "FATUR_TIPO",
  o.rep AS "REP",
  o.coord AS "COORD",
  o.os_neogen AS "OS_NEOGEN",
  o.prod_neogen AS "PROD_NEOGEN",
  o.plan_neogen AS "PLAN_NEOGEN",
  o.lr_rastreio AS "LR_RASTREIO",
  o.nf_neogem AS "NF_NEOGEM",
  o.nf_na_neogen AS "NF_NA_NEOGEN",
  o.dt_ssgen_os AS "DT_SSGEN_OS",
  o.dt_plan_ssg AS "DT_PLAN_SSG",
  o.n_amostras_ssg AS "N_AMOSTRAS_SSG",
  o.dt_prev_result_ssg AS "DT_PREV_RESULT_SSG",
  o.dt_result_ssg AS "DT_RESULT_SSG",
  o.fatur_ssg AS "FATUR_SSG",
  o.dt_fatur_ssg AS "DT_FATUR_SSG",
  o.n_amostras_neogen AS "N_AMOSTRAS_NEOGEN",
  o.dt_cra AS "DT_CRA",
  o.dt_plan_neogen AS "DT_PLAN_NEOGEN",
  o.n_vri AS "N_VRI",
  o.dt_vri AS "DT_VRI",
  o.n_lpr AS "N_LPR",
  o.dt_lpr AS "DT_LPR",
  o.n_lr AS "N_LR",
  o.dt_lr AS "DT_LR",
  o.created_at,
  o.updated_at
FROM public.orders o
WHERE o.deleted_at IS NULL;

-- Dropar e recriar view vw_orders_powerbi para filtrar deleted_at
DROP VIEW IF EXISTS public.vw_orders_powerbi CASCADE;

CREATE VIEW public.vw_orders_powerbi AS
SELECT 
  o.id::text,
  o.ord AS "Ord",
  o.os_ssgen AS "OS_SSGEN",
  o.cod_ssb AS "COD_SSB",
  o.cliente AS "CLIENTE",
  o.lib_cad_cliente AS "LIB_CAD_CLIENTE",
  o.plan_ssg AS "PLAN_SSG",
  o.prod_ssg AS "PROD_SSG",
  o.result_ssg AS "RESULT_SSG",
  o.fatur_tipo AS "FATUR_TIPO",
  o.rep AS "REP",
  o.coord AS "COORD",
  o.os_neogen AS "OS_NEOGEN",
  o.prod_neogen AS "PROD_NEOGEN",
  o.plan_neogen AS "PLAN_NEOGEN",
  o.lr_rastreio AS "LR_RASTREIO",
  o.nf_neogem AS "NF_NEOGEM",
  o.nf_na_neogen AS "NF_NA_NEOGEN",
  o.dt_ssgen_os AS "DT_SSGEN_OS",
  o.dt_plan_ssg AS "DT_PLAN_SSG",
  o.n_amostras_ssg AS "N_AMOSTRAS_SSG",
  o.dt_prev_result_ssg AS "DT_PREV_RESULT_SSG",
  o.dt_result_ssg AS "DT_RESULT_SSG",
  o.fatur_ssg AS "FATUR_SSG",
  o.dt_fatur_ssg AS "DT_FATUR_SSG",
  o.n_amostras_neogen AS "N_AMOSTRAS_NEOGEN",
  o.dt_cra AS "DT_CRA",
  o.dt_plan_neogen AS "DT_PLAN_NEOGEN",
  o.n_vri AS "N_VRI",
  o.dt_vri AS "DT_VRI",
  o.n_lpr AS "N_LPR",
  o.dt_lpr AS "DT_LPR",
  o.n_lr AS "N_LR",
  o.dt_lr AS "DT_LR",
  o.created_at,
  o.updated_at
FROM public.orders o
WHERE o.deleted_at IS NULL;