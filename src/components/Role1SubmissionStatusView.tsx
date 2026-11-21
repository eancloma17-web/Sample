import React, { useState } from 'react';
import { SupplierApplication, Role1MenuItem, DocumentItem, UserAccount } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  Send, 
  ShieldAlert, 
  Printer, 
  Eye, 
  Building2,
  Lock,
  ArrowRight,
  Download,
  Layers,
  FileCheck2
} from 'lucide-react';
import { SecureDocumentViewerModal } from './SecureDocumentViewerModal';

interface Role1SubmissionStatusViewProps {
  supplier: SupplierApplication;
  onUpdateSupplier: (updated: SupplierApplication) => void;
  onNavigate: (menu: Role1MenuItem) => void;
  onViewPrintableForm: () => void;
  currentUser?: UserAccount | null;
}

export const Role1SubmissionStatusView: React.FC<Role1SubmissionStatusViewProps> = ({
  supplier,
  onUpdateSupplier,
  onNavigate,
  onViewPrintableForm,
  currentUser = null,
}) => {
  const [declarationChecked, setDeclarationChecked] = useState(supplier.certifiedTrueAndCorrect);
  const [submissionSuccessMessage, setSubmissionSuccessMessage] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  // Validate before final submission
  const missingRequiredDocs = supplier.documents.filter(d => d.required && !d.attached);
  const missingBusinessName = !supplier.businessName?.trim();
  const missingProprietor = !supplier.proprietorName?.trim();
  const missingAddress = !supplier.principalAddress?.trim();
  const missingContact = !supplier.contactNumber?.trim();
  const missingEmail = !supplier.companyEmail?.trim();

  const isFormComplete = 
    !missingBusinessName && 
    !missingProprietor && 
    !missingAddress && 
    !missingContact && 
    !missingEmail && 
    missingRequiredDocs.length === 0;

  const handleFinalSubmit = () => {
    setSubmissionError(null);

    if (!isFormComplete) {
      setSubmissionError('Cannot submit: Please ensure all mandatory SI Sheet fields and required documentary attachments are complete.');
      return;
    }

    if (!declarationChecked) {
      setSubmissionError('Explicit confirmation required: Please check the official supplier declaration box.');
      return;
    }

    const updated: SupplierApplication = {
      ...supplier,
      certifiedTrueAndCorrect: true,
      signatoryPrintedName: supplier.signatoryPrintedName || supplier.authorizedRepName || supplier.proprietorName,
      status: 'SUBMITTED',
      submissionDate: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString()
    };

    onUpdateSupplier(updated);
    setSubmissionSuccessMessage(true);
    setTimeout(() => setSubmissionSuccessMessage(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
              Supplier • Menu Item 4
            </span>
            <span className="text-xs text-slate-400 font-mono">{supplier.referenceCode}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a3560] tracking-tight mt-1">
            Persisted Submission & Review Status
          </h1>
          <p className="text-xs text-slate-500">
            Actual office review state. Suppliers cannot modify or set their own status.
          </p>
        </div>

        <button
          onClick={onViewPrintableForm}
          className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Inspect Printable Form (F.003)</span>
        </button>
      </div>

      {/* Success banner after final submission */}
      {submissionSuccessMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold">Application Submitted Successfully to CPMD TSAD</div>
            <div className="text-[11px] text-emerald-800">
              Your application has been persisted and forwarded to the Technical Support and Accreditation Division.
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {submissionError && (
        <div className="p-4 bg-red-50 text-red-900 rounded-xl border border-red-300 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{submissionError}</span>
        </div>
      )}

      {/* ACTUAL STATUS BADGE & EXPLANATION */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Actual Recorded Office Status:
            </span>
            <div className="flex items-center gap-2">
              {supplier.status === 'APPROVED_MASTERLIST' && (
                <span className="text-lg font-extrabold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ACCREDITED & IN MASTER LIST
                </span>
              )}
              {supplier.status === 'UNDER_VERIFICATION' && (
                <span className="text-lg font-extrabold text-amber-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  UNDER TSAD QMS VERIFICATION
                </span>
              )}
              {supplier.status === 'VERIFIED' && (
                <span className="text-lg font-extrabold text-blue-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  VERIFIED BY TSAD DIVISION HEAD
                </span>
              )}
              {supplier.status === 'SUBMITTED' && (
                <span className="text-lg font-extrabold text-blue-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  SUBMITTED TO CPMD
                </span>
              )}
              {supplier.status === 'DRAFT' && (
                <span className="text-lg font-extrabold text-slate-700 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-500" />
                  DRAFT APPLICATION
                </span>
              )}
              {supplier.status === 'REVISION_REQUESTED' && (
                <span className="text-lg font-extrabold text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  RETURNED FOR REVISION / CLARIFICATION
                </span>
              )}
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 font-mono">
            Last Updated: {supplier.updatedAt ? new Date(supplier.updatedAt).toLocaleDateString() : 'N/A'}
          </div>
        </div>

        {/* Detailed Status Narrative */}
        <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
          {supplier.status === 'APPROVED_MASTERLIST' && (
            <div className="space-y-2">
              <p className="font-semibold text-emerald-950">
                Congratulations. Your company is officially registered in the Master List of Credible and Eligible Suppliers of the City Government of Butuan under ISO 9001:2015 QMS standards.
              </p>
              <div className="text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <div>Verified by: <strong>{supplier.verifiedBy}</strong> on {supplier.verifiedDate}</div>
                <div>Approved by: <strong>{supplier.approvedBy}</strong> on {supplier.approvedDate}</div>
              </div>
            </div>
          )}

          {supplier.status === 'UNDER_VERIFICATION' && (
            <p>
              Your documents are currently undergoing verification by Engr. Mark Steven T. Rosales, Head of the Technical Support and Accreditation Division. Each certified true copy is cross-authenticated against official government registries.
            </p>
          )}

          {supplier.status === 'SUBMITTED' && (
            <p>
              Your application has been officially logged as received by the City Procurement Management Department. It is queued for document verification by the Technical Support and Accreditation Division.
            </p>
          )}

          {supplier.status === 'DRAFT' && (
            <p>
              This application is in Draft stage. Complete all required fields on the Supplier Information Sheet and upload all mandatory certified true copies, then confirm your declaration below to submit.
            </p>
          )}

          {supplier.status === 'REVISION_REQUESTED' && (
            <div className="space-y-2 text-red-950">
              <p className="font-bold">
                Revision Required by Technical Support and Accreditation Division:
              </p>
              <p className="p-3 bg-white rounded-lg border border-red-200 font-mono text-[11px]">
                {supplier.approvalRemarks || 'Please review attached documentary copies and replace any illegible or expired certificates.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SUBMITTED DOCUMENTS VAULT & INSPECTION DESK */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#0a4f94]" />
              <span>Submitted Supporting Documents Vault</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Authenticated electronic repository • View, download, and print your submitted certified true copies
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            {supplier.documents.filter(d => d.attached).length} Attached File(s)
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {supplier.documents.map((doc, idx) => (
            <div key={doc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-lg transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  doc.attached ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span>{idx + 1}. {doc.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      doc.attached
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.attached ? 'ATTACHED' : 'NOT ATTACHED'}
                    </span>
                  </div>

                  {doc.attached ? (
                    <div className="text-[11px] text-slate-600 font-mono flex flex-wrap items-center gap-x-2">
                      <span className="text-[#0a4f94] font-semibold">{doc.fileName}</span>
                      <span>({doc.fileSize || '1.8 MB'})</span>
                      {doc.referenceNumber && <span>• Ref: {doc.referenceNumber}</span>}
                      {doc.expiryDate && <span>• Exp: {doc.expiryDate}</span>}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400">
                      No document file submitted for this checklist requirement.
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons: Clearly Labeled "View Document", "Download", "Print" */}
              {doc.attached && (
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setViewingDoc(doc)}
                    className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    title="View multipage document in secure viewer"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-700" />
                    <span>View Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewingDoc(doc)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    title="Download document copy"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-700" />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewingDoc(doc)}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    title="Print document with page range options"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Print</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MANDATORY WARNING: ELIGIBILITY BOUNDARY */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-900">Legal and Procurement Notice:</strong>
          <p className="text-slate-600">
            Registration / master-list inclusion does not automatically establish eligibility for a particular procurement activity. Individual bidding opportunities require specific project qualifications, bid securities, and compliance with Philippine procurement laws (RA 9184 and RA 12009).
          </p>
        </div>
      </div>

      {/* TWO-WAY SUBMISSION COMMENTS THREAD (ROLE 1 & ROLE 2 SYNCHRONIZED) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span>TSAD Communication & Inquiries Thread</span>
              {supplier.comments && supplier.comments.length > 0 && (
                <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
                  {supplier.comments.length} message(s)
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500">
              Record-specific communication between your company and authorized TSAD Staff
            </p>
          </div>
        </div>

        {/* Message History */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {(!supplier.comments || supplier.comments.length === 0) ? (
            <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No communication recorded yet. Any notices or inquiries from TSAD Staff regarding your submission will appear here.
            </div>
          ) : (
            supplier.comments.map((comm) => (
              <div 
                key={comm.id} 
                className={`p-3.5 rounded-xl space-y-1 border ${
                  comm.authorRole === 'TSAD_STAFF'
                    ? 'bg-blue-50/80 border-blue-200 text-blue-950 ml-2'
                    : 'bg-slate-50 border-slate-200 text-slate-900 mr-2'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900">{comm.authorName}</strong>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      comm.authorRole === 'TSAD_STAFF' ? 'bg-[#072d50] text-white' : 'bg-slate-700 text-white'
                    }`}>
                      {comm.authorRole === 'TSAD_STAFF' ? 'TSAD Staff' : 'Supplier'}
                    </span>
                    {comm.relatedDocumentName && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Ref: {comm.relatedDocumentName}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(comm.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{comm.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Reply form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const inputEl = (e.currentTarget.elements.namedItem('supplierReply') as HTMLInputElement);
            const val = inputEl?.value?.trim();
            if (!val) return;

            const newComm = {
              id: `comm-${Date.now()}`,
              authorName: supplier.authorizedRepName || supplier.proprietorName || supplier.businessName,
              authorRole: 'SUPPLIER' as const,
              authorEmail: supplier.companyEmail,
              createdAt: new Date().toISOString(),
              message: val,
            };

            onUpdateSupplier({
              ...supplier,
              comments: [...(supplier.comments || []), newComm],
              updatedAt: new Date().toISOString()
            });

            inputEl.value = '';
          }}
          className="pt-2 flex gap-2"
        >
          <input
            name="supplierReply"
            type="text"
            placeholder="Type reply or inquiry to TSAD Staff regarding this submission..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#0a4f94] hover:bg-[#083e75] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Reply</span>
          </button>
        </form>
      </div>

      {/* FINAL SUBMISSION DESK (If in Draft or Revision Requested) */}
      {(supplier.status === 'DRAFT' || supplier.status === 'REVISION_REQUESTED') && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Final Submission Confirmation
            </h2>
            <p className="text-xs text-slate-500">
              Require explicit final confirmation and official declaration before transmitting to CPMD.
            </p>
          </div>

          {/* Pre-submission completeness summary */}
          <div className="space-y-2">
            <span className="font-bold text-xs text-slate-800">Pre-Submission Audit:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className={`p-3 rounded-lg border ${!missingBusinessName && !missingProprietor && !missingContact ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>General Information Fields</span>
                </div>
                <div className="text-[11px] mt-0.5">
                  {!missingBusinessName && !missingProprietor ? 'All mandatory fields completed' : 'Missing mandatory contact/owner fields'}
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${missingRequiredDocs.length === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Required Documentary Attachments</span>
                </div>
                <div className="text-[11px] mt-0.5">
                  {missingRequiredDocs.length === 0 ? 'All mandatory certified copies attached' : `${missingRequiredDocs.length} required document(s) missing`}
                </div>
              </div>
            </div>
          </div>

          {/* Official Declaration Checkbox */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declarationChecked}
                onChange={(e) => setDeclarationChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#0a4f94]"
              />
              <span className="font-bold text-xs text-blue-950 leading-relaxed">
                I/We hereby certify that the information stated and documents attached herein are true and correct.
              </span>
            </label>
            <div className="text-[11px] text-slate-600 pl-7">
              Signatory: <strong className="text-slate-900">{supplier.signatoryPrintedName || supplier.proprietorName}</strong>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Once submitted, attachments and fields become read-only until evaluated by TSAD.
            </span>
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="px-6 py-2.5 bg-[#0a4b8f] hover:bg-[#083e75] text-white font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer text-xs"
            >
              <Send className="w-4 h-4" />
              <span>Confirm & Submit Application</span>
            </button>
          </div>
        </div>
      )}

      {/* SECURE MULTIPAGE DOCUMENT VIEWER MODAL */}
      <SecureDocumentViewerModal
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
        supplier={supplier}
        currentUser={currentUser}
      />
    </div>
  );
};
