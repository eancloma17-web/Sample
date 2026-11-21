-- ============================================================================
-- BUTUAN CITY CPMD TSAD SUPPLIER INFORMATION SYSTEM
-- Migration: 20261018000001_initial_schema.sql
-- Description: Core relational schema, Row Level Security, Storage, & Functions
-- Fully idempotent and error-resilient for Supabase SQL Editor execution
-- ============================================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked to auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'SUPPLIER' 
    CHECK (role IN ('SUPPLIER', 'TSAD_STAFF', 'CPMD_VERIFIER', 'CPMD_HEAD', 'ADMIN_STAFF', 'MIS_OFFICER')),
  company_name TEXT,
  supplier_id UUID,
  staff_title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ,
  password_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_supplier_id ON public.profiles(supplier_id);

-- Helper function to check role of current authenticated user (PL/PGSQL avoids recursion)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
  RETURN coalesce(v_role, 'ANONYMOUS');
END;
$$;

-- Helper to check if current user is staff/verifier/head/admin
CREATE OR REPLACE FUNCTION public.is_authorized_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND is_active = true 
      AND role IN ('TSAD_STAFF', 'CPMD_VERIFIER', 'CPMD_HEAD', 'ADMIN_STAFF', 'MIS_OFFICER')
  ) INTO v_exists;
  RETURN coalesce(v_exists, false);
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. SUPPLIER APPLICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supplier_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  
  -- General Information (Form CPMD.TSAD.F.003. REV00)
  business_name TEXT NOT NULL,
  proprietor_name TEXT NOT NULL,
  authorized_rep_name TEXT,
  rep_auth_type TEXT NOT NULL DEFAULT 'NONE' CHECK (rep_auth_type IN ('SPA', 'SECRETARY_CERTIFICATE', 'NONE')),
  principal_address TEXT NOT NULL,
  branch_address TEXT,
  no_branch_applies BOOLEAN NOT NULL DEFAULT false,
  contact_number TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  company_email TEXT NOT NULL,
  recorded_offerings TEXT[] NOT NULL DEFAULT '{}',
  
  -- Specific Document Requirements
  philgeps_type TEXT NOT NULL DEFAULT 'RED' CHECK (philgeps_type IN ('RED', 'PLATINUM', 'NONE')),
  philgeps_cert_number TEXT,
  exclusive_distributorship BOOLEAN NOT NULL DEFAULT false,
  exclusive_distributor_details TEXT,
  has_dti_sec_cert BOOLEAN NOT NULL DEFAULT false,
  dti_sec_number TEXT,
  has_pcab_license BOOLEAN NOT NULL DEFAULT false,
  pcab_license_number TEXT,
  pcab_category TEXT,
  has_tax_clearance BOOLEAN NOT NULL DEFAULT false,
  tax_clearance_validity TEXT,
  has_company_profile BOOLEAN NOT NULL DEFAULT false,
  has_mayors_permit BOOLEAN NOT NULL DEFAULT false,
  mayors_permit_number TEXT,
  has_dbp_account BOOLEAN NOT NULL DEFAULT false,
  dbp_account_number TEXT,
  has_foreign_reciprocity BOOLEAN NOT NULL DEFAULT false,
  foreign_reciprocity_details TEXT,
  other_documents_attached TEXT,
  
  -- Certification Statement
  certified_true_and_correct BOOLEAN NOT NULL DEFAULT false,
  signatory_printed_name TEXT,
  submission_date DATE,
  
  -- CPMD Review Information
  received_date DATE,
  verified_by TEXT,
  verified_by_id UUID REFERENCES public.profiles(id),
  verified_date DATE,
  verification_notes TEXT,
  approved_by TEXT,
  approved_by_id UUID REFERENCES public.profiles(id),
  approved_date DATE,
  approval_remarks TEXT,
  
  -- Status and Version
  status TEXT NOT NULL DEFAULT 'DRAFT' 
    CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_VERIFICATION', 'VERIFIED', 'APPROVED_MASTERLIST', 'REVISION_REQUESTED')),
  version INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_app_owner ON public.supplier_applications(owner_id);
