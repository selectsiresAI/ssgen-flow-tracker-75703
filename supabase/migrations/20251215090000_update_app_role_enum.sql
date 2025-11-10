BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    IF EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = 'app_role'::regtype
        AND enumlabel = 'GERENTE'
    ) THEN
      ALTER TYPE app_role RENAME VALUE 'GERENTE' TO 'COORDENADOR';
    END IF;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'order_audit_log'
      AND column_name = 'user_role'
  ) THEN
    UPDATE public.order_audit_log
    SET user_role = 'COORDENADOR'
    WHERE user_role = 'GERENTE';
  END IF;
END
$$;

COMMIT;
