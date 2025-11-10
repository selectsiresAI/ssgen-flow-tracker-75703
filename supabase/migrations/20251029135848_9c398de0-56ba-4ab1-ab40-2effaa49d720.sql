-- Create tables for coordinators and representatives
CREATE TABLE public.coordenadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  email TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.representantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  email TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coordenadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representantes ENABLE ROW LEVEL SECURITY;

-- Create policies for coordenadores
CREATE POLICY "ADM can manage all coordenadores"
  ON public.coordenadores
  FOR ALL
  USING (has_role(auth.uid(), 'ADM'::app_role));

CREATE POLICY "COORDENADOR can view coordenadores"
  ON public.coordenadores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'COORDENADOR'::app_role
    )
  );

CREATE POLICY "REPRESENTANTE can view coordenadores"
  ON public.coordenadores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'REPRESENTANTE'::app_role
    )
  );

-- Create policies for representantes
CREATE POLICY "ADM can manage all representantes"
  ON public.representantes
  FOR ALL
  USING (has_role(auth.uid(), 'ADM'::app_role));

CREATE POLICY "COORDENADOR can view representantes"
  ON public.representantes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'COORDENADOR'::app_role
    )
  );

CREATE POLICY "REPRESENTANTE can view representantes"
  ON public.representantes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'REPRESENTANTE'::app_role
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_coordenadores_updated_at
  BEFORE UPDATE ON public.coordenadores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_representantes_updated_at
  BEFORE UPDATE ON public.representantes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();