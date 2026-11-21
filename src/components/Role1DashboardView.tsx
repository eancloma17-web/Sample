import React from 'react';
import { SupplierApplication, UserAccount, Role1MenuItem } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  UploadCloud, 
  ShieldAlert, 
  ArrowRight, 
  Building2, 
  Info, 
  Mail, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface Role1DashboardViewProps {
  supplier: SupplierApplication;
  currentUser: UserAccount;
  onNavigate: (menu: Role1MenuItem) => void;
  onOpenHelp: () => void;
}

export const Role1DashboardView: React.FC<Role1DashboardViewProps> = ({
  supplier,
  currentUser,
  onNavigate,
  onOpenHelp,
}) => {
  // Compute incomplete items strictly based on required fields and checklist
  const incompleteGeneralFields: string[] = [];
  if (!supplier.businessName?.trim()) incompleteGeneralFields.push('Business Name of Supplier/Contractor/Consultant');
  if (!supplier.proprietorName?.trim()) incompleteGeneralFields.push('Name of Proprietor / Business Owner');
  if (!supplier.principalAddress?.trim()) incompleteGeneralFields.push('Principal Place of Business (Address)');
  if (!supplier.contactNumber?.trim()) incompleteGeneralFields.push('Contact Number');
  if (!supplier.contactPerson?.trim()) incompleteGeneralFields.push('Contact Person');
  if (!supplier.companyEmail?.trim()) incompleteGeneralFields.push('Company Email Address');
  if (supplier.categories.length === 0) incompleteGeneralFields.push('Supplier Category / Classification');

  const missingRequiredDocs = supplier.documents.filter(d => d.required && !d.attached);
  const totalRequiredDocs = supplier.documents.filter(d => d.required).length;
  const attachedRequiredDocs = supplier.documents.filter(d => d.required && d.attached).length;

  // Real progress calculation (no fabricated metrics)
  const totalGeneralRequired = 7;
  const completedGeneralCount = totalGeneralRequired - incompleteGeneralFields.length;
  const totalSteps = totalGeneralRequired + totalRequiredDocs;
  const completedSteps = completedGeneralCount + attachedRequiredDocs;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Official Context & Scope Lock Notice */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                {supplier.referenceCode}
              </span>
              <span className="text-xs text-slate-400 font-mono">Form CPMD.TSAD.F.003. REV00</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a3560] tracking-tight mt-1">
              {supplier.businessName || 'Supplier Registration Workspace'}
            </h1>
          </div>

          <div className="shrink-0">
            {supplier.status === 'APPROVED_MASTERLIST' && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Accredited in Master List
              </span>
            )}
            {supplier.status === 'UNDER_VERIFICATION' && (
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 font-bold px-3 py-1 rounded-full text-xs">
                <Clock className="w-4 h-4 text-amber-600" />
                Under QMS Verification
              </span>
            )}
            {supplier.status === 'SUBMITTED' && (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-300 font-bold px-3 py-1 rounded-full text-xs">
                <Clock className="w-4 h-4 text-blue-600" />
                Submitted to CPMD
              </span>
            )}
            {supplier.status === 'DRAFT' && (
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-300 font-bold px-3 py-1 rounded-full text-xs">
                Draft (Not Submitted)
              </span>
            )}
            {supplier.status === 'REVISION_REQUESTED' && (
              <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-800 border border-red-300 font-bold px-3 py-1 rounded-full text-xs">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Revision Requested
              </span>
            )}
          </div>
        </div>

        <div className="pt-3 text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>Categories: <strong className="text-slate-800">{supplier.categories.join(', ') || 'None selected'}</strong></span>
          <span>·</span>
          <span>Proprietor: <strong className="text-slate-800">{supplier.proprietorName || 'Not specified'}</strong></span>
          <span>·</span>
          <span>Login Account: <strong className="text-slate-800">{currentUser.email}</strong></span>
        </div>
      </div>

      {/* 2. Official Warnings (from PDF Section 7 & 8) */}
      <div className="space-y-3">
        {/* Warning: Account creation != approval */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-950">
          <Info className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              Account Creation Notice: Account creation does not equal supplier approval.
            </p>
            <p className="text-slate-600">
              Inclusion in the Master List of Credible and Eligible Suppliers is granted only after review and verification by the Technical Support and Accreditation Division (TSAD) and review by the Department Head; final approval authority has not been designated.
            </p>
          </div>
        </div>

        {/* Warning: Eligibility warning */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-700">
          <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-900">Procurement Eligibility Boundary:</span>
            <p className="text-slate-600">
              Registration and master-list inclusion does not automatically establish eligibility for a particular procurement activity or public bidding. Specific project biddings require compliance with respective terms of reference and RA 9184 / RA 12009 requirements.
            </p>
          </div>
        </div>

        {/* Warning: Email verification state if not verified */}
        {!currentUser.emailVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-3 text-xs text-amber-950">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Email Not Verified:</span>
                <p className="text-slate-700 mt-0.5">
                  Your login email <span className="font-mono font-semibold">{currentUser.email}</span> is awaiting verification. Verification confirms email control only; it does not mean supplier approval.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('account-security')}
              className="text-amber-800 hover:text-amber-950 underline font-bold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Verify Email
            </button>
          </div>
        )}

        {/* Returned for Revision Message */}
        {supplier.status === 'REVISION_REQUESTED' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 text-xs text-red-950">
            <div className="flex items-center gap-2 font-bold text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>TSAD Review Feedback: Revision Instructions</span>
            </div>
            <p className="text-slate-700 bg-white p-3 rounded-lg border border-red-100 font-mono text-[11px]">
              {supplier.approvalRemarks || 'Clarification or replacement required for documentary attachments before accreditation.'}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onNavigate('document-submission')}
                className="px-3 py-1.5 bg-red-700 text-white rounded-lg font-bold hover:bg-red-800 transition-colors cursor-pointer"
              >
                Go to Document Submission
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Actual Registration Progress (No Fabricated Metrics) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Registration Progress
            </h2>
            <p className="text-xs text-slate-500">
              Based on official fields and required documentary checklist
            </p>
          </div>
          <span className="font-mono text-lg font-extrabold text-[#0a4f94]">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-[#0a4f94] h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Breakdown Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-slate-700">Official SI Sheet Fields:</span>
            <span className="font-mono font-bold text-slate-900">
              {completedGeneralCount} of {totalGeneralRequired} complete
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-slate-700">Required Documentary Attachments:</span>
            <span className="font-mono font-bold text-slate-900">
              {attachedRequiredDocs} of {totalRequiredDocs} attached
            </span>
          </div>
        </div>
      </div>

      {/* 4. Incomplete Requirements Audit (Exact missing items) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span>Incomplete Requirements Checklist</span>
              {(incompleteGeneralFields.length > 0 || missingRequiredDocs.length > 0) ? (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {incompleteGeneralFields.length + missingRequiredDocs.length} pending
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> All Required Items Present
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Identify missing items according to the confirmed checklist; no invented mandatory documents.
            </p>
          </div>
        </div>

        {incompleteGeneralFields.length === 0 && missingRequiredDocs.length === 0 ? (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>All mandatory SI Sheet information and required certified true copies are attached.</span>
            </div>
            {supplier.status === 'DRAFT' && (
              <button
                onClick={() => onNavigate('submission-status')}
                className="px-3 py-1.5 bg-[#0a4f94] text-white rounded-lg font-bold hover:bg-[#083e75] transition-colors cursor-pointer text-xs"
              >
                Proceed to Submit
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Missing General Fields */}
            {incompleteGeneralFields.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 block text-xs">
                  Missing Information Sheet Fields:
                </span>
                <ul className="space-y-1 pl-4 list-disc text-amber-900">
                  {incompleteGeneralFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
                <div className="pt-1">
                  <button
                    onClick={() => onNavigate('si-sheet')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#0a4f94] hover:underline font-bold cursor-pointer"
                  >
                    <span>Complete Supplier Information Sheet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Missing Required Documents */}
            {missingRequiredDocs.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-800 block text-xs">
                  Missing Certified True Copy Attachments:
                </span>
                <ul className="space-y-1 pl-4 list-disc text-amber-900">
                  {missingRequiredDocs.map((doc) => (
                    <li key={doc.id}>
                      <span className="font-semibold">{doc.name}</span>
                      {doc.category === 'INFRASTRUCTURE' && (
                        <span className="text-[10px] text-slate-500 ml-1.5">(Applicable for Infrastructure contractors)</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="pt-1">
                  <button
                    onClick={() => onNavigate('document-submission')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#0a4f94] hover:underline font-bold cursor-pointer"
                  >
                    <span>Upload Missing Documents (10 MB PDF/JPG/PNG limit)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Fast Workflow Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onNavigate('si-sheet')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 text-left transition-all shadow-xs cursor-pointer group"
        >
          <FileText className="w-5 h-5 text-[#0a4f94] mb-2" />
          <h3 className="font-bold text-xs text-slate-900 group-hover:text-blue-900">
            2. Supplier Information Sheet
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Complete and verify official Form CPMD.TSAD.F.003 fields.
          </p>
        </button>

        <button
          onClick={() => onNavigate('document-submission')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 text-left transition-all shadow-xs cursor-pointer group"
        >
          <UploadCloud className="w-5 h-5 text-[#0a4f94] mb-2" />
          <h3 className="font-bold text-xs text-slate-900 group-hover:text-blue-900">
            3. Document Submission
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Upload certified true copies with 10MB format validation.
          </p>
        </button>

        <button
          onClick={() => onNavigate('submission-status')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 text-left transition-all shadow-xs cursor-pointer group"
        >
          <CheckCircle2 className="w-5 h-5 text-[#0a4f94] mb-2" />
          <h3 className="font-bold text-xs text-slate-900 group-hover:text-blue-900">
            4. Submission Status
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Inspect persisted status, declarations, and review history.
          </p>
        </button>
      </div>
    </div>
  );
};
