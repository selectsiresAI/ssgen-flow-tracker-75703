-- Ensure tracker timelines view exposes explicit access scopes for filtering
create or replace view public.v_tracker_timelines as
with service_base as (
  select
    so.id::text as source_id,
    so.client_id,
    c.id_conta_ssgen,
    so.ordem_servico_ssgen,
    c.nome as cliente_nome,
    so.prioridade,
    so.flag_reagendamento,
    so.issue_text,
    so.cra_data,
    so.envio_planilha_data,
    so.envio_planilha_status_sla,
    so.vri_data,
    so.vri_status_sla,
    so.vri_resolvido_data,
    so.lpr_data,
    so.lpr_status_sla,
    so.dt_receb_resultados,
    so.envio_resultados_data,
    so.envio_resultados_status_sla,
    so.dt_faturamento,
    so.numero_amostras,
    so.created_at,
    so.updated_at,
    coalesce(
      array_cat(
        coalesce(array_agg(distinct rc.rep_id) filter (where rc.rep_id is not null), array[]::uuid[]),
        coalesce(
          array_agg(distinct mr.manager_id) filter (where mr.manager_id is not null),
          array[]::uuid[]
        )
      ),
      array[]::uuid[]
    ) as accessible_user_ids
  from public.service_orders so
  join public.clients c on c.id = so.client_id
  left join public.reps_clients rc on rc.client_id = so.client_id
  left join public.managers_reps mr on mr.rep_id = rc.rep_id
  where so.deleted_at is null
    and c.deleted_at is null
  group by
    so.id,
    so.client_id,
    c.id_conta_ssgen,
    so.ordem_servico_ssgen,
    c.nome,
    so.prioridade,
    so.flag_reagendamento,
    so.issue_text,
    so.cra_data,
    so.envio_planilha_data,
    so.envio_planilha_status_sla,
    so.vri_data,
    so.vri_status_sla,
    so.vri_resolvido_data,
    so.lpr_data,
    so.lpr_status_sla,
    so.dt_receb_resultados,
    so.envio_resultados_data,
    so.envio_resultados_status_sla,
    so.dt_faturamento,
    so.numero_amostras,
    so.created_at,
    so.updated_at
),
service as (
  select
    source_id,
    'service_orders'::text as source,
    client_id,
    id_conta_ssgen,
    ordem_servico_ssgen::numeric as ordem_servico_ssgen,
    coalesce(cliente_nome, '—') as cliente,
    coalesce(prioridade, 'media') as prioridade,
    coalesce(flag_reagendamento, false) as flag_reagendamento,
    issue_text,
    cra_data,
    envio_planilha_data,
    envio_planilha_status_sla,
    vri_data,
    vri_status_sla,
    vri_resolvido_data,
    lpr_data,
    lpr_status_sla,
    dt_receb_resultados,
    envio_resultados_data,
    envio_resultados_status_sla,
    dt_faturamento,
    case
      when dt_faturamento is not null then 'Faturamento'
      when envio_resultados_data is not null then 'Envio Resultados'
      when dt_receb_resultados is not null then 'Recebimento Resultados'
      when lpr_data is not null then 'LPR'
      when vri_resolvido_data is not null then 'VRI Resolvido'
      when vri_data is not null then 'VRI'
      when envio_planilha_data is not null then 'Envio Planilha'
      when cra_data is not null then 'CRA'
      else 'Pendente'
    end as etapa_atual,
    case
      when cra_data is not null then greatest(0, floor(extract(epoch from (now() - cra_data)) / 86400))::int
      else null
    end as aging_dias_total,
    numero_amostras,
    created_at,
    updated_at,
    accessible_user_ids
  from service_base
),
legacy_base as (
  select
    o.id::text as source_id,
    c.id_conta_ssgen,
    o.os_ssgen,
    c.nome as cliente_nome,
    o.cliente as fallback_cliente,
    o.n_amostras_ssg as numero_amostras,
    o.dt_cra,
    o.dt_plan_neogen,
    o.dt_vri,
    o.dt_lpr,
    o.dt_lr,
    o.dt_result_ssg,
    o.dt_fatur_ssg,
    o.created_at,
    o.updated_at,
    coalesce(
      array_cat(
        coalesce(array_agg(distinct rc.rep_id) filter (where rc.rep_id is not null), array[]::uuid[]),
        coalesce(
          array_agg(distinct mr.manager_id) filter (where mr.manager_id is not null),
          array[]::uuid[]
        )
      ),
      array[]::uuid[]
    ) as accessible_user_ids
  from public.orders o
  left join public.clients c on c.ordem_servico_ssgen = case
    when o.os_ssgen ~ '^[0-9]+$' then o.os_ssgen::numeric
    else null
  end
  left join public.reps_clients rc on rc.client_id = c.id
  left join public.managers_reps mr on mr.rep_id = rc.rep_id
  where o.deleted_at is null
  group by
    o.id,
    c.id_conta_ssgen,
    o.os_ssgen,
    c.nome,
    o.cliente,
    o.n_amostras_ssg,
    o.dt_cra,
    o.dt_plan_neogen,
    o.dt_vri,
    o.dt_lpr,
    o.dt_lr,
    o.dt_result_ssg,
    o.dt_fatur_ssg,
    o.created_at,
    o.updated_at
),
legacy as (
  select
    source_id,
    'orders'::text as source,
    null::uuid as client_id,
    id_conta_ssgen,
    case
      when os_ssgen ~ '^[0-9]+$' then os_ssgen::numeric
      else null
    end as ordem_servico_ssgen,
    coalesce(cliente_nome, fallback_cliente, '—') as cliente,
    'media'::text as prioridade,
    false as flag_reagendamento,
    null::text as issue_text,
    dt_cra as cra_data,
    dt_plan_neogen as envio_planilha_data,
    null::text as envio_planilha_status_sla,
    dt_vri as vri_data,
    null::text as vri_status_sla,
    null::timestamp as vri_resolvido_data,
    dt_lpr as lpr_data,
    null::text as lpr_status_sla,
    dt_lr as dt_receb_resultados,
    dt_result_ssg as envio_resultados_data,
    null::text as envio_resultados_status_sla,
    dt_fatur_ssg as dt_faturamento,
    case
      when dt_fatur_ssg is not null then 'Faturamento'
      when dt_result_ssg is not null then 'Envio Resultados'
      when dt_lr is not null then 'Recebimento Resultados'
      when dt_lpr is not null then 'LPR'
      when dt_vri is not null then 'VRI'
      when dt_plan_neogen is not null then 'Envio Planilha'
      when dt_cra is not null then 'CRA'
      else 'Pendente'
    end as etapa_atual,
    case
      when dt_cra is not null then greatest(0, floor(extract(epoch from (now() - dt_cra)) / 86400))::int
      else null
    end as aging_dias_total,
    numero_amostras,
    created_at,
    updated_at,
    accessible_user_ids
  from legacy_base
)
select * from service
union all
select * from legacy;
