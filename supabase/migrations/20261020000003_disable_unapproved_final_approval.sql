-- Corrected authorization: Department Head has review and recommendation authority only.
-- Apply after the initial schema migration. Does not delete supplier records.
CREATE OR REPLACE FUNCTION public.approve_supplier_masterlist(
  p_application_id UUID,
  p_approval_remarks TEXT,
  p_expected_version INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Final approval is disabled: the authorized approving office has not been confirmed.';
END;
$$;
REVOKE ALL ON FUNCTION public.approve_supplier_masterlist(UUID,TEXT,INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_supplier_masterlist(UUID,TEXT,INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.approve_supplier_masterlist(UUID,TEXT,INTEGER) FROM authenticated;
