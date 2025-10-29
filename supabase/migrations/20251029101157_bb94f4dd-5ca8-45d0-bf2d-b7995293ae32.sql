-- Correção de segurança: remover SECURITY DEFINER da view e adicionar search_path nas funções

-- 1. Recriar a view sem SECURITY DEFINER (ela já herda RLS da tabela orders)
DROP VIEW IF EXISTS public.vw_orders_powerbi;

CREATE VIEW public.vw_orders_powerbi 
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
FROM public.orders;

-- 2. Adicionar search_path à função update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;