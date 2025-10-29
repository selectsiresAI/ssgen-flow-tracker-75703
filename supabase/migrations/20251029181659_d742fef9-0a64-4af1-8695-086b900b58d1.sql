-- Corrigir função calcular_status_sla adicionando search_path
CREATE OR REPLACE FUNCTION public.calcular_status_sla(
  data_inicio date,
  data_fim date,
  dias_alvo integer
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Corrigir função atualizar_status_sla adicionando search_path
CREATE OR REPLACE FUNCTION public.atualizar_status_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      NULL,
      config_envio.dias_alvo
    );
  END IF;
  
  RETURN NEW;
END;
$$;