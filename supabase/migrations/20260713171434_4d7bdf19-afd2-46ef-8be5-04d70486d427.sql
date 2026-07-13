ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS valor_por_amostra numeric(12,2);