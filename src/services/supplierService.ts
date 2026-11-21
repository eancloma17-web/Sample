/** Supplier data boundary: maps database rows into UI models and persists workflow actions.
 * Follow RPC names into supabase/migrations to explain server-side validation. */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  SupplierApplication, 
  DocumentItem, 
  SubmissionComment, 
  DecisionRecord,
  SupplierCategory,
  AccreditationStatus,
  PhilgepsType,
  RepresentativeAuthType
} from '../types';

/**
 * Adapter: Maps SQL snake_case supplier_applications row + related rows to TypeScript SupplierApplication
 */
export function mapRowToSupplierApplication(
  row: any,
  docs: any[] = [],
  comments: any[] = [],
  decisions: any[] = []
): SupplierApplication {
  const documents: DocumentItem[] = docs.map(d => ({
    id: d.id,
    name: d.name,
    source: d.source || 'BOTH',
    required: d.required,
    category: d.category || 'ALL',
    attached: d.attached,
    fileName: d.file_name || undefined,
    fileSize: d.file_size || undefined,
    uploadedAt: d.uploaded_at ? d.uploaded_at.slice(0, 10) : undefined,
    referenceNumber: d.reference_number || undefined,
    expiryDate: d.expiry_date || undefined,
    isCertifiedTrueCopy: d.is_certified_true_copy ?? true,
    status: d.status || 'PENDING',
    rejectionReason: d.rejection_reason || undefined,
    storagePath: d.storage_path || undefined,
    pageCount: d.page_count || 1,
  }));

  const mappedComments: SubmissionComment[] = comments.map(c => ({
    id: c.id,
    authorName: c.author_name,
    authorRole: c.author_role,
    authorEmail: c.author_email,
    createdAt: c.created_at,
    message: c.message,
    relatedDocumentName: c.related_document_name || undefined,
  }));

  const mappedDecisions: DecisionRecord[] = decisions.map(dec => ({
    id: dec.id,
    action: dec.action,
    performedBy: dec.performed_by,
    role: dec.role,
    timestamp: dec.timestamp ? dec.timestamp.replace('T', ' ').slice(0, 19) : '',
    notes: dec.notes || undefined,
  }));

  return {
    id: row.id,
    referenceCode: row.reference_code,
    categories: (row.categories || []) as SupplierCategory[],
    businessName: row.business_name || '',
    proprietorName: row.proprietor_name || '',
    authorizedRepName: row.authorized_rep_name || '',
    repAuthType: (row.rep_auth_type || 'NONE') as RepresentativeAuthType,
    principalAddress: row.principal_address || '',
    branchAddress: row.branch_address || undefined,
    noBranchApplies: row.no_branch_applies ?? false,
    contactNumber: row.contact_number || '',
    contactPerson: row.contact_person || '',
    companyEmail: row.company_email || '',
    recordedOfferings: row.recorded_offerings || [],
    philgepsType: (row.philgeps_type || 'RED') as PhilgepsType,
    philgepsCertNumber: row.philgeps_cert_number || '',
    exclusiveDistributorship: row.exclusive_distributorship ?? false,
    exclusiveDistributorDetails: row.exclusive_distributor_details || undefined,
    hasDtiSecCert: row.has_dti_sec_cert ?? false,
    dtiSecNumber: row.dti_sec_number || undefined,
    hasPcabLicense: row.has_pcab_license ?? false,
    pcabLicenseNumber: row.pcab_license_number || undefined,
    pcabCategory: row.pcab_category || undefined,
    hasTaxClearance: row.has_tax_clearance ?? false,
    taxClearanceValidity: row.tax_clearance_validity || undefined,
    hasCompanyProfile: row.has_company_profile ?? false,
    hasMayorsPermit: row.has_mayors_permit ?? false,
    mayorsPermitNumber: row.mayors_permit_number || undefined,
    hasDbpAccount: row.has_dbp_account ?? false,
    dbpAccountNumber: row.dbp_account_number || undefined,
    hasForeignReciprocity: row.has_foreign_reciprocity ?? false,
    foreignReciprocityDetails: row.foreign_reciprocity_details || undefined,
    otherDocumentsAttached: row.other_documents_attached || undefined,
    documents,
    comments: mappedComments,
    decisionHistory: mappedDecisions,
    certifiedTrueAndCorrect: row.certified_true_and_correct ?? false,
    signatoryPrintedName: row.signatory_printed_name || '',
    submissionDate: row.submission_date || '',
    receivedDate: row.received_date || undefined,
    verifiedBy: row.verified_by || undefined,
    verifiedDate: row.verified_date || undefined,
    verificationNotes: row.verification_notes || undefined,
    approvedBy: row.approved_by || undefined,
    approvedDate: row.approved_date || undefined,
    approvalRemarks: row.approval_remarks || undefined,
    status: (row.status || 'DRAFT') as AccreditationStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch application for currently logged-in supplier
 */
export async function fetchSupplierApplicationForOwner(userId: string): Promise<SupplierApplication | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: appRow, error: appError } = await supabase
      .from('supplier_applications')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appError) {
      console.error(
        '[SUPPLIER DEBUG] Application query failed:',
        {
          code: appError.code,
          message: appError.message,
          details: appError.details
        }
      );
      return null;
    }

    if (!appRow) {
      console.error(
        '[SUPPLIER DEBUG] No application found for authenticated user.'
      );
      return null;
    }

    // Initialize missing approved document requirements before loading them.
    // The database RPC validates supplier ownership and preserves existing rows.
    const { error: initializationError } = await supabase.rpc(
      'initialize_supplier_documents',
      { p_application_id: appRow.id }
    );

    if (initializationError) {
      console.error(
        'Supplier document checklist initialization failed:',
        initializationError
      );
      // Continue loading the supplier application and existing records.
      // Do not hide the entire dashboard because checklist initialization failed.
    }

    // Fetch related docs, comments, decisions in parallel
    const [docsRes, commentsRes, decisionsRes] = await Promise.all([
      supabase.from('supplier_documents').select('*').eq('supplier_id', appRow.id).order('created_at'),
      supabase.from('submission_comments').select('*').eq('supplier_id', appRow.id).order('created_at'),
      supabase.from('decision_records').select('*').eq('supplier_id', appRow.id).order('timestamp', { ascending: false }),
    ]);

    return mapRowToSupplierApplication(
      appRow,
      docsRes.data || [],
      commentsRes.data || [],
      decisionsRes.data || []
    );
  } catch (err) {
    console.error('Error fetching supplier application:', err);
    return null;
  }
}