CREATE INDEX IF NOT EXISTS idx_supplier_app_status ON public.supplier_applications(status);
CREATE INDEX IF NOT EXISTS idx_supplier_app_ref ON public.supplier_applications(reference_code);
CREATE INDEX IF NOT EXISTS idx_supplier_app_business ON public.supplier_applications(business_name);

-- ----------------------------------------------------------------------------
-- 3. SUPPLIER DOCUMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supplier_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.supplier_applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'BOTH' CHECK (source IN ('LETTER', 'SI_SHEET', 'BOTH')),
  required BOOLEAN NOT NULL DEFAULT true,
  category TEXT NOT NULL DEFAULT 'ALL' CHECK (category IN ('ALL', 'INFRASTRUCTURE', 'OPTIONAL', 'FOREIGN')),
  attached BOOLEAN NOT NULL DEFAULT false,
  storage_path TEXT,
  file_name TEXT,
  file_size TEXT,
  file_bytes BIGINT,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ,
  reference_number TEXT,
  expiry_date DATE,
  is_certified_true_copy BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  rejection_reason TEXT,
  page_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_docs_supplier ON public.supplier_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_docs_status ON public.supplier_documents(status);
CREATE INDEX IF NOT EXISTS idx_supplier_docs_storage ON public.supplier_documents(storage_path);

-- ----------------------------------------------------------------------------
-- 4. SUBMISSION COMMENTS TABLE (Two-way communications thread)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.submission_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.supplier_applications(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('SUPPLIER', 'TSAD_STAFF', 'CPMD_VERIFIER', 'CPMD_HEAD', 'DEPT_HEAD', 'ADMIN_STAFF', 'MIS_OFFICER')),
  author_email TEXT NOT NULL,
  message TEXT NOT NULL,
  related_document_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_supplier ON public.submission_comments(supplier_id);

-- ----------------------------------------------------------------------------
-- 5. DECISION RECORDS TABLE (Traceable decision log)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.decision_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.supplier_applications(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  performed_by_id UUID REFERENCES public.profiles(id),
  role TEXT NOT NULL,
  notes TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decisions_supplier ON public.decision_records(supplier_id);

-- ----------------------------------------------------------------------------
-- 6. AUDIT EVENTS TABLE (Immutable system and administrative audit log)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  actor_name TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('AUTH', 'VERIFICATION', 'APPROVAL', 'MIS', 'SYSTEM')),
  target TEXT NOT NULL,
  ip TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_category ON public.audit_events(category);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_events(timestamp DESC);

-- ----------------------------------------------------------------------------
-- 7. ACCESS ASSISTANCE TICKETS (Role 4 MIS support queue)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_assistance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code TEXT UNIQUE NOT NULL,
  requester_email TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  role TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DISPATCHED' CHECK (status IN ('DISPATCHED', 'RESOLVED')),
  notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 8. SYSTEM SETTINGS TABLE (Role 4 Non-security operational settings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 9. REFERENCE STANDARDS TABLE (Form CPMD.TSAD.F.003 baseline lists)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reference_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('CLASSIFICATION', 'MANDATORY_DOCUMENT')),
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reference_standards_type_code ON public.reference_standards(type, code);

-- ----------------------------------------------------------------------------
-- 10. AUTH TRIGGER: Automatically provision profiles upon user registration
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    company_name,
    is_active,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'SUPPLIER',
    NEW.raw_user_meta_data->>'company_name',
    true,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Safe registration of auth.users triggers (wrapped in exception block with dynamic execution)
DO $$
BEGIN
  BEGIN
    EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users';
    EXECUTE 'CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Trigger on auth.users handled: %', SQLERRM;
  END;
END $$;

-- Trigger function to prevent self-elevation of role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_elevation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_authorized_staff() THEN
      RAISE EXCEPTION 'Self-role elevation is prohibited.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_elevation ON public.profiles;
CREATE TRIGGER trg_prevent_role_elevation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_elevation();

-- ----------------------------------------------------------------------------
-- 11. STORAGE BUCKET CREATION (Safe, dynamic, and idempotent)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    EXECUTE 'INSERT INTO storage.buckets (id, name, public) VALUES (''supplier-documents-private'', ''supplier-documents-private'', false) ON CONFLICT (id) DO UPDATE SET public = false';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Storage bucket initialization notice: %', SQLERRM;
  END;
