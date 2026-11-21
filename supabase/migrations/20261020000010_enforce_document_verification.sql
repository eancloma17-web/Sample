-- Prevent application verification unless its mandatory
-- documentary requirements are complete and verified.
-- This supplements the existing verification RPC.

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_verified_document_requirements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_missing_count integer;
  v_required_count integer;
  v_missing_checklist_count integer;
BEGIN
  IF NEW.status = 'VERIFIED'
     AND OLD.status IS DISTINCT FROM 'VERIFIED' THEN

    -- Confirm that every applicable mandatory standard has
    -- a corresponding document record for this application.
    SELECT COUNT(*)
    INTO v_missing_checklist_count
    FROM public.reference_standards r
    WHERE r.type = 'MANDATORY_DOCUMENT'
      AND r.is_active = true
      AND COALESCE(
        (r.metadata->>'required')::boolean,
        false
      ) = true
      AND (
        r.metadata->>'category' = 'ALL'
        OR (
          r.metadata->>'category' = 'INFRASTRUCTURE'
          AND 'INFRASTRUCTURE PROJECTS' = ANY(NEW.categories)
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.supplier_documents d
        WHERE d.supplier_id = NEW.id
          AND d.name = r.title
          AND d.required = true
      );

    IF v_missing_checklist_count > 0 THEN
      RAISE EXCEPTION
        'Cannot verify application: % mandatory checklist item(s) are missing.',
        v_missing_checklist_count;
    END IF;

    SELECT COUNT(*)
    INTO v_required_count
    FROM public.supplier_documents
    WHERE supplier_id = NEW.id
      AND required = true;

    IF v_required_count = 0 THEN
      RAISE EXCEPTION
        'Cannot verify application: no mandatory document checklist exists.';
    END IF;

    SELECT COUNT(*)
    INTO v_missing_count
    FROM public.supplier_documents
    WHERE supplier_id = NEW.id
      AND required = true
      AND (
        status <> 'VERIFIED'
        OR attached IS DISTINCT FROM true
        OR storage_path IS NULL
      );

    IF v_missing_count > 0 THEN
      RAISE EXCEPTION
        'Cannot verify application: % mandatory document(s) are incomplete or unverified.',
        v_missing_count;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_verified_document_requirements
ON public.supplier_applications;

CREATE TRIGGER trg_enforce_verified_document_requirements
BEFORE UPDATE OF status
ON public.supplier_applications
FOR EACH ROW
EXECUTE FUNCTION public.enforce_verified_document_requirements();

COMMIT;