/**
 * Fetch all supplier applications (for Staff, Verifier, Head, Admin)
 */
export async function fetchAllSuppliers(): Promise<SupplierApplication[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data: apps, error: appsError } = await supabase
      .from('supplier_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (appsError || !apps) {
      console.error('Error fetching all suppliers:', appsError);
      return [];
    }

    const appIds = apps.map(a => a.id);
    if (appIds.length === 0) return [];

    const [docsRes, commentsRes, decisionsRes] = await Promise.all([
      supabase.from('supplier_documents').select('*').in('supplier_id', appIds),
      supabase.from('submission_comments').select('*').in('supplier_id', appIds),
      supabase.from('decision_records').select('*').in('supplier_id', appIds).order('timestamp', { ascending: false }),
    ]);

    const docsByApp = new Map<string, any[]>();
    (docsRes.data || []).forEach(d => {
      const list = docsByApp.get(d.supplier_id) || [];
      list.push(d);
      docsByApp.set(d.supplier_id, list);
    });

    const commentsByApp = new Map<string, any[]>();
    (commentsRes.data || []).forEach(c => {
      const list = commentsByApp.get(c.supplier_id) || [];
      list.push(c);
      commentsByApp.set(c.supplier_id, list);
    });

    const decisionsByApp = new Map<string, any[]>();
    (decisionsRes.data || []).forEach(dec => {
      const list = decisionsByApp.get(dec.supplier_id) || [];
      list.push(dec);
      decisionsByApp.set(dec.supplier_id, list);
    });

    return apps.map(app => 
      mapRowToSupplierApplication(
        app,
        docsByApp.get(app.id) || [],
        commentsByApp.get(app.id) || [],
        decisionsByApp.get(app.id) || []
      )
    );
  } catch (err) {
    console.error('Error in fetchAllSuppliers:', err);
    return [];
  }
}

/**
 * Fetch a single supplier application by ID
 */
export async function fetchSupplierById(id: string): Promise<SupplierApplication | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: app, error } = await supabase
      .from('supplier_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !app) return null;

    const [docsRes, commentsRes, decisionsRes] = await Promise.all([
      supabase.from('supplier_documents').select('*').eq('supplier_id', id).order('created_at'),
      supabase.from('submission_comments').select('*').eq('supplier_id', id).order('created_at'),
      supabase.from('decision_records').select('*').eq('supplier_id', id).order('timestamp', { ascending: false }),
    ]);

    return mapRowToSupplierApplication(
      app,
      docsRes.data || [],
      commentsRes.data || [],
      decisionsRes.data || []
    );
  } catch (err) {
    console.error('Error fetching supplier by ID:', err);
    return null;
  }
}

