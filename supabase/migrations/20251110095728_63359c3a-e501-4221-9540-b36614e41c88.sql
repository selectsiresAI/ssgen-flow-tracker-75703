-- ========================================
-- 1) Criar função RPC link_order_to_client
-- ========================================
CREATE OR REPLACE FUNCTION public.link_order_to_client(
  p_order_id UUID,
  p_client_name TEXT
)
RETURNS TABLE(client_id UUID, client_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_client_name TEXT;
BEGIN
  -- Se o nome estiver vazio, desvincula o cliente
  IF p_client_name IS NULL OR TRIM(p_client_name) = '' THEN
    UPDATE service_orders
    SET client_id = NULL, updated_at = NOW()
    WHERE id = p_order_id;
    
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Busca ou cria o cliente
  SELECT id, nome INTO v_client_id, v_client_name
  FROM clients
  WHERE LOWER(TRIM(nome)) = LOWER(TRIM(p_client_name))
    AND deleted_at IS NULL
  LIMIT 1;

  -- Se não existe, cria novo cliente
  IF v_client_id IS NULL THEN
    INSERT INTO clients (
      nome,
      coordenador,
      representante,
      cpf_cnpj,
      data,
      ordem_servico_ssgen
    )
    VALUES (
      TRIM(p_client_name),
      'Não definido',
      'Não definido',
      0,
      CURRENT_DATE,
      0
    )
    RETURNING id, nome INTO v_client_id, v_client_name;
  END IF;

  -- Atualiza a ordem com o cliente
  UPDATE service_orders
  SET client_id = v_client_id, updated_at = NOW()
  WHERE id = p_order_id;

  RETURN QUERY SELECT v_client_id, v_client_name;
END;
$$;

-- ========================================
-- 2) Recriar v_map_orders com client_name
-- ========================================
DROP VIEW IF EXISTS public.v_map_orders CASCADE;

CREATE VIEW public.v_map_orders AS
SELECT
  so.id,
  so.ordem_servico_ssgen,
  so.cliente_lat AS lat,
  so.cliente_lon AS lon,
  so.prioridade,
  so.flag_reagendamento,
  so.issue_text,
  so.envio_planilha_status_sla,
  so.vri_status_sla,
  so.lpr_status_sla,
  so.envio_resultados_status_sla,
  so.created_at,
  so.updated_at,
  so.deleted_at,
  so.client_id,
  c.nome AS client_name,
  c.coordenador AS coordenador,
  c.representante AS representante,
  c.nome AS cliente
FROM service_orders so
LEFT JOIN clients c ON c.id = so.client_id AND c.deleted_at IS NULL
WHERE so.deleted_at IS NULL;

-- ========================================
-- 3) Recriar vw_orders_unified
-- ========================================
DROP VIEW IF EXISTS public.vw_orders_unified CASCADE;

CREATE VIEW public.vw_orders_unified AS
SELECT
  so.id,
  so.ordem_servico_ssgen,
  so.created_at,
  so.updated_at,
  so.deleted_at,
  so.client_id,
  c.nome AS client_name,
  c.nome AS CLIENTE,
  c.coordenador AS COORD,
  c.representante AS REP,
  NULL::TEXT AS Ord,
  LPAD(so.ordem_servico_ssgen::TEXT, 6, '0') AS OS_SSGEN,
  NULL::TEXT AS COD_SSB,
  NULL::TEXT AS LIB_CAD_CLIENTE,
  NULL::TEXT AS PLAN_SSG,
  so.nome_produto AS PROD_SSG,
  NULL::TEXT AS RESULT_SSG,
  NULL::TEXT AS FATUR_TIPO,
  so.ordem_servico_neogen::TEXT AS OS_NEOGEN,
  NULL::TEXT AS PROD_NEOGEN,
  NULL::TEXT AS PLAN_NEOGEN,
  NULL::TEXT AS LR_RASTREIO,
  so.numero_nf_neogen::TEXT AS NF_NEOGEM,
  NULL::TEXT AS NF_NA_NEOGEN,
  so.created_at AS DT_SSGEN_OS,
  NULL::TIMESTAMP AS DT_PLAN_SSG,
  so.numero_amostras::INTEGER AS N_AMOSTRAS_SSG,
  so.envio_resultados_previsao AS DT_PREV_RESULT_SSG,
  so.envio_resultados_data AS DT_RESULT_SSG,
  NULL::NUMERIC AS FATUR_SSG,
  so.dt_faturamento AS DT_FATUR_SSG,
  so.numero_amostras::INTEGER AS N_AMOSTRAS_NEOGEN,
  so.cra_data::TIMESTAMP AS DT_CRA,
  so.envio_planilha_data::TIMESTAMP AS DT_PLAN_NEOGEN,
  so.vri_n_amostras::INTEGER AS N_VRI,
  so.vri_data::TIMESTAMP AS DT_VRI,
  so.lpr_n_amostras::INTEGER AS N_LPR,
  so.lpr_data::TIMESTAMP AS DT_LPR,
  NULL::INTEGER AS N_LR,
  NULL::TIMESTAMP AS DT_LR
FROM service_orders so
LEFT JOIN clients c ON c.id = so.client_id AND c.deleted_at IS NULL
WHERE so.deleted_at IS NULL;

-- ========================================
-- 4) SEGURANÇA: Habilitar RLS em app_config
-- ========================================
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Apenas ADM pode gerenciar configurações
CREATE POLICY "ADM can manage app_config"
ON public.app_config
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'ADM'::app_role))
WITH CHECK (has_role(auth.uid(), 'ADM'::app_role));

-- Todos podem visualizar (read-only para não-admins)
CREATE POLICY "Everyone can view app_config"
ON public.app_config
FOR SELECT
TO authenticated
USING (true);

-- ========================================
-- 5) SEGURANÇA: Habilitar RLS em orders_ext
-- ========================================
ALTER TABLE public.orders_ext ENABLE ROW LEVEL SECURITY;

-- ADM tem acesso total
CREATE POLICY "ADM can manage orders_ext"
ON public.orders_ext
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'ADM'::app_role))
WITH CHECK (has_role(auth.uid(), 'ADM'::app_role));

-- COORDENADOR pode ver dados do seu coordenador
CREATE POLICY "COORDENADOR can view their coord orders_ext"
ON public.orders_ext
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'COORDENADOR'::app_role
      AND coord = orders_ext.coord
  )
);

-- REPRESENTANTE pode ver seus próprios dados
CREATE POLICY "REPRESENTANTE can view their orders_ext"
ON public.orders_ext
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'REPRESENTANTE'::app_role
      AND rep = orders_ext.rep
  )
);

-- ========================================
-- 6) SEGURANÇA: Remover política permissiva
-- ========================================
DROP POLICY IF EXISTS "so_insert_any" ON public.service_orders;

-- Criar política mais restrita para inserção
CREATE POLICY "Authenticated can insert service_orders"
ON public.service_orders
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'ADM'::app_role) OR
  has_role(auth.uid(), 'COORDENADOR'::app_role) OR
  has_role(auth.uid(), 'REPRESENTANTE'::app_role)
);