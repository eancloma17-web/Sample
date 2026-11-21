-- TSAD audit remediation; stage and verify before production.
-- Prevent MIS from reading confidential supplier document rows and objects.
DROP POLICY IF EXISTS "Authorized staff can view all documents" ON public.supplier_documents;
CREATE POLICY "Verification staff and head can view documents"
ON public.supplier_documents FOR SELECT TO authenticated
USING (public.current_user_role() IN ('TSAD_STAFF','CPMD_VERIFIER','CPMD_HEAD'));
DROP POLICY IF EXISTS "Authorized staff can read private documents" ON storage.objects;
CREATE POLICY "Verification staff and head can read private documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'supplier-documents-private' AND public.current_user_role() IN ('TSAD_STAFF','CPMD_VERIFIER','CPMD_HEAD'));
-- Do not allow unauthenticated users to access application tables or functions.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
-- Existing tables retain required authenticated grants, guarded by RLS.
-- Remove default privilege escalation for future objects.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
-- Do not grant EXECUTE to all functions by default; review RPCs individually.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Atomic, idempotent supplier registration after Supabase email verification.
-- Uses trusted auth.uid() and metadata provided at sign-up; profile role cannot
-- be changed by the caller. No unapproved mandatory document checklist seeded.
CREATE OR REPLACE FUNCTION public.ensure_supplier_registration()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_user auth.users%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_application_id uuid;
  v_company text;
  v_name text;
  v_address text;
  v_contact text;
  v_categories text[];
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_user FROM auth.users WHERE id = v_uid;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND OR v_profile.role <> 'SUPPLIER' OR NOT v_profile.is_active THEN
    RAISE EXCEPTION 'Supplier account not authorized';
  END IF;
  IF v_user.email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Verify your email address before completing registration';
  END IF;
  SELECT id INTO v_application_id FROM public.supplier_applications WHERE owner_id = v_uid ORDER BY created_at LIMIT 1;
  IF v_application_id IS NULL THEN
    v_company := trim(coalesce(v_user.raw_user_meta_data->>'company_name',''));
    v_name := trim(coalesce(v_user.raw_user_meta_data->>'full_name',''));
    v_address := trim(coalesce(v_user.raw_user_meta_data->>'principal_address',''));
    v_contact := trim(coalesce(v_user.raw_user_meta_data->>'contact_number',''));
    IF v_company = '' OR v_name = '' OR v_address = '' OR v_contact = '' THEN
      RAISE EXCEPTION 'Registration information is incomplete; contact support';
    END IF;
    SELECT coalesce(array_agg(value), ARRAY[]::text[]) INTO v_categories
    FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(v_user.raw_user_meta_data->'categories') = 'array'
      THEN v_user.raw_user_meta_data->'categories' ELSE '[]'::jsonb END);
    INSERT INTO public.supplier_applications
      (reference_code, owner_id, categories, business_name, proprietor_name,
       authorized_rep_name, rep_auth_type, principal_address, contact_number,
       contact_person, company_email, status)
    VALUES
      ('CGB-TSAD-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
       v_uid, v_categories, v_company, v_name, v_name, 'NONE', v_address,
       v_contact, v_name, v_user.email, 'DRAFT')
    RETURNING id INTO v_application_id;
  END IF;
  UPDATE public.profiles SET supplier_id = v_application_id, company_name =
    (SELECT business_name FROM public.supplier_applications WHERE id = v_application_id), updated_at = now()
  WHERE id = v_uid;
  RETURN v_application_id;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_supplier_registration() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_supplier_registration() TO authenticated;
