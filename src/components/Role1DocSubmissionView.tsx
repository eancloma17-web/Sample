import React, { useState } from 'react';
import { SupplierApplication, DocumentItem, UserAccount } from '../types';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Lock, 
  Info, 
  Trash2, 
  Eye, 
  HelpCircle,
  FileCheck,
  Check,
  Download,
  Printer
} from 'lucide-react';
import { SecureDocumentViewerModal } from './SecureDocumentViewerModal';
import { uploadDocumentFile, removeDocumentFile } from '../services/documentStorageService';
import { isSupabaseConfigured } from '../lib/supabase';

interface Role1DocSubmissionViewProps {
  supplier: SupplierApplication;
  onUpdateSupplier: (updated: SupplierApplication) => void;
  onRefreshSuppliers: () => Promise<void>;
  onOpenHelp: () => void;
  currentUser?: UserAccount | null;
}

export const Role1DocSubmissionView: React.FC<Role1DocSubmissionViewProps> = ({
  supplier,
  onUpdateSupplier,
  onRefreshSuppliers,
  onOpenHelp,
  currentUser = null,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [fileInputName, setFileInputName] = useState('');
  const [fileInputRefNo, setFileInputRefNo] = useState('');
  const [fileInputDataUrl, setFileInputDataUrl] = useState<string | undefined>(undefined);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCertifiedTrueCopy, setIsCertifiedTrueCopy] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [simulatedSizeMb, setSimulatedSizeMb] = useState<number>(2.4);

  // Document viewing & printing modal state
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  const isEditable = supplier.status === 'DRAFT' || supplier.status === 'REVISION_REQUESTED';

  const handleOpenFileModal = (doc: DocumentItem) => {
    if (!isEditable) return;
    setSelectedDocId(doc.id);
    setFileInputName(doc.fileName || `${doc.name.replace(/[^a-zA-Z0-9]/g, '_')}_Certified.pdf`);
    setFileInputRefNo(doc.referenceNumber || '');
    setFileInputDataUrl(doc.fileDataUrl);
    setRawFile(null);
    setIsCertifiedTrueCopy(doc.isCertifiedTrueCopy ?? true);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleSimulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size limit: 10 MB per file limit
    const sizeInMb = file.size / (1024 * 1024);
    setSimulatedSizeMb(parseFloat(sizeInMb.toFixed(2)));

    if (sizeInMb > 10) {
      setUploadError(`File rejected: Size (${sizeInMb.toFixed(2)} MB) exceeds the confirmed 10 MB per-file limit.`);
      return;
    }

    // Validate allowed formats: PDF, JPG, PNG
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const lowerName = file.name.toLowerCase();
    const isAllowed = allowedExtensions.some(ext => lowerName.endsWith(ext));

    if (!isAllowed) {
      setUploadError(`File rejected: Unsupported format. Stated allowed formats are PDF, JPG, and PNG only.`);
      return;
    }

    setRawFile(file);

    // Read real file content as Data URL for authentic multi-page / image viewing
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFileInputDataUrl(uploadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploadError(null);
    setFileInputName(file.name);
  };

  const handleConfirmUpload = async () => {
    if (!selectedDocId) return;

    if (!rawFile) { setUploadError('Select a real file to upload before confirming.'); return; }

    if (!fileInputName.trim()) {
      setUploadError('Please select or specify a valid file name.');
      return;
    }

    if (simulatedSizeMb > 10) {
      setUploadError('Cannot upload: File exceeds the confirmed 10 MB size limit.');
      return;
    }

    setIsUploading(true);
    let uploadedStoragePath: string | undefined = undefined;

    if (!isSupabaseConfigured()) {
      setUploadError('Supabase is not configured; document was not uploaded.');
      setIsUploading(false);
      return;
    }
    const uploadRes = await uploadDocumentFile({
      supplierId: supplier.id, documentId: selectedDocId, file: rawFile,
      referenceNumber: fileInputRefNo.trim() || undefined, isCertifiedTrueCopy,
    });
    if (!uploadRes.success || !uploadRes.data?.storagePath) {
      setUploadError(uploadRes.error || 'Storage upload failed. No attachment was saved.');
      setIsUploading(false);
      return;
    }
    uploadedStoragePath = uploadRes.data.storagePath;

    const updatedDocuments = supplier.documents.map(d => {
      if (d.id === selectedDocId) {
        return {
          ...d,
          attached: true,
          fileName: fileInputName.trim(),
          fileSize: `${simulatedSizeMb} MB`,
          uploadedAt: new Date().toISOString().slice(0, 10),
          referenceNumber: fileInputRefNo.trim() || d.referenceNumber,
          isCertifiedTrueCopy: isCertifiedTrueCopy,
          fileDataUrl: undefined,
          storagePath: uploadedStoragePath,
          status: 'PENDING' as const
        };
      }
      return d;
    });

    const updatedSupplier: SupplierApplication = {
      ...supplier,
      documents: updatedDocuments,
      updatedAt: new Date().toISOString()
    };

    await onRefreshSuppliers();
    setIsUploading(false);
    setUploadSuccess(`Successfully attached certified true copy for: ${fileInputName}`);
    setTimeout(() => {
      setSelectedDocId(null);
      setUploadSuccess(null);
    }, 1500);
  };

  const handleRemoveAttachment = async (docId: string) => {
  if (!isEditable) return;

  const document = supplier.documents.find((item) => item.id === docId);
  if (!document?.storagePath) return;

  const result = await removeDocumentFile(docId, document.storagePath);
  if (!result.success) {
    console.error('Failed to remove attachment:', result.error);
    return;
  }

  // Reload from Supabase only after the delete and metadata update succeed.
  await onRefreshSuppliers();
  };

  const attachedCount = supplier.documents.filter(d => d.attached).length;
  const totalCount = supplier.documents.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
              CPMD TSAD Document Desk
            </span>
            <span className="text-xs text-slate-400 font-mono">{supplier.referenceCode}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a3560] tracking-tight mt-1">
            Document Submission & Attachment Desk
          </h1>
          <p className="text-xs text-slate-500">
            Certified true copy verification under ISO 9001:2015 QMS standards
          </p>
        </div>

        <div className="bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-700">
          Attached: <span className="text-[#0a4f94]">{attachedCount}</span> / {totalCount}
        </div>
      </div>

      {/* Lock Notice if not in permitted workflow stage */}
      {!isEditable && (
        <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 flex items-center gap-3 text-xs text-slate-700">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Document attachments locked:</strong> Files can only be replaced or modified during <em>Draft</em> or when <em>Returned for Revision</em> by CPMD. Current status is <strong>{supplier.status.replace('_', ' ')}</strong>.
          </span>
        </div>
      )}

      {/* SECTION 4 CALLOUT: SOURCE DISCREPANCY NOTICE (Mandatory from PDF Page 2) */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 space-y-3 text-xs text-amber-950">
        <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Section 4: Documentary Requirements and Source Discrepancy Notice</span>
        </div>
        <p className="text-slate-800 leading-relaxed">
          <strong>Do not silently reconcile the source lists:</strong> The accompanying formal letter and the Supplier Information Sheet (SI Sheet) checklist do not fully match. This checklist presents both source lists so no document is silently omitted, pending final CPMD/TSAD confirmation of universal vs. conditional applicability.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* 4.1 Listed in Letter */}
          <div className="bg-white/80 p-3 rounded-lg border border-amber-200 space-y-1">
            <span className="font-bold text-slate-900 block text-[11px]">
              4.1 Listed in Accompanying Letter:
            </span>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-700">
              <li>Mayor’s Permit</li>
              <li>DTI / SEC Certificate</li>
              <li>Contractor’s Certificate (Specialty, Project, if any)</li>
              <li>Latest PhilGEPS Registration</li>
              <li>Tax Clearance Certificate</li>
              <li>Certificate of Exclusive Distributorship (if available)</li>
              <li>PCAB License (for contractors)</li>
              <li>DBP Account</li>
            </ul>
          </div>

          {/* 4.2 Listed in SI Sheet */}
          <div className="bg-white/80 p-3 rounded-lg border border-amber-200 space-y-1">
            <span className="font-bold text-slate-900 block text-[11px]">
              4.2 Listed in SI Sheet Checklist:
            </span>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-700">
              <li>PhilGEPS Certificate with RED / PLATINUM membership</li>
              <li>DTI Registration Certificate</li>
              <li>Tax Clearance Certificate</li>
              <li>Certificate of Exclusive Distributorship (if available)</li>
              <li>PCAB License (for contractors)</li>
              <li>Company Profile</li>
              <li>Foreign-government reciprocity certification (for foreign suppliers)</li>
              <li>Others (e.g., Joint Venture Agreement) — specify</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION 5 CALLOUT: FORMAT, SIZE LIMITS & STORAGE RULES (Mandatory from PDF Page 3) */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900">Upload Format, Size Limit & Isolation Rules:</span>
            <p className="text-slate-600">
              <strong>Allowed Formats:</strong> PDF, JPG, PNG &nbsp;•&nbsp; <strong>Size Limit:</strong> Max 10 MB per file &nbsp;•&nbsp; <strong>Storage:</strong> Ownership-isolated private storage. Extension & MIME validation enforced.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenHelp}
          className="text-xs text-blue-800 hover:text-blue-950 underline font-bold shrink-0 whitespace-nowrap cursor-pointer"
        >
          View TSAD Guidelines
        </button>
      </div>

      {/* DOCUMENT CHECKLIST MATRIX */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800">
            Applicable Documentary Requirements Matrix
          </h2>
          <span className="text-[11px] text-slate-500">
            Certified True Copies
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {supplier.documents.map((doc, idx) => (
            <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  doc.attached ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {doc.attached ? <CheckCircle2 className="w-5 h-5 text-emerald-700" /> : <FileText className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-900 flex flex-wrap items-center gap-2">
                    <span>{idx + 1}. {doc.name}</span>
                    {doc.required ? (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Mandatory
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        Conditional / If Available
                      </span>
                    )}
                    {doc.category === 'INFRASTRUCTURE' && (
                      <span className="text-[10px] text-indigo-800 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                        Infrastructure Contractors
                      </span>
                    )}
                  </div>

                  {doc.attached ? (
                    <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="font-mono text-blue-900 font-semibold">{doc.fileName}</span>
                      <span>({doc.fileSize || '1.8 MB'})</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-medium">Uploaded {doc.uploadedAt || '2026-03-28'}</span>
                      {doc.referenceNumber && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-slate-500">Ref: {doc.referenceNumber}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="text-slate-500">Certified True Copy: Yes</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400">
                      No document attached. Permitted formats: PDF, JPG, PNG (Max 10 MB).
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                {doc.attached && (
                  <>
                    {/* Clearly Labeled "View Document" */}
                    <button
                      type="button"
                      onClick={() => setViewingDoc(doc)}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 cursor-pointer shadow-xs"
                      title="View complete document (all pages)"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-700" />
                      <span>View Document</span>
                    </button>

                    {/* Clearly Labeled "Download" */}
                    <button
                      type="button"
                      onClick={() => setViewingDoc(doc)}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 cursor-pointer shadow-xs"
                      title="Download document copy"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-700" />
                      <span>Download</span>
                    </button>

                    {/* Clearly Labeled "Print" */}
                    <button
                      type="button"
                      onClick={() => setViewingDoc(doc)}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 cursor-pointer shadow-xs"
                      title="Print certified document with all pages or page range"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Print</span>
                    </button>

                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(doc.id)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  disabled={!isEditable}
                  onClick={() => handleOpenFileModal(doc)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    doc.attached
                      ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-[#0a4f94] hover:bg-[#083e75] text-white shadow-xs'
                  } ${!isEditable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{doc.attached ? 'Replace File' : 'Upload File'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* UPLOAD MODAL WITH 10 MB AND FORMAT VALIDATION */}
      {selectedDocId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-[#0a3560] flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#0a4f94]" />
                  Upload Certified True Copy
                </h3>
                <p className="text-[11px] text-slate-500">
                  Target: {supplier.documents.find(d => d.id === selectedDocId)?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedDocId(null)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error or Success banners */}
            {uploadError && (
              <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}
            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Format Notice */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">Required Format and Size Limits:</span>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <div>• Accepted Formats: <strong>PDF, JPG, PNG</strong></div>
                <div>• File Size Limit: <strong>Maximum 10 MB per file</strong></div>
                <div>• Content Rule: Must be legible certified true copy with official seals/numbers</div>
              </div>
            </div>

            {/* File Input */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">
                Select File (or specify name):
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={handleSimulateFileUpload}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0a4f94] file:text-white hover:file:bg-[#083e75] file:cursor-pointer cursor-pointer border border-slate-300 rounded-lg p-1.5"
              />
              <div className="text-[10px] text-slate-500 font-mono">
                Current selected: {fileInputName} ({simulatedSizeMb} MB)
              </div>
            </div>

            {/* Reference Number */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">
                Official Document / Certificate Registration Number:
              </label>
              <input
                type="text"
                value={fileInputRefNo}
                onChange={(e) => setFileInputRefNo(e.target.value)}
                placeholder="e.g., TCC-2026-0881, PCAB-48190, or BC-MP-2026-04921"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
              />
            </div>

            {/* Certified True Copy Checkbox */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCertifiedTrueCopy}
                  onChange={(e) => setIsCertifiedTrueCopy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#0a4f94]"
                />
                <span className="font-semibold text-blue-950 text-xs">
                  I certify that this file is an authentic and certified true copy of the official document.
                </span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedDocId(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="px-5 py-2 bg-[#0a4f94] hover:bg-[#083e75] disabled:opacity-50 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Uploading to Secure Storage...</span>
                  </>
                ) : (
                  <span>Attach & Save File</span>
                )}
              </button>
            </div>
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
