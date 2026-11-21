-- TSAD Supplier Information System
-- Initialize approved document requirements for supplier applications.
-- This migration does not overwrite existing document records.

BEGIN;

CREATE OR REPLACE FUNCTION public.initialize_supplier_documents(
  p_application_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_application public.supplier_applications%ROWTYPE;
BEGIN
  SELECT *
  INTO v_application
  FROM public.supplier_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supplier application not found';
  END IF;

  IF auth.uid() IS NULL
     OR v_application.owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to initialize documents';
  END IF;

  INSERT INTO public.supplier_documents (
    supplier_id,
    name,
    source,
    required,
    category,
    status
  )
  SELECT
    v_application.id,
    r.title,
    r.metadata->>'source',
    COALESCE((r.metadata->>'required')::boolean, false),
    r.metadata->>'category',
    'PENDING'
  FROM public.reference_standards r
  WHERE r.type = 'MANDATORY_DOCUMENT'
    AND r.is_active = true
    AND (
      r.metadata->>'category' = 'ALL'
      OR (
        r.metadata->>'category' = 'INFRASTRUCTURE'
        AND 'INFRASTRUCTURE PROJECTS' = ANY(v_application.categories)
      )
      OR r.metadata->>'category' IN ('OPTIONAL', 'FOREIGN')
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.supplier_documents d
      WHERE d.supplier_id = v_application.id
        AND d.name = r.title
    );
END;
$$;

REVOKE ALL ON FUNCTION public.initialize_supplier_documents(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.initialize_supplier_documents(uuid)
TO authenticated;

COMMIT;