END $$;

-- ----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_assistance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_standards ENABLE ROW LEVEL SECURITY;

-- 12.1 PROFILES POLICIES (No circular queries, clean RLS)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authorized staff can read all profiles" ON public.profiles;
CREATE POLICY "Authorized staff can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_authorized_staff());

DROP POLICY IF EXISTS "Users can update own basic profile" ON public.profiles;
CREATE POLICY "Users can update own basic profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admin staff can manage profiles" ON public.profiles;
CREATE POLICY "Admin staff can manage profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('ADMIN_STAFF', 'MIS_OFFICER'));

-- 12.2 SUPPLIER APPLICATIONS POLICIES
DROP POLICY IF EXISTS "Suppliers can view own application" ON public.supplier_applications;
CREATE POLICY "Suppliers can view own application"
  ON public.supplier_applications FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authorized staff can view all applications" ON public.supplier_applications;
CREATE POLICY "Authorized staff can view all applications"
  ON public.supplier_applications FOR SELECT
  TO authenticated
  USING (public.is_authorized_staff());

DROP POLICY IF EXISTS "Suppliers can create their own application" ON public.supplier_applications;
CREATE POLICY "Suppliers can create their own application"
  ON public.supplier_applications FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    status = 'DRAFT'
  );

DROP POLICY IF EXISTS "Suppliers can update own editable application" ON public.supplier_applications;
CREATE POLICY "Suppliers can update own editable application"
  ON public.supplier_applications FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() AND 
    status IN ('DRAFT', 'REVISION_REQUESTED')
  )
  WITH CHECK (
    owner_id = auth.uid() AND
    status IN ('DRAFT', 'REVISION_REQUESTED')
  );

DROP POLICY IF EXISTS "Authorized staff can update application status" ON public.supplier_applications;
CREATE POLICY "Authorized staff can update application status"
  ON public.supplier_applications FOR UPDATE
  TO authenticated
  USING (public.is_authorized_staff());

-- 12.3 SUPPLIER DOCUMENTS POLICIES
DROP POLICY IF EXISTS "Suppliers can view own documents" ON public.supplier_documents;
CREATE POLICY "Suppliers can view own documents"
  ON public.supplier_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.supplier_applications app
      WHERE app.id = supplier_documents.supplier_id AND app.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authorized staff can view all documents" ON public.supplier_documents;
CREATE POLICY "Authorized staff can view all documents"
  ON public.supplier_documents FOR SELECT
  TO authenticated
  USING (public.is_authorized_staff());

DROP POLICY IF EXISTS "Suppliers can insert documents for own editable application" ON public.supplier_documents;
CREATE POLICY "Suppliers can insert documents for own editable application"
  ON public.supplier_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.supplier_applications app
      WHERE app.id = supplier_documents.supplier_id 
        AND app.owner_id = auth.uid()
        AND app.status IN ('DRAFT', 'REVISION_REQUESTED')
    )
  );

DROP POLICY IF EXISTS "Suppliers can update documents for own editable application" ON public.supplier_documents;
CREATE POLICY "Suppliers can update documents for own editable application"
  ON public.supplier_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.supplier_applications app
      WHERE app.id = supplier_documents.supplier_id 
        AND app.owner_id = auth.uid()
        AND app.status IN ('DRAFT', 'REVISION_REQUESTED')
    )
  );

DROP POLICY IF EXISTS "Suppliers can delete documents for own editable application" ON public.supplier_documents;
CREATE POLICY "Suppliers can delete documents for own editable application"
  ON public.supplier_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.supplier_applications app
      WHERE app.id = supplier_documents.supplier_id 
        AND app.owner_id = auth.uid()
        AND app.status IN ('DRAFT', 'REVISION_REQUESTED')
    )
  );

DROP POLICY IF EXISTS "Staff can update document verification status" ON public.supplier_documents;
CREATE POLICY "Staff can update document verification status"
  ON public.supplier_documents FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('TSAD_STAFF', 'CPMD_VERIFIER', 'CPMD_HEAD'));

