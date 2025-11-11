-- ============================================================
-- FIX: RLS Policies - Prevenir acesso total quando coord/rep são NULL
-- ============================================================

-- 1. REPRESENTANTES: Apenas coordenadores atribuídos podem ver seus reps
DROP POLICY IF EXISTS "GERENTE can view representantes" ON public.representantes;
DROP POLICY IF EXISTS "REPRESENTANTE can view representantes" ON public.representantes;

CREATE POLICY "GERENTE can view representantes"
ON public.representantes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'GERENTE'
      AND user_roles.coord IS NOT NULL
      -- Representantes vinculados ao coordenador através de clientes
      AND EXISTS (
        SELECT 1 FROM clients c
        WHERE c.coordenador = user_roles.coord
          AND c.representante = representantes.nome
          AND c.deleted_at IS NULL
      )
  )
);

CREATE POLICY "REPRESENTANTE can view themselves"
ON public.representantes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'REPRESENTANTE'
      AND user_roles.rep IS NOT NULL
      AND user_roles.rep = representantes.nome
  )
);

-- 2. CLIENTS: Garantir que coord/rep não null
DROP POLICY IF EXISTS "GERENTE can view their coord clients" ON public.clients;
DROP POLICY IF EXISTS "REPRESENTANTE can view their clients" ON public.clients;

CREATE POLICY "GERENTE can view their coord clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'GERENTE'
      AND user_roles.coord IS NOT NULL
      AND user_roles.coord = clients.coordenador
  )
);

CREATE POLICY "REPRESENTANTE can view their clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'REPRESENTANTE'
      AND user_roles.rep IS NOT NULL
      AND user_roles.rep = clients.representante
  )
);

-- 3. SERVICE_ORDERS: Filtrar por client_id vinculado ao coord/rep
DROP POLICY IF EXISTS "GERENTE can view their coord orders" ON public.service_orders;
DROP POLICY IF EXISTS "REPRESENTANTE can view their orders" ON public.service_orders;

CREATE POLICY "GERENTE can view their coord service_orders"
ON public.service_orders
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN clients c ON c.coordenador = ur.coord
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'GERENTE'
      AND ur.coord IS NOT NULL
      AND (
        service_orders.client_id = c.id
        OR EXISTS (
          SELECT 1 FROM orders o
          WHERE o.coord = ur.coord
            AND o.deleted_at IS NULL
        )
      )
  )
);

CREATE POLICY "REPRESENTANTE can view their service_orders"
ON public.service_orders
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN clients c ON c.representante = ur.rep
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'REPRESENTANTE'
      AND ur.rep IS NOT NULL
      AND service_orders.client_id = c.id
  )
);

-- 4. ORDERS: Garantir coord/rep não null
DROP POLICY IF EXISTS "Managers can view their coord orders" ON public.orders;
DROP POLICY IF EXISTS "Reps can view their orders" ON public.orders;

CREATE POLICY "GERENTE can view their coord orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'GERENTE'
      AND user_roles.coord IS NOT NULL
      AND user_roles.coord = orders.coord
  )
);

CREATE POLICY "REPRESENTANTE can view their orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'REPRESENTANTE'
      AND user_roles.rep IS NOT NULL
      AND user_roles.rep = orders.rep
  )
);