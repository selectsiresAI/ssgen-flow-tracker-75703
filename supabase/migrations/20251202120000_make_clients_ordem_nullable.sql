BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

UPDATE public.clients
  SET id = gen_random_uuid()
  WHERE id IS NULL;

ALTER TABLE public.clients
  ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.service_orders
  DROP CONSTRAINT IF EXISTS service_orders_ordem_servico_ssgen_fkey;

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_pkey;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_pkey PRIMARY KEY (id);

ALTER TABLE public.clients
  ALTER COLUMN ordem_servico_ssgen DROP NOT NULL;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_ordem_servico_ssgen_key UNIQUE (ordem_servico_ssgen);

ALTER TABLE public.service_orders
  ADD CONSTRAINT service_orders_ordem_servico_ssgen_fkey
  FOREIGN KEY (ordem_servico_ssgen)
  REFERENCES public.clients (ordem_servico_ssgen);

COMMIT;
