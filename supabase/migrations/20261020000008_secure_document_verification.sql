-- Migration 8: Secure document verification
-- Draft: Do not deploy until security review is complete.
BEGIN;
DROP POLICY IF EXISTS "Staff can update document verification status" ON public.supplier_documents;
CREATE OR REPLACE FUNCTION public.verify_or_reject_document(
  p_document_id UUID,
  p_status TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc RECORD;
  v_app RECORD;
  v_user_profile RECORD;
BEGIN
  SELECT * INTO v_user_profile
  FROM public.profiles
  WHERE id = auth.uid() AND is_active = true;

  IF NOT FOUND OR v_user_profile.role NOT IN
    ('TSAD_STAFF', 'CPMD_VERIFIER') THEN
    RAISE EXCEPTION 'Unauthorized document verification.';
  END IF;

  IF p_status NOT IN ('VERIFIED', 'REJECTED', 'PENDING') THEN
    RAISE EXCEPTION 'Invalid document verification status.';
  END IF;

  IF p_status = 'REJECTED' AND
     NULLIF(BTRIM(p_rejection_reason), '') IS NULL THEN
    RAISE EXCEPTION 'A rejection reason is required.';
  END IF;

  SELECT * INTO v_doc
  FROM public.supplier_documents
  WHERE id = p_document_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found.';
  END IF;

  IF p_status = 'VERIFIED'
     AND (
       v_doc.attached IS DISTINCT FROM true
       OR NULLIF(BTRIM(v_doc.storage_path), '') IS NULL
     ) THEN
    RAISE EXCEPTION
      'Cannot verify a document without an uploaded attachment.';
  END IF;

  SELECT * INTO v_app
  FROM public.supplier_applications
  WHERE id = v_doc.supplier_id;

  IF NOT FOUND OR v_app.status NOT IN
    ('SUBMITTED', 'UNDER_VERIFICATION') THEN
    RAISE EXCEPTION 'Application is not eligible for document verification.';
  END IF;

  UPDATE public.supplier_documents
  SET
    status = p_status,
    rejection_reason = CASE
      WHEN p_status = 'REJECTED'
      THEN BTRIM(p_rejection_reason)
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = p_document_id;

  INSERT INTO public.audit_events (
    actor_id, actor_name, role, action,
    category, target, metadata, timestamp
  ) VALUES (
    auth.uid(),
    v_user_profile.full_name,
    v_user_profile.role,
    'DOCUMENT_' || p_status,
    'VERIFICATION',
    v_doc.name,
    jsonb_build_object(
      'document_id', p_document_id,
      'supplier_ref', v_app.reference_code
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'document_id', p_document_id,
    'status', p_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_or_reject_document(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_or_reject_document(UUID, TEXT, TEXT) TO authenticated;




-- Prevent direct creation or deletion of official document records.
DROP POLICY IF EXISTS "Suppliers can insert documents for own editable application"
ON public.supplier_documents;

DROP POLICY IF EXISTS "Suppliers can delete documents for own editable application"
ON public.supplier_documents;

REVOKE INSERT, DELETE ON public.supplier_documents FROM authenticated;

-- Restrict direct document updates to supplier-editable fields.
REVOKE UPDATE ON public.supplier_documents FROM authenticated;

GRANT UPDATE (
  attached,
  storage_path,
  file_name,
  file_size,
  file_bytes,
  mime_type,
  uploaded_at,
  reference_number,
  expiry_date,
  is_certified_true_copy,
  updated_at
) ON public.supplier_documents TO authenticated;

COMMIT;
