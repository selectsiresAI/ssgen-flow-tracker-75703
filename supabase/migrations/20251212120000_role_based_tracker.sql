-- Role-based access control and unified tracker view

-- 1. Users & relationships -------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text check (role in ('ADM','GERENTE','REPRESENTANTE')) not null default 'REPRESENTANTE',
  created_at timestamptz default now()
);

alter table public.users enable row level security;

drop policy if exists users_self_select on public.users;
drop policy if exists users_admin_all on public.users;
create policy users_self_select
on public.users
for select
using (id = auth.uid());

create policy users_admin_all
on public.users
for all
using (exists (
  select 1
  from public.users u
  where u.id = auth.uid()
    and u.role = 'ADM'
));

create table if not exists public.managers_reps (
  manager_id uuid not null references public.users(id) on delete cascade,
  rep_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (manager_id, rep_id)
);

create table if not exists public.reps_clients (
  rep_id uuid not null references public.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (rep_id, client_id)
);

alter table public.managers_reps enable row level security;
alter table public.reps_clients enable row level security;

drop policy if exists managers_reps_access on public.managers_reps;
create policy managers_reps_access
on public.managers_reps
for select
using (
  manager_id = auth.uid()
  or exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'ADM'
  )
);

create policy managers_reps_admin
on public.managers_reps
for all
using (exists (
  select 1 from public.users u
  where u.id = auth.uid() and u.role = 'ADM'
));

create policy reps_clients_access
on public.reps_clients
for select
using (
  rep_id = auth.uid()
  or exists (
    select 1 from public.managers_reps mr
    where mr.manager_id = auth.uid() and mr.rep_id = reps_clients.rep_id
  )
  or exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'ADM'
  )
);

create policy reps_clients_admin
on public.reps_clients
for all
using (exists (
  select 1 from public.users u
  where u.id = auth.uid() and u.role = 'ADM'
));

-- 2. Helpful indexes -------------------------------------------------------
create index if not exists idx_service_orders_client on public.service_orders(client_id);
create index if not exists idx_clients_id_conta on public.clients(id_conta_ssgen);
create index if not exists idx_orders_os_ssgen on public.orders(os_ssgen);
create index if not exists idx_orders_deleted_at on public.orders(deleted_at);

-- 3. RLS policies ----------------------------------------------------------
alter table public.service_orders enable row level security;
alter table public.clients enable row level security;
alter table public.orders enable row level security;

-- Clients policies
-- remove legacy policies
 drop policy if exists "ADM can manage all clients" on public.clients;
 drop policy if exists "GERENTE can view their coord clients" on public.clients;
 drop policy if exists "REPRESENTANTE can view their clients" on public.clients;

create policy clients_adm_all
on public.clients
for select using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADM')
);

create policy clients_rep_scope
on public.clients
for select using (
  exists (
    select 1
    from public.reps_clients rc
    where rc.client_id = clients.id
      and rc.rep_id = auth.uid()
  )
);

create policy clients_manager_scope
on public.clients
for select using (
  exists (
    select 1
    from public.managers_reps mr
    join public.reps_clients rc on rc.rep_id = mr.rep_id
    where mr.manager_id = auth.uid()
      and rc.client_id = clients.id
  )
);

-- Service orders policies
 drop policy if exists "ADM can manage all service_orders" on public.service_orders;
 drop policy if exists "GERENTE can view their coord service_orders" on public.service_orders;
 drop policy if exists "REPRESENTANTE can view their service_orders" on public.service_orders;

create policy so_adm_all
on public.service_orders
for select using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADM')
);

create policy so_rep_scope
on public.service_orders
for select using (
  service_orders.deleted_at is null and
  exists (
    select 1
    from public.reps_clients rc
    where rc.client_id = service_orders.client_id
      and rc.rep_id = auth.uid()
  )
);

create policy so_manager_scope
on public.service_orders
for select using (
  service_orders.deleted_at is null and
  exists (
    select 1
    from public.managers_reps mr
    join public.reps_clients rc on rc.rep_id = mr.rep_id
    where mr.manager_id = auth.uid()
      and rc.client_id = service_orders.client_id
  )
);

