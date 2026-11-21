-- Restrict supplier uploads and deletions to their own
-- existing document checklist entries.

BEGIN;

DROP POLICY IF EXISTS
"Suppliers can upload documents into own application"
ON storage.objects;

CREATE POLICY
"Suppliers can upload documents into own application"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'supplier-documents-private'
  AND EXISTS (
    SELECT 1
    FROM public.supplier_documents d
    JOIN public.supplier_applications a
      ON a.id = d.supplier_id
    WHERE a.owner_id = auth.uid()
      AND a.status IN ('DRAFT', 'REVISION_REQUESTED')
      AND a.id::text = split_part(name, '/', 1)
      AND d.id::text = split_part(name, '/', 2)
      AND split_part(name, '/', 3) <> ''
  )
);

DROP POLICY IF EXISTS
"Suppliers can delete own files during draft or revision"
ON storage.objects;

CREATE POLICY
"Suppliers can delete own files during draft or revision"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'supplier-documents-private'
  AND EXISTS (
    SELECT 1
    FROM public.supplier_documents d
    JOIN public.supplier_applications a
      ON a.id = d.supplier_id
    WHERE a.owner_id = auth.uid()
      AND a.status IN ('DRAFT', 'REVISION_REQUESTED')
      AND a.id::text = split_part(name, '/', 1)
      AND d.id::text = split_part(name, '/', 2)
  )
);

COMMIT;
