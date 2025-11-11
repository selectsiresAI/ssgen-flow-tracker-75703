-- ============================================================
-- Validação: GERENTE precisa de coord, REPRESENTANTE precisa de rep
-- ============================================================

-- Criar função de validação
CREATE OR REPLACE FUNCTION public.validate_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- GERENTE deve ter coord atribuído
  IF NEW.role = 'GERENTE' AND (NEW.coord IS NULL OR TRIM(NEW.coord) = '') THEN
    RAISE EXCEPTION 'GERENTE deve ter um coordenador atribuído';
  END IF;
  
  -- REPRESENTANTE deve ter rep atribuído
  IF NEW.role = 'REPRESENTANTE' AND (NEW.rep IS NULL OR TRIM(NEW.rep) = '') THEN
    RAISE EXCEPTION 'REPRESENTANTE deve ter um representante atribuído';
  END IF;
  
  -- ADM não precisa de coord/rep
  IF NEW.role = 'ADM' THEN
    NEW.coord := NULL;
    NEW.rep := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para INSERT e UPDATE
DROP TRIGGER IF EXISTS validate_user_role_trigger ON public.user_roles;
CREATE TRIGGER validate_user_role_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_role();