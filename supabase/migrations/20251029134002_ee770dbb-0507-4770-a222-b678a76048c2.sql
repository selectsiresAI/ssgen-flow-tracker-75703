-- Recriar a view com SECURITY INVOKER para garantir que usa as permissões do usuário
DROP VIEW IF EXISTS public.vw_orders_unified;

CREATE VIEW public.vw_orders_unified
WITH (security_invoker = true)
AS
SELECT 
  -- Dados do cliente
  c.ordem_servico_ssgen,
  c.data as data_cadastro,
  c.ordem_servico_neogen,
  c.nome as cliente_nome,
  c.cpf_cnpj,
  c.ie_rg,
  c.codigo,
  c.status as cliente_status,
  c.representante,
  c.coordenador,
  c.id_conta_ssgen,
  
  -- Dados da ordem
  so.id as ordem_id,
  so.numero_nf_neogen,
  so.numero_teste_nota_neogen,
  so.nome_produto,
  
  -- CRA
  so.cra_data,
  so.cra_status,
  
  -- Recebimento
  so.recebimento_data,
  so.recebimento_status,
  
  -- Envio Planilha
  so.envio_planilha_data,
  so.envio_planilha_status,
  
  -- VRI
  so.vri_data,
  so.vri_n_amostras,
  
  -- LPR
  so.lpr_data,
  so.lpr_n_amostras,
  
  -- Liberação
  so.liberacao_data,
  so.liberacao_n_amostras,
  
  -- Envio Resultados
  so.envio_resultados_data,
  so.envio_resultados_ordem_id,
  so.envio_resultados_previsao,
  so.envio_resultados_status,
  so.envio_resultados_data_final,
  so.envio_resultados_data_prova,
  so.envio_resultados_order_id,
  
  -- Metadados
  c.created_at as client_created_at,
  so.created_at as order_created_at,
  GREATEST(COALESCE(c.updated_at, c.created_at), COALESCE(so.updated_at, so.created_at)) as updated_at
FROM public.clients c
LEFT JOIN public.service_orders so ON c.ordem_servico_ssgen = so.ordem_servico_ssgen;