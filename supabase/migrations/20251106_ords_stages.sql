-- 1. Garantir colunas em service_orders (snake_case)
alter table if exists public.service_orders
  add column if not exists os_ssgen text,
  add column if not exists dt_cra date,
  add column if not exists dt_plan_neogen date,
  add column if not exists dt_vri date,
  add column if not exists dt_lpr date,
  add column if not exists dt_lr date,
  add column if not exists dt_result_ssg date,
  add column if not exists dt_fatur_ssg date;

-- 2. Histórico de etapas (se não existir)
create table if not exists public.service_order_stage_history (
  id bigint generated always as identity primary key,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  etapa text not null,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  notes text
);

-- 3. RPC: Atualiza data por ID + grava histórico
create or replace function public.update_order_stage(
  p_order_id uuid,
  p_field text,    -- 'dt_cra' | 'dt_plan_neogen' | 'dt_vri' | 'dt_lpr' | 'dt_lr' | 'dt_result_ssg' | 'dt_fatur_ssg'
  p_value date,
  p_user uuid default null
) returns void language plpgsql as $$
declare
  v_etapa text;
begin
  execute format('update public.service_orders set %I = $1 where id = $2', p_field)
  using p_value, p_order_id;

  v_etapa := case p_field
    when 'dt_cra' then 'CRA'
    when 'dt_plan_neogen' then 'PLANILHA'
    when 'dt_vri' then 'VRI'
    when 'dt_lpr' then 'LPR'
    when 'dt_lr' then 'LR'
    when 'dt_result_ssg' then 'RESULTADOS'
    when 'dt_fatur_ssg' then 'FATURAR'
    else null end;

  if v_etapa is not null then
    insert into public.service_order_stage_history(service_order_id, etapa, changed_by, changed_at)
    values (p_order_id, v_etapa, coalesce(p_user, auth.uid()), now());
  end if;
end $$;

-- 4. RPC: Fallback por código textual (quando a view não expõe id)
create or replace function public.update_order_date(
  p_os_ssgen text,
  p_field text,
  p_value date
) returns void language plpgsql as $$
declare v_id uuid;
begin
  select id into v_id from public.service_orders where os_ssgen = p_os_ssgen limit 1;
  if v_id is null then
    raise exception 'OS % não encontrada', p_os_ssgen;
  end if;
  execute format('update public.service_orders set %I = $1 where id = $2', p_field)
  using p_value, v_id;
end $$;

-- 5. View utilizada pelo front (ajuste conforme seu schema real)
create or replace view public.vw_orders_powerbi as
select
  so.id,
  so.os_ssgen as "OS_SSGEN",
  so.dt_cra as "DT_CRA",
  so.dt_plan_neogen as "DT_PLAN_NEOGEN",
  so.dt_vri as "DT_VRI",
  so.dt_lpr as "DT_LPR",
  so.dt_lr as "DT_LR",
  so.dt_result_ssg as "DT_RESULT_SSG",
  so.dt_fatur_ssg as "DT_FATUR_SSG",
  -- demais colunas usadas na UI (ajuste se necessário)
  so.client_name as "CLIENTE",
  so.coord as "COORD",
  so.rep as "REP",
  so.prod_ssg as "PROD_SSG",
  so.n_amostras_ssg as "N_AMOSTRAS_SSG",
  so.dt_ssgen_os as "DT_SSGEN_OS",
  so.dt_prev_result_ssg as "DT_PREV_RESULT_SSG",
  so.result_ssg as "RESULT_SSG",
  so.fatur_tipo as "FATUR_TIPO",
  so.fatur_ssg as "FATUR_SSG",
  so.os_neogen as "OS_NEOGEN",
  so.plan_neogen as "PLAN_NEOGEN",
  so.n_vri as "N_VRI",
  so.n_lpr as "N_LPR",
  so.n_lr as "N_LR",
  so.lr_rastreio as "LR_RASTREIO",
  so.nf_neogen as "NF_NEOGEM"
from public.service_orders so;
