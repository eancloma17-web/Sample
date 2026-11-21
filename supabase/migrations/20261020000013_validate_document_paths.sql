-- Validate supplier document paths and attachment metadata.
-- Do not change the existing database schema.

BEGIN;

CREATE OR REPLACE FUNCTION public.validate_supplier_document_path()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_app public.supplier_applications%ROWTYPE;
BEGIN
  IF NEW.storage_path IS NOT NULL THEN

    IF NEW.storage_path NOT LIKE
       NEW.supplier_id::text || '/' || NEW.id::text || '/%' THEN
      RAISE EXCEPTION
        'Document storage path does not match its application and document ID.';
    END IF;

    IF split_part(NEW.storage_path, '/', 3) = '' THEN
      RAISE EXCEPTION 'Document filename is missing from storage path.';
    END IF;

  END IF;

  IF NEW.attached = true
     AND NULLIF(BTRIM(COALESCE(NEW.storage_path, '')), '') IS NULL THEN
    RAISE EXCEPTION
      'An attached document must have a storage path.';
  END IF;

  IF NEW.storage_path IS DISTINCT FROM OLD.storage_path
     OR NEW.attached IS DISTINCT FROM OLD.attached THEN

    SELECT *
    INTO v_app
    FROM public.supplier_applications
    WHERE id = NEW.supplier_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Supplier application not found.';
    END IF;

    IF auth.uid() IS NOT NULL
       AND v_app.owner_id = auth.uid()
       AND v_app.status NOT IN ('DRAFT', 'REVISION_REQUESTED') THEN
      RAISE EXCEPTION
        'Documents cannot be modified after submission.';
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_supplier_document_path
ON public.supplier_documents;

CREATE TRIGGER trg_validate_supplier_document_path
BEFORE UPDATE OF storage_path, attached
ON public.supplier_documents
FOR EACH ROW
EXECUTE FUNCTION public.validate_supplier_document_path();

COMMIT;
