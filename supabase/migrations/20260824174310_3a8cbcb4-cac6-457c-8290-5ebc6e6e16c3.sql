REVOKE EXECUTE ON FUNCTION public.atualizar_status_sla() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.propagate_numero_amostras() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_sync_order_to_platform() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calcular_status_sla(date, date, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calcular_status_sla(date, date, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.link_order_to_client(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_order_to_client(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_order_date(text, text, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_order_date(text, text, date) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_order_stage(uuid, text, date, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_order_stage(uuid, text, date, uuid) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_profile() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.next_ordem_servico_ssgen() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_ordem_servico_ssgen() TO authenticated, service_role;