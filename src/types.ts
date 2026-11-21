export type SupplierCategory = 
  | 'GOODS AND SERVICES'
  | 'INFRASTRUCTURE PROJECTS'
  | 'CONSULTING SERVICES';

export type AccreditationStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'VERIFIED'
  | 'APPROVED_MASTERLIST'
  | 'REVISION_REQUESTED';

export type PhilgepsType = 'RED' | 'PLATINUM' | 'NONE';

export type RepresentativeAuthType = 'SPA' | 'SECRETARY_CERTIFICATE' | 'NONE';

export type Role1MenuItem = 
  | 'dashboard'
  | 'si-sheet'
  | 'document-submission'
  | 'submission-status'
  | 'account-security'
  | 'my-account'
  | 'sign-out';

export type Role2MenuItem = 
  | 'dashboard'
  | 'supplier-request-search'
  | 'review-queue'
  | 'si-sheet-documents'
  | 'verification-revision'
  | 'supplier-master-list'
  | 'document-expiration'
  | 'submission-comments'
  | 'reports-print'
  | 'my-account-security'
  | 'sign-out';

export type DeptHeadMenuItem = 
  | 'overview'
  | 'review-queue'
  | 'supplier-records'
  | 'document-review'
  | 'recommendations-decisions'
  | 'review-comments'
  | 'reports-printing'
  | 'decision-history'
  | 'account-security'
  | 'sign-out';

export type AdminStaffMenuItem = 
  | 'overview'
  | 'staff-accounts'
  | 'access-assistance'
  | 'reference-lists'
  | 'system-settings'
  | 'audit-records'
  | 'account-security'
  | 'sign-out';

export type MisMenuItem = AdminStaffMenuItem;

export interface DocumentPage {
  pageNumber: number;
  title: string;
  subtitle?: string;
  badge?: string;
  contentLines: string[];
  keyValues?: { label: string; value: string }[];
  officialNotes?: string[];
  signatoryTitle?: string;
  signatoryName?: string;
  hasSeal?: boolean;
  hasQrCode?: boolean;
  hasBarCode?: boolean;
  customImageUrl?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  source?: 'LETTER' | 'SI_SHEET' | 'BOTH';
  required: boolean;
  category: 'ALL' | 'INFRASTRUCTURE' | 'OPTIONAL' | 'FOREIGN';
  attached: boolean;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  referenceNumber?: string;
  expiryDate?: string;
  isCertifiedTrueCopy: boolean;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  pageCount?: number;
  fileDataUrl?: string;
  mimeType?: string;
  storagePath?: string;
  pages?: DocumentPage[];
}

export interface SubmissionComment {
  id: string;
  authorName: string;
  authorRole: 'TSAD_STAFF' | 'DEPT_HEAD' | 'SUPPLIER';
  authorEmail: string;
  createdAt: string;
  message: string;
  relatedDocumentName?: string;
}

export interface DecisionRecord {
  id: string;
  action: string;
  performedBy: string;
  role: string;
  timestamp: string;
  notes?: string;
}

export interface SupplierApplication {
  id: string;
  referenceCode: string; // e.g. CGB-TSAD-2026-0042
  categories: SupplierCategory[];
  
  // GENERAL INFORMATION (from PDF Form CPMD.TSAD.F.003. REV00)
  businessName: string;
  proprietorName: string;
  authorizedRepName: string;
  repAuthType: RepresentativeAuthType;
  principalAddress: string;
  branchAddress?: string;
  noBranchApplies?: boolean;
  contactNumber: string;
  contactPerson: string;
  companyEmail: string;

  // Recorded offerings / keywords for search
  recordedOfferings?: string[];

  // SPECIFIC DOCUMENT REQUIREMENTS
  philgepsType: PhilgepsType;
  philgepsCertNumber: string;
  exclusiveDistributorship: boolean;
  exclusiveDistributorDetails?: string;
  hasDtiSecCert: boolean;
  dtiSecNumber?: string;
  hasPcabLicense: boolean;
  pcabLicenseNumber?: string;
  pcabCategory?: string;
  hasTaxClearance: boolean;
  taxClearanceValidity?: string;
  hasCompanyProfile: boolean;
  hasMayorsPermit: boolean;
  mayorsPermitNumber?: string;
  hasDbpAccount: boolean;
  dbpAccountNumber?: string;
  hasForeignReciprocity: boolean;
  foreignReciprocityDetails?: string;
  otherDocumentsAttached?: string;

  // Attached files list
  documents: DocumentItem[];

  // Two-way submission comments thread
  comments?: SubmissionComment[];

  // Traceable decision history
  decisionHistory?: DecisionRecord[];

  // CERTIFICATION STATEMENT
  certifiedTrueAndCorrect: boolean;
  signatoryPrintedName: string;
  submissionDate: string;

  // TO BE FILLED OUT BY CPMD PERSONNEL
  receivedDate?: string;
  verifiedBy?: string; // Engr. MARK STEVEN T. ROSALES (Technical Support and Accreditation Division Head)
  verifiedDate?: string;
  verificationNotes?: string;
  approvedBy?: string; // FOR. VINCENT PHILIP F. PIENCENAVES (Acting Department Head)
  approvedDate?: string;
  approvalRemarks?: string;

  status: AccreditationStatus;
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'SUPPLIER' | 'TSAD_STAFF' | 'CPMD_VERIFIER' | 'CPMD_HEAD' | 'ADMIN_STAFF' | 'MIS_OFFICER';
  companyName?: string;
  supplierId?: string;
  emailVerified?: boolean;
  lastLoginAt?: string;
  passwordUpdatedAt?: string;
  staffTitle?: string;
}