-- 12.4 SUBMISSION COMMENTS POLICIES
DROP POLICY IF EXISTS "Suppliers can view comments on own application" ON public.submission_comments;
CREATE POLICY "Suppliers can view comments on own application"
  ON public.submission_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.supplier_applications app
      WHERE app.id = submission_comments.supplier_id AND app.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can view all comments" ON public.submission_comments;
CREATE POLICY "Staff can view all comments"
  ON public.submission_comments FOR SELECT
  TO authenticated
  USING (public.is_authorized_staff());

DROP POLICY IF EXISTS "Authorized users can post comments" ON public.submission_comments;
CREATE POLICY "Authorized users can post comments"
  ON public.submission_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    (
      public.is_authorized_staff() OR
      EXISTS (
        SELECT 1 FROM public.supplier_applications app
        WHERE app.id = submission_comments.supplier_id AND app.owner_id = auth.uid()
      )
    )
  );

-- 12.5 DECISION RECORDS POLICIES
DROP POLICY IF EXISTS "Suppliers can view decisions on own application" ON public.decision_records;
CREATE POLICY "Suppliers can view decisions on own application"
  ON public.decision_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.supplier_applications app
      WHERE app.id = decision_records.supplier_id AND app.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can view all decisions" ON public.decision_records;
CREATE POLICY "Staff can view all decisions"
  ON public.decision_records FOR SELECT
  TO authenticated
  USING (public.is_authorized_staff());

DROP POLICY IF EXISTS "Staff can insert decision records" ON public.decision_records;
CREATE POLICY "Staff can insert decision records"
  ON public.decision_records FOR INSERT
  TO authenticated
  WITH CHECK (public.is_authorized_staff());

-- 12.6 AUDIT EVENTS POLICIES
DROP POLICY IF EXISTS "Admin and staff can view audit records" ON public.audit_events;
CREATE POLICY "Admin and staff can view audit records"
  ON public.audit_events FOR SELECT
  TO authenticated
  USING (public.is_authorized_staff());

DROP POLICY IF EXISTS "System can record audit events" ON public.audit_events;
CREATE POLICY "System can record audit events"
  ON public.audit_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 12.7 ACCESS ASSISTANCE TICKETS POLICIES
DROP POLICY IF EXISTS "Admin staff can manage tickets" ON public.access_assistance_tickets;
CREATE POLICY "Admin staff can manage tickets"
  ON public.access_assistance_tickets FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('ADMIN_STAFF', 'MIS_OFFICER'));

DROP POLICY IF EXISTS "Users can create support tickets" ON public.access_assistance_tickets;
CREATE POLICY "Users can create support tickets"
  ON public.access_assistance_tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 12.8 SYSTEM SETTINGS POLICIES
DROP POLICY IF EXISTS "Everyone can read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Everyone authenticated can read system settings" ON public.system_settings;
CREATE POLICY "Everyone can read system settings"
  ON public.system_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin staff can update system settings" ON public.system_settings;
CREATE POLICY "Admin staff can update system settings"
  ON public.system_settings FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('ADMIN_STAFF', 'MIS_OFFICER'));

-- 12.9 REFERENCE STANDARDS POLICIES
DROP POLICY IF EXISTS "Everyone can read reference standards" ON public.reference_standards;
DROP POLICY IF EXISTS "Everyone authenticated can read reference standards" ON public.reference_standards;
CREATE POLICY "Everyone can read reference standards"
  ON public.reference_standards FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin staff can manage reference standards" ON public.reference_standards;
CREATE POLICY "Admin staff can manage reference standards"
  ON public.reference_standards FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('ADMIN_STAFF', 'MIS_OFFICER'));

