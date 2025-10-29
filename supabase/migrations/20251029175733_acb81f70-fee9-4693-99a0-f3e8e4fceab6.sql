-- Criar função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar tabela para configurações de SLA
CREATE TABLE public.sla_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  etapa TEXT NOT NULL UNIQUE,
  dias_alvo INTEGER NOT NULL DEFAULT 5,
  cor_dentro_prazo TEXT NOT NULL DEFAULT 'success',
  cor_dia_zero TEXT NOT NULL DEFAULT 'warning',
  cor_fora_prazo TEXT NOT NULL DEFAULT 'destructive',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.sla_config (etapa, dias_alvo, cor_dentro_prazo, cor_dia_zero, cor_fora_prazo) VALUES
  ('planejamento', 5, 'success', 'warning', 'destructive'),
  ('resultado', 7, 'success', 'warning', 'destructive'),
  ('faturamento', 3, 'success', 'warning', 'destructive');

-- Enable RLS
ALTER TABLE public.sla_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "ADM can manage SLA config"
  ON public.sla_config
  FOR ALL
  USING (has_role(auth.uid(), 'ADM'::app_role));

CREATE POLICY "GERENTE can view SLA config"
  ON public.sla_config
  FOR SELECT
  USING (has_role(auth.uid(), 'GERENTE'::app_role));

CREATE POLICY "REPRESENTANTE can view SLA config"
  ON public.sla_config
  FOR SELECT
  USING (has_role(auth.uid(), 'REPRESENTANTE'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_sla_config_updated_at
  BEFORE UPDATE ON public.sla_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();