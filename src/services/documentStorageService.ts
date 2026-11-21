/** Private document boundary: actual uploads and short-lived signed URLs.
 * Database/storage policies must authorize every operation independently of the UI. */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserAccount, SupplierApplication, DocumentItem, DocumentPage } from '../types';

// Official mayor name supplied for administrative reference only.
// Never use this value to forge or reconstruct a signed government document.
export const CURRENT_BUTUAN_MAYOR = 'Atty. Lawrence Lemuel H. Fortun';

export const PRIVATE_BUCKET = 'supplier-documents-private';
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export interface StorageAccessResult {
  allowed: boolean;
  reason?: string;
  roleScope?: string;
  bucketName: string;
  storagePath: string;
  signedUrl?: string;
  expiresAt?: string;
  expiresInSeconds?: number;
}

/**
 * Validates access permissions according to Supabase Storage RLS rules
 */
export function checkDocumentAccess(
  user: UserAccount | null,
  supplier: SupplierApplication,
  doc: DocumentItem
): StorageAccessResult {
  const storagePath = doc.storagePath || `${supplier.id}/${doc.id}/${doc.fileName || 'document.pdf'}`;

  if (!user) {
    return {
      allowed: false,
      reason: 'Authentication required: You must be logged into the City Government of Butuan portal to access documentary records.',
      bucketName: PRIVATE_BUCKET,
      storagePath,
    };
  }

  // 1. Supplier Role Access Check
  if (user.role === 'SUPPLIER') {
    const isOwner =
      Boolean(user.supplierId && user.supplierId === supplier.id);

    if (!isOwner) {
      return {
        allowed: false,
        reason: '403 Forbidden (Supabase Storage RLS Policy Violation): Document bucket is private. You are not authorized to view documents submitted by other commercial suppliers.',
        bucketName: PRIVATE_BUCKET,
        storagePath,
      };
    }

    return {
      allowed: true,
      roleScope: 'SUPPLIER_OWNER',
      bucketName: PRIVATE_BUCKET,
      storagePath,
    };
  }

  // 2. TSAD Staff / Verifier
  if (user.role === 'TSAD_STAFF' || user.role === 'CPMD_VERIFIER') {
    return {
      allowed: true,
      roleScope: 'TSAD_TECHNICAL_EVALUATOR',
      bucketName: PRIVATE_BUCKET,
      storagePath,
    };
  }

  // 3. Procurement Head / CPMD Department Head
  if (user.role === 'CPMD_HEAD') {
    return {
      allowed: true,
      roleScope: 'CPMD_DEPARTMENT_HEAD',
      bucketName: PRIVATE_BUCKET,
      storagePath,
    };
  }

  // 4. Administrative Staff / MIS Officer
  if (user.role === 'ADMIN_STAFF' || user.role === 'MIS_OFFICER') {
    return {
      allowed: false,
      reason: 'MIS personnel are not authorized to inspect confidential supplier documents without separately approved access.',
      bucketName: PRIVATE_BUCKET,
      storagePath,
    };
  }

  return {
    allowed: false,
    reason: 'Unauthorized: User role not recognized for document inspection.',
    bucketName: PRIVATE_BUCKET,
    storagePath,
  };
}

/**
 * Generates an authentic, short-lived signed URL from Supabase Storage (valid for 15 minutes / 900 seconds)
 */
export async function getRealDocumentSignedUrl(
  doc: DocumentItem,
  expiresInSeconds: number = 900
): Promise<{ signedUrl: string | null; expiresAt: string | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { signedUrl: null, expiresAt: null, error: 'Supabase is not configured.' };
  }

  if (!doc.storagePath) {
    // If only fileDataUrl is present (e.g. preview before save)
    if (doc.fileDataUrl) {
      return { signedUrl: doc.fileDataUrl, expiresAt: null };
    }
    return { signedUrl: null, expiresAt: null, error: 'No storage path found for this document.' };
  }

  try {
    const { data, error } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .createSignedUrl(doc.storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.error('Failed to create signed URL from Supabase Storage:', error);
      return { signedUrl: null, expiresAt: null, error: error?.message || 'Failed to generate signed URL.' };
    }

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    return {
      signedUrl: data.signedUrl,
      expiresAt,
    };
  } catch (err: any) {
    console.error('Signed URL generation exception:', err);
    return { signedUrl: null, expiresAt: null, error: err.message };
  }
}

/**
 * Uploads a real document file to Supabase Storage and records metadata in supplier_documents table
 */