-- Orders (legacy) policies
 drop policy if exists "GERENTE can view their coord orders" on public.orders;
 drop policy if exists "REPRESENTANTE can view their orders" on public.orders;

create policy orders_adm_all
on public.orders
for select using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADM')
);

create policy orders_scoped
on public.orders
for select using (
  orders.deleted_at is null and
  exists (
    select 1
    from public.clients c
    join public.reps_clients rc on rc.client_id = c.id
    left join public.managers_reps mr on mr.rep_id = rc.rep_id
    where c.ordem_servico_ssgen is not null
      and c.ordem_servico_ssgen::text = orders.os_ssgen
      and (
        rc.rep_id = auth.uid()
        or mr.manager_id = auth.uid()
      )
  )
);

-- 4. Unified tracker view --------------------------------------------------
create or replace view public.v_tracker_timelines as
with service as (
  select
    so.id::text as source_id,
    'service_orders'::text as source,
    so.client_id,
    c.id_conta_ssgen,
    so.ordem_servico_ssgen::numeric as ordem_servico_ssgen,
    coalesce(c.nome, '—') as cliente,
    coalesce(so.prioridade, 'media') as prioridade,
    coalesce(so.flag_reagendamento, false) as flag_reagendamento,
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
    case
      when so.dt_faturamento is not null then 'Faturamento'
      when so.envio_resultados_data is not null then 'Envio Resultados'
      when so.dt_receb_resultados is not null then 'Recebimento Resultados'
      when so.lpr_data is not null then 'LPR'
      when so.vri_resolvido_data is not null then 'VRI Resolvido'
      when so.vri_data is not null then 'VRI'
      when so.envio_planilha_data is not null then 'Envio Planilha'
      when so.cra_data is not null then 'CRA'
      else 'Pendente'
    end as etapa_atual,
    case
      when so.cra_data is not null then greatest(0, floor(extract(epoch from (now() - so.cra_data)) / 86400))::int
      else null
    end as aging_dias_total,
    so.numero_amostras,
    so.created_at,
    so.updated_at
  from public.service_orders so
  join public.clients c on c.id = so.client_id
  where so.deleted_at is null
    and c.deleted_at is null
),
legacy as (
  select
    o.id::text as source_id,
    'orders'::text as source,
    null::uuid as client_id,
    c.id_conta_ssgen,
    case
      when o.os_ssgen ~ '^[0-9]+$' then o.os_ssgen::numeric
      else null
    end as ordem_servico_ssgen,
    coalesce(c.nome, o.cliente, '—') as cliente,
    'media'::text as prioridade,
    false as flag_reagendamento,
    null::text as issue_text,
    o.dt_cra,
    o.dt_plan_neogen as envio_planilha_data,
    null::text as envio_planilha_status_sla,
    o.dt_vri,
    null::text as vri_status_sla,
    null::timestamp as vri_resolvido_data,
    o.dt_lpr,
    null::text as lpr_status_sla,
    o.dt_lr as dt_receb_resultados,
    o.dt_result_ssg as envio_resultados_data,
    null::text as envio_resultados_status_sla,
    o.dt_fatur_ssg as dt_faturamento,
    case
      when o.dt_fatur_ssg is not null then 'Faturamento'
      when o.dt_result_ssg is not null then 'Envio Resultados'
      when o.dt_lr is not null then 'Recebimento Resultados'
      when o.dt_lpr is not null then 'LPR'
      when o.dt_vri is not null then 'VRI'
      when o.dt_plan_neogen is not null then 'Envio Planilha'
      when o.dt_cra is not null then 'CRA'
      else 'Pendente'
    end as etapa_atual,
    case
      when o.dt_cra is not null then greatest(0, floor(extract(epoch from (now() - o.dt_cra)) / 86400))::int
      else null
    end as aging_dias_total,
    o.n_amostras_ssg as numero_amostras,
    o.created_at,
    o.updated_at
  from public.orders o
  left join public.clients c on c.ordem_servico_ssgen = case
    when o.os_ssgen ~ '^[0-9]+$' then o.os_ssgen::numeric
    else null
  end
  where o.deleted_at is null
)
select * from service
union all
select * from legacy;

