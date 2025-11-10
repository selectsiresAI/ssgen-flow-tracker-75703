-- Add coordinator mapping to representantes and tighten RLS visibility
ALTER TABLE public.representantes
  ADD COLUMN IF NOT EXISTS coordenador_nome TEXT;

ALTER TABLE public.representantes
  ADD CONSTRAINT representantes_coordenador_nome_fkey
    FOREIGN KEY (coordenador_nome)
    REFERENCES public.coordenadores(nome)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS representantes_coordenador_nome_idx
  ON public.representantes(coordenador_nome);

-- Backfill coordinator information for existing representantes using clients data
WITH rep_coord AS (
  SELECT rc.representante, c.nome AS coordenador
  FROM (
    SELECT representante, MAX(coordenador) AS coordenador
    FROM public.clients
    WHERE representante IS NOT NULL AND coordenador IS NOT NULL
    GROUP BY representante
  ) rc
  JOIN public.coordenadores c ON c.nome = rc.coordenador
)
UPDATE public.representantes r
SET coordenador_nome = rc.coordenador
FROM rep_coord rc
WHERE r.nome = rc.representante
  AND (r.coordenador_nome IS NULL OR r.coordenador_nome = '');

-- Ensure user role assignments for representantes also carry their coordinator mapping
WITH rep_roles AS (
  SELECT ur.id, r.coordenador_nome
  FROM public.user_roles ur
  JOIN public.representantes r ON r.nome = ur.rep
  WHERE ur.role = 'REPRESENTANTE'::app_role
    AND (ur.coord IS NULL OR ur.coord = '')
    AND r.coordenador_nome IS NOT NULL
)
UPDATE public.user_roles ur
SET coord = rr.coordenador_nome
FROM rep_roles rr
WHERE ur.id = rr.id;

-- Update RLS so coordenadores only see their own record and assigned representantes
DROP POLICY IF EXISTS "COORDENADOR can view coordenadores" ON public.coordenadores;
CREATE POLICY "COORDENADOR can view own coordenador"
  ON public.coordenadores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'COORDENADOR'::app_role
        AND ur.coord = public.coordenadores.nome
    )
  );

DROP POLICY IF EXISTS "COORDENADOR can view representantes" ON public.representantes;
CREATE POLICY "COORDENADOR can view own representantes"
  ON public.representantes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'COORDENADOR'::app_role
        AND ur.coord = public.representantes.coordenador_nome
    )
  );

DROP POLICY IF EXISTS "REPRESENTANTE can view representantes" ON public.representantes;
CREATE POLICY "REPRESENTANTE can view own representante"
  ON public.representantes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'REPRESENTANTE'::app_role
        AND ur.rep = public.representantes.nome
    )
  );