-- 12.10 STORAGE OBJECTS POLICIES (Safe dynamic execution block)
DO $$
BEGIN
  BEGIN
    EXECUTE $pol$
      DROP POLICY IF EXISTS "Authorized staff can read private documents" ON storage.objects;
      CREATE POLICY "Authorized staff can read private documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
          bucket_id = 'supplier-documents-private' AND
          public.is_authorized_staff()
        );

      DROP POLICY IF EXISTS "Suppliers can read own private documents" ON storage.objects;
      CREATE POLICY "Suppliers can read own private documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
          bucket_id = 'supplier-documents-private' AND
          EXISTS (
            SELECT 1 FROM public.supplier_documents doc
            JOIN public.supplier_applications app ON app.id = doc.supplier_id
            WHERE doc.storage_path = storage.objects.name AND app.owner_id = auth.uid()
          )
        );

      DROP POLICY IF EXISTS "Suppliers can upload documents into own application" ON storage.objects;
      CREATE POLICY "Suppliers can upload documents into own application"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'supplier-documents-private' AND
          (
            EXISTS (
              SELECT 1 FROM public.supplier_applications app
              WHERE app.id::text = split_part(storage.objects.name, '/', 1)
                AND app.owner_id = auth.uid()
                AND app.status IN ('DRAFT', 'REVISION_REQUESTED')
            )
          )
        );

      DROP POLICY IF EXISTS "Suppliers can delete own files during draft or revision" ON storage.objects;
      CREATE POLICY "Suppliers can delete own files during draft or revision"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'supplier-documents-private' AND
          EXISTS (
            SELECT 1 FROM public.supplier_applications app
            WHERE app.id::text = split_part(storage.objects.name, '/', 1)
              AND app.owner_id = auth.uid()
              AND app.status IN ('DRAFT', 'REVISION_REQUESTED')
          )
        );
    $pol$;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Storage policy migration failed: %', SQLERRM;
  END;
END $$;

-- ----------------------------------------------------------------------------
-- 13. TRANSACTIONAL FUNCTIONS & GUARDED TRANSITIONS
-- ----------------------------------------------------------------------------

