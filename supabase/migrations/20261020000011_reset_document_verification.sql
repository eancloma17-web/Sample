-- Reset document verification when supplier attachment metadata changes.
-- Preserve staff-controlled verification decisions.

BEGIN;

CREATE OR REPLACE FUNCTION public.reset_document_verification_on_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (
    OLD.storage_path IS DISTINCT FROM NEW.storage_path
    OR OLD.attached IS DISTINCT FROM NEW.attached
    OR OLD.file_name IS DISTINCT FROM NEW.file_name
    OR OLD.file_bytes IS DISTINCT FROM NEW.file_bytes
  ) THEN
    NEW.status := 'PENDING';
    NEW.rejection_reason := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reset_document_verification_on_change
ON public.supplier_documents;

CREATE TRIGGER trg_reset_document_verification_on_change
BEFORE UPDATE OF storage_path, attached, file_name, file_bytes
ON public.supplier_documents
FOR EACH ROW
EXECUTE FUNCTION public.reset_document_verification_on_change();

COMMIT;
