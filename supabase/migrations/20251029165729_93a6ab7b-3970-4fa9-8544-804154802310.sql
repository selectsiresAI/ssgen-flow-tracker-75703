-- Drop the view first to avoid dependency issues
DROP VIEW IF EXISTS public.vw_orders_unified;

-- Add numero_amostras column to service_orders table
ALTER TABLE public.service_orders
ADD COLUMN IF NOT EXISTS numero_amostras numeric;

-- Remove recebimento_data and recebimento_status columns from service_orders table
ALTER TABLE public.service_orders
DROP COLUMN IF EXISTS recebimento_data,
DROP COLUMN IF EXISTS recebimento_status;

-- Recreate vw_orders_unified view without recebimento columns
CREATE VIEW public.vw_orders_unified AS
SELECT 
  c.ordem_servico_ssgen,
  c.data AS data_cadastro,
  c.nome AS cliente_nome,
  c.cpf_cnpj,
  c.representante,
  c.coordenador,
  c.ordem_servico_neogen,
  c.ie_rg,
  c.codigo,
  c.status AS cliente_status,
  c.id_conta_ssgen,
  c.created_at AS client_created_at,
  so.id AS ordem_id,
  so.nome_produto,
  so.numero_amostras,
  so.cra_data,
  so.cra_status,
  so.envio_planilha_data,
  so.envio_planilha_status,
  so.vri_data,
  so.vri_n_amostras,
  so.lpr_data,
  so.lpr_n_amostras,
  so.liberacao_data,
  so.liberacao_n_amostras,
  so.envio_resultados_data,
  so.envio_resultados_status,
  so.envio_resultados_previsao,
  so.envio_resultados_data_final,
  so.envio_resultados_ordem_id,
  so.envio_resultados_order_id,
  so.envio_resultados_data_prova,
  so.numero_nf_neogen,
  so.numero_teste_nota_neogen,
  so.created_at AS order_created_at,
  so.updated_at
FROM public.clients c
LEFT JOIN public.service_orders so ON c.ordem_servico_ssgen = so.ordem_servico_ssgen;