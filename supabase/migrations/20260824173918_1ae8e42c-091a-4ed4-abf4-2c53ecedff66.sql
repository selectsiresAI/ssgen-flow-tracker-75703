-- 1) Backup tables: admin-only
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE '%\_backup\_20251111\_000000'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS backup_admin_only ON public.%I', t);
    EXECUTE format('CREATE POLICY backup_admin_only ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''ADM''::app_role))', t);
  END LOOP;
END $$;

-- 2) Live coordenador_representante table
ALTER TABLE public.coordenador_representante ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coordenador_representante FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coordenador_representante TO authenticated;
GRANT ALL ON public.coordenador_representante TO service_role;
DROP POLICY IF EXISTS cr_select_authenticated ON public.coordenador_representante;
CREATE POLICY cr_select_authenticated ON public.coordenador_representante
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS cr_admin_manage ON public.coordenador_representante;
CREATE POLICY cr_admin_manage ON public.coordenador_representante
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ADM'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'ADM'::app_role));

-- 3) All public views run with the querying user's permissions
DO $$
DECLARE v text;
BEGIN
  FOR v IN SELECT viewname FROM pg_views WHERE schemaname='public' LOOP
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v);
  END LOOP;
END $$;

-- 4) Invoices: scope reads
DROP POLICY IF EXISTS invoices_select ON public.invoices;
CREATE POLICY invoices_select ON public.invoices
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'ADM'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.service_orders so
    JOIN public.clients c ON c.id = so.client_id
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE so.id = invoices.service_order_id
      AND ((ur.role = 'GERENTE'::app_role AND ur.coord IS NOT NULL AND ur.coord = c.coordenador)
        OR (ur.role = 'REPRESENTANTE'::app_role AND ur.rep IS NOT NULL AND ur.rep = c.representante))
  )
);

-- 5) Samples: scope reads, admin-only inserts
DROP POLICY IF EXISTS sos_select ON public.service_order_samples;
CREATE POLICY sos_select ON public.service_order_samples
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'ADM'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.service_orders so
    JOIN public.clients c ON c.id = so.client_id
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE so.id = service_order_samples.service_order_id
      AND ((ur.role = 'GERENTE'::app_role AND ur.coord IS NOT NULL AND ur.coord = c.coordenador)
        OR (ur.role = 'REPRESENTANTE'::app_role AND ur.rep IS NOT NULL AND ur.rep = c.representante))
  )
);
DROP POLICY IF EXISTS sos_insert ON public.service_order_samples;
CREATE POLICY sos_insert ON public.service_order_samples
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ADM'::app_role));

-- 6) Stage history: scope reads, admin-only inserts
DROP POLICY IF EXISTS sosh_select ON public.service_order_stage_history;
CREATE POLICY sosh_select ON public.service_order_stage_history
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'ADM'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.service_orders so
    JOIN public.clients c ON c.id = so.client_id
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE so.id = service_order_stage_history.service_order_id
      AND ((ur.role = 'GERENTE'::app_role AND ur.coord IS NOT NULL AND ur.coord = c.coordenador)
        OR (ur.role = 'REPRESENTANTE'::app_role AND ur.rep IS NOT NULL AND ur.rep = c.representante))
  )
);
DROP POLICY IF EXISTS sosh_insert ON public.service_order_stage_history;
CREATE POLICY sosh_insert ON public.service_order_stage_history
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ADM'::app_role));

-- 7) Service orders: remove unrestricted update (ADM policy already grants full access)
DROP POLICY IF EXISTS so_update_active ON public.service_orders;

-- 8) Functions: fixed search_path + revoke public execute
ALTER FUNCTION public._ssgen_only_digits(text) SET search_path = public;
ALTER FUNCTION public._ssgen_os_pad_width() SET search_path = public;
ALTER FUNCTION public._ssgen_to_bigint_safe(text) SET search_path = public;
ALTER FUNCTION public.f_set_os_ssgen_before_insert() SET search_path = public;
ALTER FUNCTION public.propagate_numero_amostras() SET search_path = public;
ALTER FUNCTION public.tg_orders_after_insert() SET search_path = public;
ALTER FUNCTION public.trigger_sync_order_to_platform() SET search_path = public;
ALTER FUNCTION public.update_order_date(text, text, date) SET search_path = public;
ALTER FUNCTION public.update_order_stage(uuid, text, date, uuid) SET search_path = public;

-- trigger / internal functions: not callable via API
REVOKE EXECUTE ON FUNCTION public.atualizar_status_sla() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_user_role() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.propagate_numero_amostras() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_orders_after_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_sync_order_to_platform() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.f_set_os_ssgen_before_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calcular_status_sla(date, date, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_ordem_servico_ssgen() FROM anon;
REVOKE EXECUTE ON FUNCTION public.link_order_to_client(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_order_date(text, text, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_order_stage(uuid, text, date, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public._ssgen_only_digits(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public._ssgen_os_pad_width() FROM anon;
REVOKE EXECUTE ON FUNCTION public._ssgen_to_bigint_safe(text) FROM anon;