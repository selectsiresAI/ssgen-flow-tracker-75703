-- Tabela de Clientes
CREATE TABLE public.clients (
  -- Chave primária
  ordem_servico_ssgen NUMERIC PRIMARY KEY,
  
  -- Dados básicos
  data DATE NOT NULL,
  ordem_servico_neogen NUMERIC,
  nome TEXT NOT NULL,
  cpf_cnpj NUMERIC NOT NULL,
  ie_rg NUMERIC,
  codigo NUMERIC,
  status TEXT,
  representante TEXT NOT NULL,
  coordenador TEXT NOT NULL,
  id_conta_ssgen NUMERIC,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX idx_clients_representante ON public.clients(representante);
CREATE INDEX idx_clients_coordenador ON public.clients(coordenador);
CREATE INDEX idx_clients_ordem_neogen ON public.clients(ordem_servico_neogen);

-- Tabela de Ordens de Serviço
CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento com clientes
  ordem_servico_ssgen NUMERIC NOT NULL REFERENCES public.clients(ordem_servico_ssgen) ON DELETE CASCADE,
  ordem_servico_neogen NUMERIC,
  
  -- Dados básicos da ordem
  numero_nf_neogen NUMERIC,
  numero_teste_nota_neogen NUMERIC,
  nome_produto TEXT,
  
  -- CRA
  cra_data DATE,
  cra_status TEXT,
  
  -- Recebimento de planilha
  recebimento_data DATE,
  recebimento_status TEXT,
  
  -- Envio de Planilha
  envio_planilha_data DATE,
  envio_planilha_status TEXT,
  
  -- VRI
  vri_data DATE,
  vri_n_amostras NUMERIC,
  
  -- LPR
  lpr_data DATE,
  lpr_n_amostras NUMERIC,
  
  -- Liberação Resultados
  liberacao_data DATE,
  liberacao_n_amostras NUMERIC,
  
  -- Envio de Resultados
  envio_resultados_data DATE,
  envio_resultados_ordem_id NUMERIC,
  envio_resultados_previsao DATE,
  envio_resultados_status TEXT,
  envio_resultados_data_final DATE,
  envio_resultados_data_prova TEXT,
  envio_resultados_order_id NUMERIC,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_service_orders_ssgen ON public.service_orders(ordem_servico_ssgen);
CREATE INDEX idx_service_orders_neogen ON public.service_orders(ordem_servico_neogen);

-- Triggers para updated_at
CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS para clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ADM can manage all clients"
  ON public.clients FOR ALL
  USING (public.has_role(auth.uid(), 'ADM'::app_role));

CREATE POLICY "GERENTE can view their coord clients"
  ON public.clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'GERENTE'::app_role
        AND coord = clients.coordenador
    )
  );

CREATE POLICY "REPRESENTANTE can view their clients"
  ON public.clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'REPRESENTANTE'::app_role
        AND rep = clients.representante
    )
  );

CREATE POLICY "GERENTE can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('GERENTE'::app_role, 'ADM'::app_role)
    )
  );

CREATE POLICY "REPRESENTANTE can insert their clients"
  ON public.clients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'REPRESENTANTE'::app_role
        AND rep = clients.representante
    )
  );

CREATE POLICY "GERENTE can update their coord clients"
  ON public.clients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'GERENTE'::app_role
        AND coord = clients.coordenador
    )
  );

CREATE POLICY "REPRESENTANTE can update their clients"
  ON public.clients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'REPRESENTANTE'::app_role
        AND rep = clients.representante
    )
  );

-- RLS para service_orders
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ADM can manage all service_orders"
  ON public.service_orders FOR ALL
  USING (public.has_role(auth.uid(), 'ADM'::app_role));

CREATE POLICY "GERENTE can view their coord orders"
  ON public.service_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.user_roles ur ON ur.coord = c.coordenador
      WHERE c.ordem_servico_ssgen = service_orders.ordem_servico_ssgen
        AND ur.user_id = auth.uid()
        AND ur.role = 'GERENTE'::app_role
    )
  );

CREATE POLICY "REPRESENTANTE can view their orders"
  ON public.service_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.user_roles ur ON ur.rep = c.representante
      WHERE c.ordem_servico_ssgen = service_orders.ordem_servico_ssgen
        AND ur.user_id = auth.uid()
        AND ur.role = 'REPRESENTANTE'::app_role
    )
  );

CREATE POLICY "GERENTE can insert orders"
  ON public.service_orders FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'GERENTE'::app_role) OR
    public.has_role(auth.uid(), 'ADM'::app_role)
  );

CREATE POLICY "REPRESENTANTE can insert their orders"
  ON public.service_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.user_roles ur ON ur.rep = c.representante
      WHERE c.ordem_servico_ssgen = service_orders.ordem_servico_ssgen
        AND ur.user_id = auth.uid()
        AND ur.role = 'REPRESENTANTE'::app_role
    )
  );

CREATE POLICY "GERENTE can update their coord orders"
  ON public.service_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.user_roles ur ON ur.coord = c.coordenador
      WHERE c.ordem_servico_ssgen = service_orders.ordem_servico_ssgen
        AND ur.user_id = auth.uid()
        AND ur.role = 'GERENTE'::app_role
    )
  );

CREATE POLICY "REPRESENTANTE can update their orders"
  ON public.service_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.user_roles ur ON ur.rep = c.representante
      WHERE c.ordem_servico_ssgen = service_orders.ordem_servico_ssgen
        AND ur.user_id = auth.uid()
        AND ur.role = 'REPRESENTANTE'::app_role
    )
  );

-- View Unificada para a Tabela de Ordens
CREATE OR REPLACE VIEW public.vw_orders_unified AS
SELECT 
  -- Dados do cliente
  c.ordem_servico_ssgen,
  c.data as data_cadastro,
  c.ordem_servico_neogen,
  c.nome as cliente_nome,
  c.cpf_cnpj,
  c.ie_rg,
  c.codigo,
  c.status as cliente_status,
  c.representante,
  c.coordenador,
  c.id_conta_ssgen,
  
  -- Dados da ordem
  so.id as ordem_id,
  so.numero_nf_neogen,
  so.numero_teste_nota_neogen,
  so.nome_produto,
  
  -- CRA
  so.cra_data,
  so.cra_status,
  
  -- Recebimento
  so.recebimento_data,
  so.recebimento_status,
  
  -- Envio Planilha
  so.envio_planilha_data,
  so.envio_planilha_status,
  
  -- VRI
  so.vri_data,
  so.vri_n_amostras,
  
  -- LPR
  so.lpr_data,
  so.lpr_n_amostras,
  
  -- Liberação
  so.liberacao_data,
  so.liberacao_n_amostras,
  
  -- Envio Resultados
  so.envio_resultados_data,
  so.envio_resultados_ordem_id,
  so.envio_resultados_previsao,
  so.envio_resultados_status,
  so.envio_resultados_data_final,
  so.envio_resultados_data_prova,
  so.envio_resultados_order_id,
  
  -- Metadados
  c.created_at as client_created_at,
  so.created_at as order_created_at,
  GREATEST(COALESCE(c.updated_at, c.created_at), COALESCE(so.updated_at, so.created_at)) as updated_at
FROM public.clients c
LEFT JOIN public.service_orders so ON c.ordem_servico_ssgen = so.ordem_servico_ssgen;