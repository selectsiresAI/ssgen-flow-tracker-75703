-- Fase 1 & 2: Estrutura do Banco + Segurança

-- 1. Criar enum para papéis
CREATE TYPE app_role AS ENUM ('ADM', 'GERENTE', 'REPRESENTANTE');

-- 2. Tabela de perfis (sincronizada com auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tabela de papéis (CRÍTICO: separada para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  coord TEXT,
  rep TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Tabela de ordens (dados da planilha Excel)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ord TEXT,
  os_ssgen TEXT NOT NULL,
  dt_ssgen_os TIMESTAMPTZ,
  cod_ssb TEXT,
  cliente TEXT NOT NULL,
  lib_cad_cliente TEXT,
  plan_ssg TEXT,
  dt_plan_ssg TIMESTAMPTZ,
  prod_ssg TEXT,
  n_amostras_ssg INTEGER,
  dt_prev_result_ssg TIMESTAMPTZ,
  result_ssg TEXT,
  dt_result_ssg TIMESTAMPTZ,
  fatur_tipo TEXT,
  fatur_ssg DECIMAL,
  dt_fatur_ssg TIMESTAMPTZ,
  rep TEXT NOT NULL,
  coord TEXT NOT NULL,
  os_neogen TEXT,
  prod_neogen TEXT,
  n_amostras_neogen INTEGER,
  dt_cra TIMESTAMPTZ,
  plan_neogen TEXT,
  dt_plan_neogen TIMESTAMPTZ,
  n_vri INTEGER,
  dt_vri TIMESTAMPTZ,
  n_lpr INTEGER,
  dt_lpr TIMESTAMPTZ,
  n_lr INTEGER,
  dt_lr TIMESTAMPTZ,
  lr_rastreio TEXT,
  nf_neogem TEXT,
  nf_na_neogen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. Função security definer para verificar papéis (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. RLS Policies para profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'ADM'));

-- 9. RLS Policies para user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'ADM'));

-- 10. RLS Policies para orders
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'ADM'));

CREATE POLICY "Managers can view their coord orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'GERENTE'
        AND coord = orders.coord
    )
  );

CREATE POLICY "Reps can view their orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'REPRESENTANTE'
        AND rep = orders.rep
    )
  );

CREATE POLICY "Admins can manage orders"
  ON public.orders FOR ALL
  USING (public.has_role(auth.uid(), 'ADM'));

-- 11. View vw_orders_powerbi (compatível com código existente)
CREATE OR REPLACE VIEW public.vw_orders_powerbi AS
SELECT
  id::TEXT,
  ord AS "Ord",
  os_ssgen AS "OS_SSGEN",
  dt_ssgen_os AS "DT_SSGEN_OS",
  cod_ssb AS "COD_SSB",
  cliente AS "CLIENTE",
  lib_cad_cliente AS "LIB_CAD_CLIENTE",
  plan_ssg AS "PLAN_SSG",
  dt_plan_ssg AS "DT_PLAN_SSG",
  prod_ssg AS "PROD_SSG",
  n_amostras_ssg AS "N_AMOSTRAS_SSG",
  dt_prev_result_ssg AS "DT_PREV_RESULT_SSG",
  result_ssg AS "RESULT_SSG",
  dt_result_ssg AS "DT_RESULT_SSG",
  fatur_tipo AS "FATUR_TIPO",
  fatur_ssg AS "FATUR_SSG",
  dt_fatur_ssg AS "DT_FATUR_SSG",
  rep AS "REP",
  coord AS "COORD",
  os_neogen AS "OS_NEOGEN",
  prod_neogen AS "PROD_NEOGEN",
  n_amostras_neogen AS "N_AMOSTRAS_NEOGEN",
  dt_cra AS "DT_CRA",
  plan_neogen AS "PLAN_NEOGEN",
  dt_plan_neogen AS "DT_PLAN_NEOGEN",
  n_vri AS "N_VRI",
  dt_vri AS "DT_VRI",
  n_lpr AS "N_LPR",
  dt_lpr AS "DT_LPR",
  n_lr AS "N_LR",
  dt_lr AS "DT_LR",
  lr_rastreio AS "LR_RASTREIO",
  nf_neogem AS "NF_NEOGEM",
  nf_na_neogen AS "NF_NA_NEOGEN",
  created_at,
  updated_at
FROM public.orders;

-- 12. Função RPC my_profile (compatível com código existente)
CREATE OR REPLACE FUNCTION public.my_profile()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  coord TEXT,
  rep TEXT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.email,
    ur.role::TEXT,
    ur.coord,
    ur.rep
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;