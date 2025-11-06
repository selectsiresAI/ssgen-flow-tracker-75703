-- SSGEN Tracker - Migração Completa v2 (CORRIGIDA)

-- 0) Coluna liberacao_data
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS liberacao_data DATE;

-- 1) Numeração automática da OS (ordem_servico_ssgen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'service_orders_os_seq') THEN
    EXECUTE 'CREATE SEQUENCE public.service_orders_os_seq START ' || 
      COALESCE((SELECT MAX(ordem_servico_ssgen)::bigint + 1 FROM public.service_orders WHERE ordem_servico_ssgen IS NOT NULL), 1) || 
      ' INCREMENT 1';
  END IF;
END$$;

-- 2) Campos operacionais
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS etapa_atual TEXT DEFAULT 'Recebida',
  ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'Normal',
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_days INTEGER;

CREATE INDEX IF NOT EXISTS idx_so_received_at ON public.service_orders (received_at);
CREATE INDEX IF NOT EXISTS idx_so_etapa ON public.service_orders (etapa_atual);

-- 3) Histórico de etapas
CREATE TABLE IF NOT EXISTS public.service_order_stage_history (
  id BIGSERIAL PRIMARY KEY,
  service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_sosh_so ON public.service_order_stage_history(service_order_id, changed_at);

-- 4) Amostras por OS
CREATE TABLE IF NOT EXISTS public.service_order_samples (
  id BIGSERIAL PRIMARY KEY,
  service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
  sample_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5) Soft-delete em cadastros
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.coordenadores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.representantes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 6) Tabela de invoices (faturamento)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID REFERENCES public.service_orders(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL,
  issued_on DATE NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_so ON public.invoices(service_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issued ON public.invoices(issued_on);

-- 7) Views para KPIs reais
CREATE OR REPLACE VIEW public.v_kpi_orders AS
SELECT
  COUNT(*)::INT AS total_orders,
  COUNT(*) FILTER (WHERE so.completed_at IS NULL)::INT AS open_orders,
  COUNT(*) FILTER (WHERE so.completed_at IS NOT NULL)::INT AS closed_orders,
  COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(so.completed_at, now()) - COALESCE(so.received_at, so.created_at)))/86400.0), 0)::NUMERIC(10,2) AS avg_tat_days,
  COALESCE(AVG(
    CASE WHEN so.completed_at IS NOT NULL AND so.sla_days IS NOT NULL
      THEN CASE WHEN so.completed_at <= COALESCE(so.received_at, so.created_at) + (so.sla_days || ' days')::INTERVAL THEN 1 ELSE 0 END
    END
  ), 0)::NUMERIC(10,2) AS sla_on_time_ratio,
  COALESCE(SUM(s_cnt.samples_count), 0)::INT AS total_samples,
  COUNT(DISTINCT c.nome)::INT AS active_clients,
  COUNT(*) FILTER (WHERE so.etapa_atual = 'Em processamento')::INT AS em_processamento,
  COUNT(*) FILTER (WHERE so.etapa_atual = 'Liberada' AND NOT EXISTS (
    SELECT 1 FROM public.invoices i WHERE i.service_order_id = so.id AND i.deleted_at IS NULL
  ))::INT AS a_faturar,
  COUNT(*) FILTER (WHERE so.completed_at::DATE = CURRENT_DATE)::INT AS concluidas_hoje
FROM public.service_orders so
LEFT JOIN public.clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen AND c.deleted_at IS NULL
LEFT JOIN (
  SELECT service_order_id, COUNT(*)::INT AS samples_count
  FROM public.service_order_samples 
  GROUP BY service_order_id
) s_cnt ON s_cnt.service_order_id = so.id;

CREATE OR REPLACE VIEW public.v_monthly_billing AS
SELECT
  DATE_TRUNC('month', i.issued_on)::DATE AS month,
  SUM(i.amount)::NUMERIC(14,2) AS total_revenue,
  COUNT(*)::INT AS n_invoices
FROM public.invoices i
WHERE i.deleted_at IS NULL
GROUP BY 1
ORDER BY 1;

-- 8) Aging por etapa
CREATE OR REPLACE VIEW public.v_orders_aging AS
WITH last_change AS (
  SELECT 
    sosh.service_order_id,
    MAX(sosh.changed_at) AS last_changed_at
  FROM public.service_order_stage_history sosh
  GROUP BY 1
)
SELECT
  so.id,
  so.ordem_servico_ssgen,
  so.etapa_atual,
  so.sla_days,
  so.received_at,
  so.completed_at,
  COALESCE(lc.last_changed_at, so.received_at, so.created_at) AS etapa_started_at,
  EXTRACT(EPOCH FROM (now() - COALESCE(lc.last_changed_at, so.received_at, so.created_at)))/86400.0 AS aging_days,
  CASE
    WHEN so.sla_days IS NULL THEN FALSE
    WHEN now() > COALESCE(so.received_at, so.created_at) + (so.sla_days || ' days')::INTERVAL THEN TRUE
    ELSE FALSE
  END AS overdue,
  c.nome AS cliente_nome
FROM public.service_orders so
LEFT JOIN last_change lc ON lc.service_order_id = so.id
LEFT JOIN public.clients c ON c.ordem_servico_ssgen = so.ordem_servico_ssgen;

-- 9) RLS para novas tabelas
ALTER TABLE public.service_order_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policies para service_order_stage_history
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sosh_select' AND tablename = 'service_order_stage_history') THEN
    CREATE POLICY "sosh_select" ON public.service_order_stage_history
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sosh_insert' AND tablename = 'service_order_stage_history') THEN
    CREATE POLICY "sosh_insert" ON public.service_order_stage_history
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END$$;

-- Policies para service_order_samples
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sos_select' AND tablename = 'service_order_samples') THEN
    CREATE POLICY "sos_select" ON public.service_order_samples
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sos_insert' AND tablename = 'service_order_samples') THEN
    CREATE POLICY "sos_insert" ON public.service_order_samples
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END$$;

-- Policies para invoices
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'invoices_select' AND tablename = 'invoices') THEN
    CREATE POLICY "invoices_select" ON public.invoices
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'invoices_all_adm' AND tablename = 'invoices') THEN
    CREATE POLICY "invoices_all_adm" ON public.invoices
      FOR ALL TO authenticated 
      USING (has_role(auth.uid(), 'ADM'::app_role))
      WITH CHECK (has_role(auth.uid(), 'ADM'::app_role));
  END IF;
END$$;

-- 10) Função helper para próximo número de OS
CREATE OR REPLACE FUNCTION public.next_ordem_servico_ssgen()
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN nextval('public.service_orders_os_seq')::NUMERIC;
END;
$$;