/**
 * Update SI Sheet fields (permitted only in DRAFT or REVISION_REQUESTED status)
 */
export async function updateSupplierSiSheet(
  applicationId: string,
  updatedData: Partial<SupplierApplication>
): Promise<{ success: boolean; data?: SupplierApplication; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    // Adapter from camelCase to snake_case for DB columns
    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (updatedData.categories !== undefined) payload.categories = updatedData.categories;
    if (updatedData.businessName !== undefined) payload.business_name = updatedData.businessName;
    if (updatedData.proprietorName !== undefined) payload.proprietor_name = updatedData.proprietorName;
    if (updatedData.authorizedRepName !== undefined) payload.authorized_rep_name = updatedData.authorizedRepName;
    if (updatedData.repAuthType !== undefined) payload.rep_auth_type = updatedData.repAuthType;
    if (updatedData.principalAddress !== undefined) payload.principal_address = updatedData.principalAddress;
    if (updatedData.branchAddress !== undefined) payload.branch_address = updatedData.branchAddress;
    if (updatedData.noBranchApplies !== undefined) payload.no_branch_applies = updatedData.noBranchApplies;
    if (updatedData.contactNumber !== undefined) payload.contact_number = updatedData.contactNumber;
    if (updatedData.contactPerson !== undefined) payload.contact_person = updatedData.contactPerson;
    if (updatedData.companyEmail !== undefined) payload.company_email = updatedData.companyEmail;
    if (updatedData.recordedOfferings !== undefined) payload.recorded_offerings = updatedData.recordedOfferings;
    if (updatedData.philgepsType !== undefined) payload.philgeps_type = updatedData.philgepsType;
    if (updatedData.philgepsCertNumber !== undefined) payload.philgeps_cert_number = updatedData.philgepsCertNumber;
    if (updatedData.exclusiveDistributorship !== undefined) payload.exclusive_distributorship = updatedData.exclusiveDistributorship;
    if (updatedData.exclusiveDistributorDetails !== undefined) payload.exclusive_distributor_details = updatedData.exclusiveDistributorDetails;
    if (updatedData.hasDtiSecCert !== undefined) payload.has_dti_sec_cert = updatedData.hasDtiSecCert;
    if (updatedData.dtiSecNumber !== undefined) payload.dti_sec_number = updatedData.dtiSecNumber;
    if (updatedData.hasPcabLicense !== undefined) payload.has_pcab_license = updatedData.hasPcabLicense;
    if (updatedData.pcabLicenseNumber !== undefined) payload.pcab_license_number = updatedData.pcabLicenseNumber;
    if (updatedData.pcabCategory !== undefined) payload.pcab_category = updatedData.pcabCategory;
    if (updatedData.hasTaxClearance !== undefined) payload.has_tax_clearance = updatedData.hasTaxClearance;
    if (updatedData.taxClearanceValidity !== undefined) payload.tax_clearance_validity = updatedData.taxClearanceValidity;
    if (updatedData.hasCompanyProfile !== undefined) payload.has_company_profile = updatedData.hasCompanyProfile;
    if (updatedData.hasMayorsPermit !== undefined) payload.has_mayors_permit = updatedData.hasMayorsPermit;
    if (updatedData.mayorsPermitNumber !== undefined) payload.mayors_permit_number = updatedData.mayorsPermitNumber;
    if (updatedData.hasDbpAccount !== undefined) payload.has_dbp_account = updatedData.hasDbpAccount;
    if (updatedData.dbpAccountNumber !== undefined) payload.dbp_account_number = updatedData.dbpAccountNumber;
    if (updatedData.hasForeignReciprocity !== undefined) payload.has_foreign_reciprocity = updatedData.hasForeignReciprocity;
    if (updatedData.foreignReciprocityDetails !== undefined) payload.foreign_reciprocity_details = updatedData.foreignReciprocityDetails;
    if (updatedData.otherDocumentsAttached !== undefined) payload.other_documents_attached = updatedData.otherDocumentsAttached;
    if (updatedData.signatoryPrintedName !== undefined) payload.signatory_printed_name = updatedData.signatoryPrintedName;
    if (updatedData.certifiedTrueAndCorrect !== undefined) payload.certified_true_and_correct = updatedData.certifiedTrueAndCorrect;

    const { error } = await supabase
      .from('supplier_applications')
      .update(payload)
      .eq('id', applicationId);

    if (error) {
      return { success: false, error: error.message };
    }

    const reloaded = await fetchSupplierById(applicationId);
    return { success: true, data: reloaded || undefined };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Submit Application to TSAD via transactional RPC
 */
export async function submitSupplierApplication(
  applicationId: string,
  signatoryName: string,
  expectedVersion: number = 1
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase.rpc('submit_supplier_application', {
      p_application_id: applicationId,
      p_signatory_name: signatoryName,
      p_expected_version: expectedVersion,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Mark application as UNDER_VERIFICATION (TSAD Staff only)
 */
export async function markUnderVerification(
  applicationId: string,
  receivedDate: string,
  expectedVersion: number = 1
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { error } = await supabase.rpc('mark_under_verification', {
      p_application_id: applicationId,
      p_received_date: receivedDate,
      p_expected_version: expectedVersion,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Mark application as VERIFIED (TSAD Staff only)
 */
export async function verifySupplierApplication(
  applicationId: string,
  verificationNotes: string,
  expectedVersion: number = 1
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { error } = await supabase.rpc('verify_supplier_application', {
      p_application_id: applicationId,
      p_verification_notes: verificationNotes,
      p_expected_version: expectedVersion,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Request application revision (TSAD Staff or CPMD Head)
 */
export async function requestApplicationRevision(
  applicationId: string,
  remarks: string,
  expectedVersion: number = 1
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { error } = await supabase.rpc('request_application_revision', {
      p_application_id: applicationId,
      p_remarks: remarks,
      p_expected_version: expectedVersion,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Final supplier approval is not authorized by the confirmed role specification. */
export async function approveSupplierMasterlist(
  _applicationId: string, _remarks: string, _expectedVersion: number = 1
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Final approval authority has not been designated.' };
}

/** Record a non-final Department Head recommendation through the protected database RPC. */
export async function recordDepartmentHeadRecommendation(supplierId: string, recommendation: 'RECOMMEND_FOR_FURTHER_REVIEW' | 'RECOMMEND_CORRECTIONS' | 'RECOMMEND_NO_ACTION', notes: string): Promise<string> {
  const { data, error } = await supabase.rpc('record_department_head_recommendation', {
    p_supplier_id: supplierId, p_recommendation: recommendation, p_notes: notes.trim()
  });
  if (error) throw new Error(error.message);
  return data as string;
}

/** Persist authorized submission comments. */
export async function addSubmissionComment(supplierId: string, message: string, relatedDocumentName?: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Sign in required');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('full_name,role,email').eq('id',user.id).single();
  if (profileError || !profile) throw new Error('Profile unavailable');
  const { data, error } = await supabase.from('submission_comments').insert({
    supplier_id: supplierId, author_id: user.id, author_name: profile.full_name,
    author_role: profile.role, author_email: profile.email, message,
    related_document_name: relatedDocumentName || null
  }).select('id').single();
  if (error) throw new Error(error.message);
  return data;
}

/** Operational settings: real Supabase records, never local-only success. */
export async function fetchSystemSettings(): Promise<Record<string,string>> {
  const { data, error } = await supabase.from('system_settings').select('key,value');
  if (error) throw new Error(error.message);
  return Object.fromEntries((data || []).map((r:any) => [r.key,r.value]));
}
export async function updateSystemSetting(key: string, value: string) {
  const { error } = await supabase.from('system_settings').update({value}).eq('key',key);
  if (error) throw new Error(error.message);
}
export async function fetchAssistanceTickets(): Promise<any[]> {
  const { data,error } = await supabase.from('access_assistance_tickets').select('*').order('created_at',{ascending:false});
  if (error) throw new Error(error.message);
  return data || [];
}
export async function createAssistanceTicket(args: {requesterEmail:string;requesterName:string;role:string;issueType:string;notes:string}) {
  const { data,error } = await supabase.from('access_assistance_tickets').insert({
    ticket_code: `AST-${crypto.randomUUID().slice(0,8).toUpperCase()}`,
    requester_email:args.requesterEmail, requester_name:args.requesterName,
    role:args.role, issue_type:args.issueType, notes:args.notes
  }).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}
export async function resolveAssistanceTicket(ticketCode:string, _remarks:string) {
  const { data: {user} } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');
  const { error } = await supabase.from('access_assistance_tickets').update({status:'RESOLVED',resolved_by:user.id,updated_at:new Date().toISOString()}).eq('ticket_code',ticketCode);
  if (error) throw new Error(error.message);
}
export async function fetchAuditEvents(): Promise<any[]> {
  const {data,error} = await supabase.from('audit_events').select('*').order('timestamp',{ascending:false}).limit(500);
  if (error) throw new Error(error.message);
  return data || [];
}
