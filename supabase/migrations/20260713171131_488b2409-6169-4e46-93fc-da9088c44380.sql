ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS pedido_ssb text,
  ADD COLUMN IF NOT EXISTS nf_ssb text;