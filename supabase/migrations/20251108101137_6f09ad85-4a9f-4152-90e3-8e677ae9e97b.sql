-- Criar tabela de histórico de auditoria para mudanças nas ordens
CREATE TABLE IF NOT EXISTS public.order_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  ordem_servico_ssgen TEXT,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_email TEXT,
  user_role TEXT
);

-- Criar índices para performance
CREATE INDEX idx_order_audit_log_order_id ON public.order_audit_log(order_id);
CREATE INDEX idx_order_audit_log_changed_at ON public.order_audit_log(changed_at DESC);
CREATE INDEX idx_order_audit_log_changed_by ON public.order_audit_log(changed_by);

-- Habilitar RLS
ALTER TABLE public.order_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: ADM pode ver tudo, COORDENADOR vê de suas coordenações, REP vê suas ordens
CREATE POLICY "ADM can view all audit logs"
  ON public.order_audit_log
  FOR SELECT
  USING (has_role(auth.uid(), 'ADM'::app_role));

CREATE POLICY "COORDENADOR can view audit logs of their coord"
  ON public.order_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN user_roles ur ON ur.coord = o.coord
      WHERE o.id = order_audit_log.order_id
        AND ur.user_id = auth.uid()
        AND ur.role = 'COORDENADOR'::app_role
    )
  );

CREATE POLICY "REPRESENTANTE can view audit logs of their orders"
  ON public.order_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN user_roles ur ON ur.rep = o.rep
      WHERE o.id = order_audit_log.order_id
        AND ur.user_id = auth.uid()
        AND ur.role = 'REPRESENTANTE'::app_role
    )
  );

-- Adicionar comentário
COMMENT ON TABLE public.order_audit_log IS 'Histórico de auditoria para rastrear mudanças nas etapas das ordens de serviço';