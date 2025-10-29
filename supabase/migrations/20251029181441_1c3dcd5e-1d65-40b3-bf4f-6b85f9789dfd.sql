-- Adicionar coluna VRI resolvido
ALTER TABLE public.service_orders 
ADD COLUMN vri_resolvido_data date;

-- Remover colunas de Liberação usando CASCADE
ALTER TABLE public.service_orders 
DROP COLUMN IF EXISTS liberacao_data CASCADE,
DROP COLUMN IF EXISTS liberacao_n_amostras CASCADE;

-- Adicionar colunas de status SLA para cada processo
ALTER TABLE public.service_orders 
ADD COLUMN envio_planilha_status_sla text,
ADD COLUMN vri_status_sla text,
ADD COLUMN lpr_status_sla text,
ADD COLUMN envio_resultados_status_sla text;

-- Recriar a view vw_orders_unified sem as colunas removidas
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
  so.numero_amostras,
  so.numero_nf_neogen,
  so.cra_data,
  so.cra_status,
  so.envio_planilha_data,
  so.envio_planilha_status,
  so.vri_data,
  so.vri_n_amostras,
  so.lpr_data,
  so.lpr_n_amostras,
  so.envio_resultados_ordem_id,
  so.envio_resultados_data,
  so.envio_resultados_previsao,
  so.envio_resultados_status,
  so.nome_produto,
  so.envio_resultados_data_prova,
  so.created_at AS order_created_at
FROM clients c
LEFT JOIN service_orders so ON c.ordem_servico_ssgen = so.ordem_servico_ssgen;

-- Inserir novas configurações de SLA para os processos
INSERT INTO public.sla_config (etapa, dias_alvo, cor_dentro_prazo, cor_dia_zero, cor_fora_prazo, ativo) VALUES
('CRA para Envio Planilha', 5, 'success', 'warning', 'destructive', true),
('VRI até Resolução', 3, 'success', 'warning', 'destructive', true),
('LPR até Recebimento Resultados', 7, 'success', 'warning', 'destructive', true),
('Recebimento até Envio Resultados', 2, 'success', 'warning', 'destructive', true)
ON CONFLICT DO NOTHING;

-- Criar função para calcular status SLA automaticamente
CREATE OR REPLACE FUNCTION public.calcular_status_sla(
  data_inicio date,
  data_fim date,
  dias_alvo integer
)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  dias_decorridos integer;
BEGIN
  -- Se não há data de início, retorna null
  IF data_inicio IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Se já foi concluído (tem data_fim), calcular baseado no tempo real
  IF data_fim IS NOT NULL THEN
    dias_decorridos := data_fim - data_inicio;
  ELSE
    -- Se ainda não foi concluído, calcular baseado na data atual
    dias_decorridos := CURRENT_DATE - data_inicio;
  END IF;
  
  -- Retornar status baseado nos dias
  IF dias_decorridos < dias_alvo THEN
    RETURN 'no_prazo';
  ELSIF dias_decorridos = dias_alvo THEN
    RETURN 'dia_zero';
  ELSE
    RETURN 'atrasado';
  END IF;
END;
$$;

-- Criar trigger para atualizar status SLA automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_status_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  config_cra_planilha record;
  config_vri record;
  config_lpr record;
  config_envio record;
BEGIN
  -- Buscar configurações de SLA
  SELECT dias_alvo INTO config_cra_planilha FROM sla_config WHERE etapa = 'CRA para Envio Planilha' AND ativo = true LIMIT 1;
  SELECT dias_alvo INTO config_vri FROM sla_config WHERE etapa = 'VRI até Resolução' AND ativo = true LIMIT 1;
  SELECT dias_alvo INTO config_lpr FROM sla_config WHERE etapa = 'LPR até Recebimento Resultados' AND ativo = true LIMIT 1;
  SELECT dias_alvo INTO config_envio FROM sla_config WHERE etapa = 'Recebimento até Envio Resultados' AND ativo = true LIMIT 1;
  
  -- Calcular status para CRA -> Envio Planilha
  IF config_cra_planilha IS NOT NULL THEN
    NEW.envio_planilha_status_sla := calcular_status_sla(
      NEW.cra_data,
      NEW.envio_planilha_data,
      config_cra_planilha.dias_alvo
    );
  END IF;
  
  -- Calcular status para VRI até Resolução
  IF config_vri IS NOT NULL THEN
    NEW.vri_status_sla := calcular_status_sla(
      NEW.vri_data,
      NEW.vri_resolvido_data,
      config_vri.dias_alvo
    );
  END IF;
  
  -- Calcular status para LPR até Recebimento Resultados
  IF config_lpr IS NOT NULL THEN
    NEW.lpr_status_sla := calcular_status_sla(
      NEW.lpr_data,
      NEW.envio_resultados_data,
      config_lpr.dias_alvo
    );
  END IF;
  
  -- Calcular status para Recebimento até Envio Resultados
  IF config_envio IS NOT NULL AND NEW.envio_resultados_data IS NOT NULL THEN
    NEW.envio_resultados_status_sla := calcular_status_sla(
      NEW.envio_resultados_data,
      NULL, -- Assumindo que não há uma data final específica
      config_envio.dias_alvo
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar antes de INSERT ou UPDATE
DROP TRIGGER IF EXISTS trigger_atualizar_status_sla ON public.service_orders;
CREATE TRIGGER trigger_atualizar_status_sla
BEFORE INSERT OR UPDATE ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_status_sla();