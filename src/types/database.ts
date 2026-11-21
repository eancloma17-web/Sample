export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 
  | 'SUPPLIER' 
  | 'TSAD_STAFF' 
  | 'CPMD_VERIFIER' 
  | 'CPMD_HEAD' 
  | 'ADMIN_STAFF' 
  | 'MIS_OFFICER';

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

export type DocumentSource = 'LETTER' | 'SI_SHEET' | 'BOTH';

export type DocumentCategory = 'ALL' | 'INFRASTRUCTURE' | 'OPTIONAL' | 'FOREIGN';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type CommentRole = 'TSAD_STAFF' | 'DEPT_HEAD' | 'SUPPLIER';

export type AuditCategory = 'AUTH' | 'VERIFICATION' | 'APPROVAL' | 'MIS' | 'SYSTEM';

export type TicketStatus = 'DISPATCHED' | 'RESOLVED';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          company_name: string | null;
          supplier_id: string | null;
          staff_title: string | null;
          is_active: boolean;
          email_verified: boolean;
          last_login_at: string | null;
          password_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          company_name?: string | null;
          supplier_id?: string | null;
          staff_title?: string | null;
          is_active?: boolean;
          email_verified?: boolean;
          last_login_at?: string | null;
          password_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          company_name?: string | null;
          supplier_id?: string | null;
          staff_title?: string | null;
          is_active?: boolean;
          email_verified?: boolean;
          last_login_at?: string | null;
          password_updated_at?: string | null;
          updated_at?: string;
        };
      };
      supplier_applications: {
        Row: {
          id: string;
          reference_code: string;
          owner_id: string;
          categories: SupplierCategory[];
          business_name: string;
          proprietor_name: string;
          authorized_rep_name: string | null;
          rep_auth_type: RepresentativeAuthType;
          principal_address: string;
          branch_address: string | null;
          no_branch_applies: boolean;
          contact_number: string;
          contact_person: string;
          company_email: string;
          recorded_offerings: string[];
          philgeps_type: PhilgepsType;
          philgeps_cert_number: string | null;
          exclusive_distributorship: boolean;
          exclusive_distributor_details: string | null;
          has_dti_sec_cert: boolean;
          dti_sec_number: string | null;
          has_pcab_license: boolean;
          pcab_license_number: string | null;
          pcab_category: string | null;
          has_tax_clearance: boolean;
          tax_clearance_validity: string | null;
          has_company_profile: boolean;
          has_mayors_permit: boolean;
          mayors_permit_number: string | null;
          has_dbp_account: boolean;
          dbp_account_number: string | null;
          has_foreign_reciprocity: boolean;
          foreign_reciprocity_details: string | null;
          other_documents_attached: string | null;
          certified_true_and_correct: boolean;
          signatory_printed_name: string | null;
          submission_date: string | null;
          received_date: string | null;
          verified_by: string | null;
          verified_by_id: string | null;
          verified_date: string | null;
          verification_notes: string | null;
          approved_by: string | null;
          approved_by_id: string | null;
          approved_date: string | null;
          approval_remarks: string | null;
          status: AccreditationStatus;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_code: string;
          owner_id: string;
          categories?: SupplierCategory[];
          business_name: string;
          proprietor_name: string;
          authorized_rep_name?: string | null;
          rep_auth_type?: RepresentativeAuthType;
          principal_address: string;
          branch_address?: string | null;
          no_branch_applies?: boolean;
          contact_number: string;
          contact_person: string;
          company_email: string;
          recorded_offerings?: string[];
          philgeps_type?: PhilgepsType;
          philgeps_cert_number?: string | null;
          exclusive_distributorship?: boolean;
          exclusive_distributor_details?: string | null;
          has_dti_sec_cert?: boolean;
          dti_sec_number?: string | null;
          has_pcab_license?: boolean;
          pcab_license_number?: string | null;
          pcab_category?: string | null;
          has_tax_clearance?: boolean;
          tax_clearance_validity?: string | null;
          has_company_profile?: boolean;
          has_mayors_permit?: boolean;
          mayors_permit_number?: string | null;
          has_dbp_account?: boolean;
          dbp_account_number?: string | null;
          has_foreign_reciprocity?: boolean;
          foreign_reciprocity_details?: string | null;
          other_documents_attached?: string | null;
          certified_true_and_correct?: boolean;
          signatory_printed_name?: string | null;
          submission_date?: string | null;
          received_date?: string | null;
          verified_by?: string | null;
          verified_by_id?: string | null;
          verified_date?: string | null;
          verification_notes?: string | null;
          approved_by?: string | null;
          approved_by_id?: string | null;
          approved_date?: string | null;
          approval_remarks?: string | null;
          status?: AccreditationStatus;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          categories?: SupplierCategory[];
          business_name?: string;
          proprietor_name?: string;
          authorized_rep_name?: string | null;
          rep_auth_type?: RepresentativeAuthType;
          principal_address?: string;
          branch_address?: string | null;
          no_branch_applies?: boolean;
          contact_number?: string;
          contact_person?: string;
          company_email?: string;
          recorded_offerings?: string[];
          philgeps_type?: PhilgepsType;
          philgeps_cert_number?: string | null;
          exclusive_distributorship?: boolean;
          exclusive_distributor_details?: string | null;
          has_dti_sec_cert?: boolean;
          dti_sec_number?: string | null;
          has_pcab_license?: boolean;
          pcab_license_number?: string | null;
          pcab_category?: string | null;
          has_tax_clearance?: boolean;
          tax_clearance_validity?: string | null;
          has_company_profile?: boolean;
          has_mayors_permit?: boolean;
          mayors_permit_number?: string | null;
          has_dbp_account?: boolean;
          dbp_account_number?: string | null;
          has_foreign_reciprocity?: boolean;
          foreign_reciprocity_details?: string | null;
          other_documents_attached?: string | null;
          certified_true_and_correct?: boolean;
          signatory_printed_name?: string | null;
          submission_date?: string | null;
          received_date?: string | null;
          verified_by?: string | null;
          verified_by_id?: string | null;
          verified_date?: string | null;
          verification_notes?: string | null;
          approved_by?: string | null;
          approved_by_id?: string | null;
          approved_date?: string | null;
          approval_remarks?: string | null;
          status?: AccreditationStatus;
          version?: number;
          updated_at?: string;
        };
      };
      supplier_documents: {
        Row: {
          id: string;
          supplier_id: string;
          name: string;
          source: DocumentSource;
          required: boolean;
          category: DocumentCategory;
          attached: boolean;
          storage_path: string | null;
          file_name: string | null;
          file_size: string | null;
          file_bytes: number | null;
          mime_type: string | null;
          uploaded_at: string | null;
          reference_number: string | null;
          expiry_date: string | null;
          is_certified_true_copy: boolean;
          status: DocumentStatus;
          rejection_reason: string | null;
          page_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          name: string;
          source?: DocumentSource;
          required?: boolean;
          category?: DocumentCategory;
          attached?: boolean;
          storage_path?: string | null;
          file_name?: string | null;
          file_size?: string | null;
          file_bytes?: number | null;
          mime_type?: string | null;
          uploaded_at?: string | null;
          reference_number?: string | null;
          expiry_date?: string | null;
          is_certified_true_copy?: boolean;
          status?: DocumentStatus;
          rejection_reason?: string | null;
          page_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          source?: DocumentSource;
          required?: boolean;
          category?: DocumentCategory;
          attached?: boolean;
          storage_path?: string | null;
          file_name?: string | null;
          file_size?: string | null;
          file_bytes?: number | null;
          mime_type?: string | null;
          uploaded_at?: string | null;
          reference_number?: string | null;
          expiry_date?: string | null;
          is_certified_true_copy?: boolean;
          status?: DocumentStatus;
          rejection_reason?: string | null;
          page_count?: number;
          updated_at?: string;
        };
      };
      submission_comments: {
        Row: {
          id: string;
          supplier_id: string;
          author_id: string;
          author_name: string;
          author_role: CommentRole;
          author_email: string;
          message: string;
          related_document_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          author_id: string;
          author_name: string;
          author_role: CommentRole;
          author_email: string;
          message: string;
          related_document_name?: string | null;
          created_at?: string;
        };
        Update: {
          message?: string;
        };
      };
      decision_records: {
        Row: {
          id: string;
          supplier_id: string;
          action: string;
          performed_by: string;
          performed_by_id: string | null;
          role: string;
          notes: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          action: string;
          performed_by: string;
          performed_by_id?: string | null;
          role: string;
          notes?: string | null;
          timestamp?: string;
        };
        Update: never;
      };
      audit_events: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_name: string;
          role: string;
          action: string;
          category: AuditCategory;
          target: string;
          ip: string | null;
          metadata: Json;
          timestamp: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_name: string;
          role: string;
          action: string;
          category: AuditCategory;
          target: string;
          ip?: string | null;
          metadata?: Json;
          timestamp?: string;
        };
        Update: never;
      };
      access_assistance_tickets: {
        Row: {
          id: string;
          ticket_code: string;
          requester_email: string;
          requester_name: string;
          role: string;
          issue_type: string;
          status: TicketStatus;
          notes: string | null;
          resolved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_code: string;
          requester_email: string;
          requester_name: string;
          role: string;
          issue_type: string;
          status?: TicketStatus;
          notes?: string | null;
          resolved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: TicketStatus;
          notes?: string | null;
          resolved_by?: string | null;
          updated_at?: string;
        };
      };
      system_settings: {
        Row: {
          key: string;
          value: string;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          value?: string;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      reference_standards: {
        Row: {
          id: string;
          type: 'CLASSIFICATION' | 'MANDATORY_DOCUMENT';
          code: string;
          title: string;
          description: string | null;
          metadata: Json;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          type: 'CLASSIFICATION' | 'MANDATORY_DOCUMENT';
          code: string;
          title: string;
          description?: string | null;
          metadata?: Json;
          is_active?: boolean;
        };
        Update: {
          code?: string;
          title?: string;
          description?: string | null;
          metadata?: Json;
          is_active?: boolean;
        };
      };
    };
    Functions: {
      submit_supplier_application: {
        Args: {
          p_application_id: string;
          p_signatory_name: string;
          p_expected_version: number;
        };
        Returns: Json;
      };
      mark_under_verification: {
        Args: {
          p_application_id: string;
          p_received_date: string;
          p_expected_version: number;
        };
        Returns: Json;
      };
      verify_supplier_application: {
        Args: {
          p_application_id: string;
          p_verification_notes: string;
          p_expected_version: number;
        };
        Returns: Json;
      };
      request_application_revision: {
        Args: {
          p_application_id: string;
          p_remarks: string;
          p_expected_version: number;
        };
        Returns: Json;
      };
      approve_supplier_masterlist: {
        Args: {
          p_application_id: string;
          p_approval_remarks: string;
          p_expected_version: number;
        };
        Returns: Json;
      };
      verify_or_reject_document: {
        Args: {
          p_document_id: string;
          p_status: DocumentStatus;
          p_rejection_reason?: string;
        };
        Returns: Json;
      };
      log_audit_event: {
        Args: {
          p_action: string;
          p_category: AuditCategory;
          p_target: string;
          p_metadata?: Json;
        };
        Returns: string;
      };
    };
  };
}