-- 13.1 SUBMIT APPLICATION (Supplier only)
CREATE OR REPLACE FUNCTION public.submit_supplier_application(
  p_application_id UUID,
  p_signatory_name TEXT,
  p_expected_version INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app RECORD;
  v_missing_docs_count INTEGER;
  v_user_profile RECORD;
BEGIN
  SELECT * INTO v_user_profile FROM public.profiles WHERE id = auth.uid();
  IF v_user_profile IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Caller profile not found.';
  END IF;

  SELECT * INTO v_app FROM public.supplier_applications 
  WHERE id = p_application_id FOR UPDATE;

  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Application not found.';
  END IF;

  IF v_app.owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Permission Denied: You are not the owner of this application.';
  END IF;

  IF v_app.status NOT IN ('DRAFT', 'REVISION_REQUESTED') THEN
    RAISE EXCEPTION 'Cannot submit: Application is currently in % status.', v_app.status;
  END IF;

  IF v_app.version != p_expected_version THEN
    RAISE EXCEPTION 'Concurrency Conflict: This record was modified by another session. Please refresh.';
  END IF;

  IF coalesce(trim(v_app.business_name), '') = '' OR
     coalesce(trim(v_app.proprietor_name), '') = '' OR
     coalesce(trim(v_app.principal_address), '') = '' OR
     coalesce(trim(v_app.contact_number), '') = '' OR
     coalesce(trim(v_app.company_email), '') = '' THEN
    RAISE EXCEPTION 'Mandatory Information Incomplete: Please ensure all required SI Sheet fields are filled.';
  END IF;

  SELECT count(*) INTO v_missing_docs_count
  FROM public.supplier_documents
  WHERE supplier_id = p_application_id AND required = true AND attached = false;

  IF v_missing_docs_count > 0 THEN
    RAISE EXCEPTION 'Missing Documents: % mandatory document(s) must be attached before submission.', v_missing_docs_count;
  END IF;

  UPDATE public.supplier_applications
  SET 
    status = 'SUBMITTED',
    certified_true_and_correct = true,
    signatory_printed_name = p_signatory_name,
    submission_date = CURRENT_DATE,
    version = v_app.version + 1,
    updated_at = now()
  WHERE id = p_application_id;

  INSERT INTO public.decision_records (
    supplier_id, action, performed_by, performed_by_id, role, notes, timestamp
  ) VALUES (
    p_application_id,
    'Official Application Submission',
    p_signatory_name,
    auth.uid(),
    'SUPPLIER',
    'Application and certified true copies formally submitted to CPMD TSAD for QMS verification.',
    now()
  );

  INSERT INTO public.audit_events (
    actor_id, actor_name, role, action, category, target, metadata, timestamp
  ) VALUES (
    auth.uid(), v_user_profile.full_name, v_user_profile.role,
    'SUBMIT_APPLICATION', 'VERIFICATION', v_app.reference_code,
    jsonb_build_object('application_id', p_application_id, 'version', v_app.version + 1),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'status', 'SUBMITTED',
    'version', v_app.version + 1,
    'reference_code', v_app.reference_code
  );
END;
$$;

-- 13.2 MARK UNDER VERIFICATION (TSAD Staff only)
CREATE OR REPLACE FUNCTION public.mark_under_verification(
  p_application_id UUID,
  p_received_date DATE,
  p_expected_version INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app RECORD;
  v_user_profile RECORD;
BEGIN
  SELECT * INTO v_user_profile FROM public.profiles WHERE id = auth.uid();
  IF v_user_profile IS NULL OR v_user_profile.role NOT IN ('TSAD_STAFF', 'CPMD_VERIFIER', 'CPMD_HEAD') THEN
    RAISE EXCEPTION 'Unauthorized: Only TSAD Staff or Verifiers can initiate verification.';
  END IF;

  SELECT * INTO v_app FROM public.supplier_applications 
  WHERE id = p_application_id FOR UPDATE;

  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Application not found.';
  END IF;

  IF v_app.version != p_expected_version THEN
    RAISE EXCEPTION 'Concurrency Conflict: Record was modified. Please reload.';
  END IF;

  UPDATE public.supplier_applications
  SET 
    status = 'UNDER_VERIFICATION',
    received_date = coalesce(p_received_date, CURRENT_DATE),
    version = v_app.version + 1,
    updated_at = now()
  WHERE id = p_application_id;

  INSERT INTO public.decision_records (
    supplier_id, action, performed_by, performed_by_id, role, notes, timestamp
  ) VALUES (
    p_application_id,
    'Docket Receipt & Initial Verification Intake',
    v_user_profile.full_name,
    auth.uid(),
    v_user_profile.role,
    'Application docket marked received and assigned for ISO 9001:2015 documentary evaluation.',
    now()
  );

  INSERT INTO public.audit_events (
    actor_id, actor_name, role, action, category, target, metadata, timestamp
  ) VALUES (
    auth.uid(), v_user_profile.full_name, v_user_profile.role,
    'START_VERIFICATION', 'VERIFICATION', v_app.reference_code,
    jsonb_build_object('application_id', p_application_id), now()
  );

  RETURN jsonb_build_object('success', true, 'status', 'UNDER_VERIFICATION', 'version', v_app.version + 1);
END;
$$;

-- 13.3 VERIFY APPLICATION (TSAD Staff only, marks VERIFIED)
CREATE OR REPLACE FUNCTION public.verify_supplier_application(
  p_application_id UUID,
  p_verification_notes TEXT,
  p_expected_version INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app RECORD;
  v_user_profile RECORD;
  v_unverified_docs INTEGER;
BEGIN
  SELECT * INTO v_user_profile FROM public.profiles WHERE id = auth.uid();
  IF v_user_profile IS NULL OR v_user_profile.role NOT IN ('TSAD_STAFF', 'CPMD_VERIFIER') THEN
    RAISE EXCEPTION 'Unauthorized: Only TSAD Evaluation Staff can verify applications.';
  END IF;

  SELECT * INTO v_app FROM public.supplier_applications 
  WHERE id = p_application_id FOR UPDATE;

  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Application not found.';
  END IF;

  IF v_app.version != p_expected_version THEN
    RAISE EXCEPTION 'Concurrency Conflict: Record was modified. Please reload.';
  END IF;

  SELECT count(*) INTO v_unverified_docs
  FROM public.supplier_documents
  WHERE supplier_id = p_application_id AND required = true AND status != 'VERIFIED';

  IF v_unverified_docs > 0 THEN
    RAISE EXCEPTION 'Cannot verify: % mandatory document(s) have not been marked VERIFIED.', v_unverified_docs;
  END IF;

  UPDATE public.supplier_applications
  SET 
    status = 'VERIFIED',
    verified_by = v_user_profile.full_name,
    verified_by_id = auth.uid(),
    verified_date = CURRENT_DATE,
    verification_notes = p_verification_notes,
    version = v_app.version + 1,
    updated_at = now()
  WHERE id = p_application_id;

  INSERT INTO public.decision_records (
    supplier_id, action, performed_by, performed_by_id, role, notes, timestamp
  ) VALUES (
    p_application_id,
    'Technical & Documentary Verification Endorsement',
    v_user_profile.full_name,
    auth.uid(),
    v_user_profile.role,
    p_verification_notes,
    now()
  );

  INSERT INTO public.audit_events (
    actor_id, actor_name, role, action, category, target, metadata, timestamp
  ) VALUES (
    auth.uid(), v_user_profile.full_name, v_user_profile.role,
    'VERIFY_APPLICATION', 'VERIFICATION', v_app.reference_code,
    jsonb_build_object('application_id', p_application_id), now()
  );

  RETURN jsonb_build_object('success', true, 'status', 'VERIFIED', 'version', v_app.version + 1);
END;
$$;

-- 13.4 REQUEST REVISION (TSAD Staff or CPMD Head)
CREATE OR REPLACE FUNCTION public.request_application_revision(
  p_application_id UUID,
  p_remarks TEXT,
  p_expected_version INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app RECORD;
  v_user_profile RECORD;
BEGIN
  SELECT * INTO v_user_profile FROM public.profiles WHERE id = auth.uid();
  IF v_user_profile IS NULL OR v_user_profile.role NOT IN ('TSAD_STAFF', 'CPMD_VERIFIER', 'CPMD_HEAD') THEN
    RAISE EXCEPTION 'Unauthorized: Only TSAD Staff or CPMD Head can return an application for revision.';
  END IF;

  IF coalesce(trim(p_remarks), '') = '' THEN
    RAISE EXCEPTION 'Revision Directives Required: You must specify findings or reasons for revision.';
  END IF;

  SELECT * INTO v_app FROM public.supplier_applications 
  WHERE id = p_application_id FOR UPDATE;

  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Application not found.';
  END IF;

  IF v_app.version != p_expected_version THEN
    RAISE EXCEPTION 'Concurrency Conflict: Record was modified. Please reload.';
  END IF;

  UPDATE public.supplier_applications
  SET 
    status = 'REVISION_REQUESTED',
    approval_remarks = p_remarks,
    version = v_app.version + 1,
    updated_at = now()
  WHERE id = p_application_id;

  INSERT INTO public.decision_records (
    supplier_id, action, performed_by, performed_by_id, role, notes, timestamp
  ) VALUES (
    p_application_id,
    'Returned for Documentary Revision',
    v_user_profile.full_name,
    auth.uid(),
    v_user_profile.role,
    p_remarks,
    now()
  );

  INSERT INTO public.submission_comments (
    supplier_id, author_id, author_name, author_role, author_email, message, created_at
  ) VALUES (
    p_application_id,
    auth.uid(),
    v_user_profile.full_name,
    v_user_profile.role,
    v_user_profile.email,
    'OFFICIAL REVISION NOTICE: ' || p_remarks,
    now()
  );

  INSERT INTO public.audit_events (
    actor_id, actor_name, role, action, category, target, metadata, timestamp
  ) VALUES (
    auth.uid(), v_user_profile.full_name, v_user_profile.role,
    'REQUEST_REVISION', 'VERIFICATION', v_app.reference_code,
    jsonb_build_object('remarks', p_remarks), now()
  );

  RETURN jsonb_build_object('success', true, 'status', 'REVISION_REQUESTED', 'version', v_app.version + 1);
END;
$$;

-- 13.5 APPROVE TO MASTERLIST (CPMD Head ONLY)
CREATE OR REPLACE FUNCTION public.approve_supplier_masterlist(
  p_application_id UUID,
  p_approval_remarks TEXT,
  p_expected_version INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app RECORD;
  v_user_profile RECORD;
BEGIN
  SELECT * INTO v_user_profile FROM public.profiles WHERE id = auth.uid();
  IF v_user_profile IS NULL OR v_user_profile.role != 'CPMD_HEAD' THEN
    RAISE EXCEPTION 'Permission Denied: Only the Acting Department Head (CPMD_HEAD) has legal authority to approve suppliers into the Master List.';
  END IF;

  SELECT * INTO v_app FROM public.supplier_applications 
  WHERE id = p_application_id FOR UPDATE;

  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Application not found.';
  END IF;

  IF v_app.status != 'VERIFIED' THEN
    RAISE EXCEPTION 'Cannot Approve: Application must be in VERIFIED status before final executive approval. Current status: %', v_app.status;
  END IF;

  IF v_app.version != p_expected_version THEN
    RAISE EXCEPTION 'Concurrency Conflict: Record was modified. Please reload.';
  END IF;

  UPDATE public.supplier_applications
  SET 
    status = 'APPROVED_MASTERLIST',
    approved_by = v_user_profile.full_name,
    approved_by_id = auth.uid(),
    approved_date = CURRENT_DATE,
    approval_remarks = p_approval_remarks,
    version = v_app.version + 1,
    updated_at = now()
  WHERE id = p_application_id;

  INSERT INTO public.decision_records (
    supplier_id, action, performed_by, performed_by_id, role, notes, timestamp
  ) VALUES (
    p_application_id,
    'Final Executive Approval & Master List Registration',
    v_user_profile.full_name,
    auth.uid(),
    'CPMD_HEAD',
    coalesce(p_approval_remarks, 'Accreditation approved for inclusion in the official Master List of accredited suppliers of the City Government of Butuan.'),
    now()
  );

  INSERT INTO public.audit_events (
    actor_id, actor_name, role, action, category, target, metadata, timestamp
  ) VALUES (
    auth.uid(), v_user_profile.full_name, 'CPMD_HEAD',
    'APPROVE_MASTERLIST', 'APPROVAL', v_app.reference_code,
    jsonb_build_object('application_id', p_application_id), now()
  );

  RETURN jsonb_build_object('success', true, 'status', 'APPROVED_MASTERLIST', 'version', v_app.version + 1);
END;
$$;

-- 13.6 VERIFY OR REJECT DOCUMENT (TSAD Staff or CPMD Head)
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
  SELECT * INTO v_user_profile FROM public.profiles WHERE id = auth.uid();
  IF v_user_profile IS NULL OR v_user_profile.role NOT IN ('TSAD_STAFF', 'CPMD_VERIFIER', 'CPMD_HEAD') THEN
    RAISE EXCEPTION 'Unauthorized: Only TSAD Staff or Head can review individual documents.';
  END IF;

  IF p_status NOT IN ('VERIFIED', 'REJECTED', 'PENDING') THEN
    RAISE EXCEPTION 'Invalid status. Permitted values: VERIFIED, REJECTED, PENDING.';
  END IF;

  SELECT * INTO v_doc FROM public.supplier_documents WHERE id = p_document_id FOR UPDATE;
  IF v_doc IS NULL THEN
    RAISE EXCEPTION 'Document not found.';
  END IF;

  SELECT * INTO v_app FROM public.supplier_applications WHERE id = v_doc.supplier_id;

  UPDATE public.supplier_documents
  SET 
    status = p_status,
    rejection_reason = CASE WHEN p_status = 'REJECTED' THEN p_rejection_reason ELSE NULL END,
    updated_at = now()
  WHERE id = p_document_id;

  INSERT INTO public.audit_events (
    actor_id, actor_name, role, action, category, target, metadata, timestamp
  ) VALUES (
    auth.uid(), v_user_profile.full_name, v_user_profile.role,
    'DOCUMENT_' || p_status, 'VERIFICATION', v_doc.name,
    jsonb_build_object('document_id', p_document_id, 'supplier_ref', v_app.reference_code), now()
  );

  RETURN jsonb_build_object('success', true, 'document_id', p_document_id, 'status', p_status);
END;
$$;

-- 13.7 LOG AUDIT EVENT
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_category TEXT,
  p_target TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_profile RECORD;
  v_event_id UUID;
BEGIN
  SELECT * INTO v_user_profile FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.audit_events (
    actor_id,
    actor_name,
    role,
    action,
    category,
    target,
    metadata,
    timestamp
  ) VALUES (
    auth.uid(),
    coalesce(v_user_profile.full_name, 'Authenticated User'),
    coalesce(v_user_profile.role, 'UNKNOWN'),
    p_action,
    p_category,
    p_target,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 14. SCHEMAS, TABLES & ROLES PERMISSION GRANTS
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
