import { supabase } from '../lib/supabase';

export type DocumentVerificationStatus = 'VERIFIED' | 'REJECTED';

export async function reviewSupplierDocument(
  documentId: string,
  status: DocumentVerificationStatus,
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> {
  if (!documentId) {
    return { success: false, error: 'Document ID is required.' };
  }

  if (status === 'REJECTED' && !rejectionReason?.trim()) {
    return { success: false, error: 'A rejection reason is required.' };
  }

  const { error } = await supabase.rpc('verify_or_reject_document', {
    p_document_id: documentId,
    p_status: status,
    p_rejection_reason: status === 'REJECTED'
      ? rejectionReason!.trim()
      : null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
