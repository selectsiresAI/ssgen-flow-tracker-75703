-- Fix clients table primary key issue
-- Step 1: Drop the foreign key that depends on clients.id
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_client_id_fkey;

-- Step 2: Drop the old primary key on ordem_servico_ssgen
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_pkey;

-- Step 3: Drop the unique constraint on id
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_id_key;

-- Step 4: Make id NOT NULL (required for primary key)
ALTER TABLE public.clients ALTER COLUMN id SET NOT NULL;

-- Step 5: Add id as the new primary key
ALTER TABLE public.clients ADD PRIMARY KEY (id);

-- Step 6: Make ordem_servico_ssgen nullable
ALTER TABLE public.clients ALTER COLUMN ordem_servico_ssgen DROP NOT NULL;

-- Step 7: Set default to NULL instead of 0
ALTER TABLE public.clients ALTER COLUMN ordem_servico_ssgen SET DEFAULT NULL;

-- Step 8: Recreate the foreign key from service_orders to clients
ALTER TABLE public.service_orders 
ADD CONSTRAINT service_orders_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES public.clients(id) 
ON DELETE SET NULL;