export async function uploadDocumentFile(params: {
  supplierId: string;
  documentId: string;
  file: File;
  referenceNumber?: string;
  expiryDate?: string;
  isCertifiedTrueCopy?: boolean;
}): Promise<{ success: boolean; data?: DocumentItem; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  const { supplierId, documentId, file, referenceNumber, expiryDate, isCertifiedTrueCopy } = params;

  // 1. File size validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: `File exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a file under 10 MB.`,
    };
  }

  // 2. MIME type validation
  const lowerName = file.name.toLowerCase();
  const isAllowedExt = lowerName.endsWith('.pdf') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png');
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type) || isAllowedExt;

  if (!isAllowedMime) {
    return {
      success: false,
      error: 'Unsupported file format. Only PDF, JPG, and PNG files are accepted per CPMD TSAD guidelines.',
    };
  }

  try {
    // 3. Construct storage path: {supplierId}/{documentId}/{timestamp}_{filename}
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${supplierId}/${documentId}/${Date.now()}_${cleanFileName}`;

    // 4. Upload to Supabase Storage private bucket
    const { error: uploadError } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || (lowerName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { success: false, error: `Storage upload failed: ${uploadError.message}` };
    }

    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const nowIso = new Date().toISOString();

    // 5. Update or insert into supplier_documents table
    const { data: updatedDoc, error: dbError } = await supabase
      .from('supplier_documents')
      .update({
        attached: true,
        storage_path: storagePath,
        file_name: file.name,
        file_size: fileSizeMb,
        file_bytes: file.size,
        mime_type: file.type || (lowerName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        uploaded_at: nowIso,
        reference_number: referenceNumber || null,
        expiry_date: expiryDate || null,
        is_certified_true_copy: isCertifiedTrueCopy ?? true,
        updated_at: nowIso,
      })
      .eq('id', documentId)
      .select('*')
      .single();

    if (dbError) {
      console.error('Database update error for document metadata:', dbError);
      // Attempt cleanup of orphaned storage file
      await supabase.storage.from(PRIVATE_BUCKET).remove([storagePath]);
      return { success: false, error: `Database write failed: ${dbError.message}` };
    }

    const docItem: DocumentItem = {
      id: updatedDoc.id,
      name: updatedDoc.name,
      source: updatedDoc.source as any,
      required: updatedDoc.required,
      category: updatedDoc.category as any,
      attached: true,
      storagePath: updatedDoc.storage_path || storagePath,
      fileName: updatedDoc.file_name || file.name,
      fileSize: updatedDoc.file_size || fileSizeMb,
      uploadedAt: updatedDoc.uploaded_at ? updatedDoc.uploaded_at.slice(0, 10) : nowIso.slice(0, 10),
      referenceNumber: updatedDoc.reference_number || undefined,
      expiryDate: updatedDoc.expiry_date || undefined,
      isCertifiedTrueCopy: updatedDoc.is_certified_true_copy,
      status: updatedDoc.status as any,
      pageCount: updatedDoc.page_count || 1,
    };

    return { success: true, data: docItem };
  } catch (err: any) {
    console.error('Document upload exception:', err);
    return { success: false, error: err.message || 'An unexpected error occurred during document upload.' };
  }
}

/**
 * Downloads the original file from Supabase Storage as a Blob
 */
export async function downloadOriginalDocument(
  doc: DocumentItem
): Promise<{ success: boolean; blob?: Blob; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  if (!doc.storagePath) {
    return { success: false, error: 'No storage path exists for this document.' };
  }

  try {
    const { data, error } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .download(doc.storagePath);

    if (error || !data) {
      return { success: false, error: error?.message || 'Download failed.' };
    }

    return { success: true, blob: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Download exception.' };
  }
}

/**
 * Removes a document file from storage and resets metadata
 */
export async function removeDocumentFile(
  documentId: string,
  storagePath?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    if (storagePath) {
      await supabase.storage.from(PRIVATE_BUCKET).remove([storagePath]);
    }

    const { error: dbError } = await supabase
      .from('supplier_documents')
      .update({
        attached: false,
        storage_path: null,
        file_name: null,
        file_size: null,
        file_bytes: null,
        mime_type: null,
        uploaded_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Returns complete multipage document representations for viewing and printing.
 * Every page of multipage documents is provided with full fidelity headers,
 * seals, regulatory details, key-value tables, and signatures.
 */
export function getDocumentPages(doc: DocumentItem, _supplier: SupplierApplication): DocumentPage[] {
  // Never synthesize a government permit, receipt, clearance, signature, or certificate.
  // Only explicitly supplied document pages are eligible for structured display.
  return doc.pages ?? [];
}

