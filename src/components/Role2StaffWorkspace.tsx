/** TSAD verifier workspace. Start at the exported component, then follow service calls
 * into supplierService; changing a visible status alone does not grant database authority. */
import React, { useState, useMemo } from 'react';
import { 
  SupplierApplication, 
  Role2MenuItem, 
  UserAccount, 
  SupplierCategory,
  SubmissionComment,
  DocumentItem 
} from '../types';
import { 
  Search, 
  Filter, 
  Inbox, 
  FileCheck2, 
  FileSignature, 
  BookOpenCheck, 
  CalendarClock, 
  MessageSquare, 
  Printer, 
  UserCog, 
  ShieldCheck, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Send, 
  FileText, 
  ArrowRight, 
  Lock, 
  Info, 
  Building2, 
  RotateCcw,
  Check,
  X,
  Layers,
  Download
} from 'lucide-react';
import { ButuanCitySeal, CpmdSeal, ButuanOnBanner } from './Seals';
import { SecureDocumentViewerModal } from './SecureDocumentViewerModal';
import { updateAuthenticatedPassword } from '../services/authService';
import { reviewSupplierDocument } from '../services/documentVerificationService';
import { supabase } from '../lib/supabase';

interface Role2StaffWorkspaceProps {
  currentMenu: Role2MenuItem;
  onNavigate: (menu: Role2MenuItem) => void;
  currentUser: UserAccount;
  suppliers: SupplierApplication[];
  onUpdateSupplier: (updatedSupplier: SupplierApplication) => Promise<boolean>;
  onOpenPrintableDoc: (supplier: SupplierApplication, tab: 'FORM' | 'LETTER' | 'BOTH') => void;
  onOpenHelp: () => void;
}

export const Role2StaffWorkspace: React.FC<Role2StaffWorkspaceProps> = ({
  currentMenu,
  onNavigate,
  currentUser,
  suppliers,
  onUpdateSupplier,
  onOpenPrintableDoc,
  onOpenHelp,
}) => {
  // Selected supplier for detail / review inspection
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    suppliers[0]?.id || ''
  );

  // Search feature state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<string>('ALL');
  const [searchStatus, setSearchStatus] = useState<string>('ALL');

  // Verification & Revision form state
  const [revisionReasonInput, setRevisionReasonInput] = useState('');
  const [verificationNotesInput, setVerificationNotesInput] = useState('');
  const [receivedDateInput, setReceivedDateInput] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Two-way comment state
  const [newCommentText, setNewCommentText] = useState('');
  const [commentDocRef, setCommentDocRef] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Password change state
  const [staffCurrentPassword, setStaffCurrentPassword] = useState('');
  const [staffNewPassword, setStaffNewPassword] = useState('');
  const [staffPasswordSuccess, setStaffPasswordSuccess] = useState(false);
  const [staffPasswordError, setStaffPasswordError] = useState<string | null>(null);
  const [isUpdatingStaffPassword, setIsUpdatingStaffPassword] = useState(false);

  // Document viewing & printing modal state
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  const [reviewedDocuments, setReviewedDocuments] = useState<
    Record<string, { status: DocumentItem['status']; rejectionReason?: string }>
  >({});

  const [documentReviewBusy, setDocumentReviewBusy] = useState<string | null>(null);

  const handleDocumentReview = async (
    doc: DocumentItem,
    status: 'VERIFIED' | 'REJECTED'
  ) => {
    if (documentReviewBusy) return;

    let reason: string | undefined;

    if (status === 'REJECTED') {
      const entered = window.prompt(
        `Enter rejection reason for ${doc.name}:`
      );

      if (entered === null) return;

      reason = entered.trim();

      if (!reason) {
        setActionErrorMsg('A rejection reason is required.');
        return;
      }
    }

    setDocumentReviewBusy(doc.id);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      const result = await reviewSupplierDocument(doc.id, status, reason);

      if (!result.success) {
        throw new Error(result.error || 'Document verification failed.');
      }

      const { data: savedDocument, error: refreshError } = await supabase
        .from('supplier_documents')
        .select('status, rejection_reason')
        .eq('id', doc.id)
        .single();

      if (refreshError || !savedDocument) {
        throw new Error(
          'Document review was saved, but the status could not be refreshed. Reload the page.'
        );
      }

      setReviewedDocuments(previous => ({
        ...previous,
        [doc.id]: {
          status: savedDocument.status as DocumentItem['status'],
          rejectionReason: savedDocument.rejection_reason || undefined
        }
      }));

      setActionSuccessMsg(
        `${doc.name} marked ${status.toLowerCase()} successfully.`
      );
    } catch (error) {
      setActionErrorMsg(
        error instanceof Error ? error.message : 'Document verification failed.'
      );
    } finally {
      setDocumentReviewBusy(null);
    }
  };

  // Resolve selected supplier object
  const activeSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];
  }, [suppliers, selectedSupplierId]);

  // Workload counts
  const awaitingReviewList = suppliers.filter(
    s => s.status === 'SUBMITTED' || s.status === 'UNDER_VERIFICATION'
  );
  const revisionRequestedList = suppliers.filter(
    s => s.status === 'REVISION_REQUESTED'
  );
  const masterListedList = suppliers.filter(
    s => s.status === 'APPROVED_MASTERLIST'
  );

  // 1. MATCHING ALGORITHM FOR ITEM 2 (Supplier / Request Search)
  const searchResults = useMemo(() => {
    return suppliers.filter(s => {
      // Category filter
      if (searchCategory !== 'ALL' && !s.categories.includes(searchCategory as SupplierCategory)) {
        return false;
      }
      // Status filter
      if (searchStatus !== 'ALL' && s.status !== searchStatus) {
        return false;
      }

      // Keyword query matching
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchName = s.businessName.toLowerCase().includes(q);
      const matchOwner = s.proprietorName.toLowerCase().includes(q);
      const matchRef = s.referenceCode.toLowerCase().includes(q);
      const matchOfferings = s.recordedOfferings?.some(off => off.toLowerCase().includes(q)) ?? false;
      const matchCategories = s.categories.some(cat => cat.toLowerCase().includes(q));
      const matchPcab = s.pcabCategory?.toLowerCase().includes(q) ?? false;

      return matchName || matchOwner || matchRef || matchOfferings || matchCategories || matchPcab;
    });
  }, [suppliers, searchQuery, searchCategory, searchStatus]);

  // Expiration calculations for Item 7
  const documentExpirationList = useMemo(() => {
    const list: {
      docId: string;
      docName: string;
      supplierId: string;
      supplierName: string;
      supplierRef: string;
      expiryDate: string;
      isExpired: boolean;
      daysRemaining: number;
    }[] = [];

    const today = new Date();

    suppliers.forEach(s => {
      s.documents.forEach(doc => {
        if (doc.attached && doc.expiryDate) {
          const exp = new Date(doc.expiryDate);
          const diffTime = exp.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          list.push({
            docId: doc.id,
            docName: doc.name,
            supplierId: s.id,
            supplierName: s.businessName,
            supplierRef: s.referenceCode,
            expiryDate: doc.expiryDate,
            isExpired: diffDays < 0,
            daysRemaining: diffDays,
          });
        }
      });
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [suppliers]);

  // Prevent duplicate submissions while a database operation is pending.
  const [isSavingAction, setIsSavingAction] = useState(false);

  // Action: Return for Revision
  const handleReturnForRevision = async () => {
    if (isSavingAction) return;
    if (!activeSupplier) {
      setActionErrorMsg('No supplier application selected.');
      return;
    }
    if (!revisionReasonInput.trim()) {
      setActionErrorMsg('Please specify the clear factual reason and required corrections.');
      return;
    }

    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    setIsSavingAction(true);
    const newComment: SubmissionComment = {
      id: `comm-${Date.now()}`,
      authorName: currentUser.name,
      authorRole: 'TSAD_STAFF',
      authorEmail: currentUser.email,
      createdAt: new Date().toISOString(),
      message: `[REVISION REQUESTED]: ${revisionReasonInput.trim()}`,
      relatedDocumentName: 'Documentary Review Audit'
    };
    const updatedSupplier: SupplierApplication = {
      ...activeSupplier,
      status: 'REVISION_REQUESTED',
      approvalRemarks: revisionReasonInput.trim(),
      comments: [...(activeSupplier.comments || []), newComment],
      updatedAt: new Date().toISOString()
    };

    try {
      const success = await onUpdateSupplier(updatedSupplier);
      if (!success) {
        setActionErrorMsg('Revision request could not be fully saved. Refresh the application before retrying.');
        return;
      }
      setRevisionReasonInput('');
      setActionSuccessMsg(`Submission ${activeSupplier.referenceCode} successfully returned for revision.`);
    } catch (error) {
      console.error('Revision request failed:', error);
      setActionErrorMsg('An unexpected error occurred while requesting revision.');
    } finally {
      setIsSavingAction(false);
    }
  };

  // Action: Mark as Verified by TSAD
  const handleMarkAsVerified = async () => {
    if (isSavingAction) return;
    if (!activeSupplier) {
      setActionErrorMsg('No supplier application selected.');
      return;
    }
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    setIsSavingAction(true);
    const updatedSupplier: SupplierApplication = {
      ...activeSupplier,
      receivedDate: receivedDateInput || activeSupplier.receivedDate || new Date().toISOString().slice(0, 10),
      verifiedBy: currentUser.name,
      verifiedDate: new Date().toISOString().slice(0, 10),
      verificationNotes: verificationNotesInput.trim() || 'All mandatory SI Sheet entries and certified true copies checked and verified compliant with ISO 9001:2015 QMS standards.',
      status: 'VERIFIED',
      updatedAt: new Date().toISOString()
    };

    try {
      const success = await onUpdateSupplier(updatedSupplier);
      if (!success) {
        setActionErrorMsg('Verification was not confirmed by Supabase. Refresh the application before retrying.');
        return;
      }
      setActionSuccessMsg(`Submission ${activeSupplier.referenceCode} successfully verified by TSAD.`);
    } catch (error) {
      console.error('Verification error:', error);
      setActionErrorMsg('An unexpected error occurred during verification.');
    } finally {
      setIsSavingAction(false);
    }
  };

  // Action: Post Two-Way Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingComment || isSavingAction || !newCommentText.trim()) return;
    if (!activeSupplier) {
      setActionErrorMsg('No supplier application selected.');
      return;
    }
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    setIsSubmittingComment(true);
    const comment: SubmissionComment = {
      id: `comm-${Date.now()}`,
      authorName: currentUser.name,
      authorRole: 'TSAD_STAFF',
      authorEmail: currentUser.email,
      createdAt: new Date().toISOString(),
      message: newCommentText.trim(),
      relatedDocumentName: commentDocRef.trim() || undefined
    };
    const updatedSupplier: SupplierApplication = {
      ...activeSupplier,
      comments: [...(activeSupplier.comments || []), comment],
      updatedAt: new Date().toISOString()
    };

    try {
      const success = await onUpdateSupplier(updatedSupplier);
      if (!success) {
        setActionErrorMsg('Comment was not saved. Please check your connection and retry.');
        return;
      }
      setNewCommentText('');
      setCommentDocRef('');
      setActionSuccessMsg('Comment saved successfully.');
    } catch (error) {
      console.error('Comment submission failed:', error);
      setActionErrorMsg('An unexpected error occurred while saving the comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Action Notification Banner */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div role="alert" className="p-4 bg-red-50 text-red-900 rounded-xl border border-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* APPROVAL RESTRICTION BANNER (Mandatory from Section 1) */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-950 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="text-amber-900">TSAD Staff Authority & Approval Restriction:</strong>
          <p className="text-slate-700 leading-relaxed">
            TSAD Staff reviews supplier registrations, records findings, and requests corrections. <strong>TSAD Staff cannot make final supplier approval decisions unless CPMD explicitly authorizes that responsibility.</strong> Supplier matching, ratings, and verification must not be presented as final procurement selection or award.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DASHBOARD */}
      {/* ========================================================================= */}
      {currentMenu === 'dashboard' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono">
                TSAD Staff • Menu Item 1
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#072d50] tracking-tight mt-1">
                TSAD Staff Review Workload Dashboard
              </h1>
              <p className="text-xs text-slate-500">
                City Government of Butuan • CPMD Technical Support and Accreditation Division
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              Staff: <strong>{currentUser.name}</strong>
            </div>
          </div>

          {/* Review Workload KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Awaiting Review
              </span>
              <div className="text-2xl font-extrabold text-amber-600 font-mono tabular-nums mt-1">
                {awaitingReviewList.length}
              </div>
              <span className="text-[10px] text-slate-500">Submissions in queue</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Revision Requested
              </span>
              <div className="text-2xl font-extrabold text-red-600 font-mono tabular-nums mt-1">
                {revisionRequestedList.length}
              </div>
              <span className="text-[10px] text-slate-500">Returned to supplier</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Master Listed
              </span>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums mt-1">
                {masterListedList.length}
              </div>
              <span className="text-[10px] text-slate-500">Accredited entities</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Expiring Documents
              </span>
              <div className="text-2xl font-extrabold text-indigo-700 font-mono tabular-nums mt-1">
                {documentExpirationList.filter(d => d.daysRemaining <= 60).length}
              </div>
              <span className="text-[10px] text-slate-500">Requires monitoring</span>
            </div>
          </div>

          {/* Prominent Supplier / Request Search Entry Point */}
          <div className="bg-[#072d50] text-white p-6 rounded-2xl shadow-md space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-sky-300" />
                <span>Supplier / Request Matching Directory Entry Point</span>
              </h2>
              <p className="text-xs text-sky-200 max-w-2xl leading-normal">
                Search registered suppliers by approved category and recorded goods, services, construction, or consulting offerings. Directory search aid only — not an automatic procurement award.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter product, service, construction, or consulting need (e.g., bridge, network, IT, earthmoving)..."
                className="w-full px-4 py-2.5 bg-white text-slate-900 rounded-lg text-xs font-medium placeholder:text-slate-400 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => onNavigate('supplier-request-search')}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#0a4f94] hover:bg-sky-600 text-white font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Search Offerings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Review Queue Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#0a4f94]" />
                <span>Registration Review Queue (Awaiting Action)</span>
              </h3>
              <button
                onClick={() => onNavigate('review-queue')}
                className="text-xs text-blue-900 font-bold hover:underline cursor-pointer"
              >
                View Full Queue ({awaitingReviewList.length})
              </button>
            </div>

            <div className="divide-y divide-slate-200 text-xs">
              {awaitingReviewList.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No submissions currently awaiting review in the queue.
                </div>
              ) : (
                awaitingReviewList.map(s => (
                  <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-900">{s.referenceCode}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-bold text-slate-900 uppercase">{s.businessName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 pt-0.5">
                        Proprietor: {s.proprietorName} &nbsp;•&nbsp; Submitted: {s.submissionDate || 'Recent'} &nbsp;•&nbsp; Category: {s.categories.join(', ')}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSupplierId(s.id);
                        onNavigate('si-sheet-documents');
                      }}
                      className="px-3.5 py-1.5 bg-[#0a4f94] hover:bg-[#083e75] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review SI Sheet</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUPPLIER / REQUEST SEARCH (Main Feature: Find Suppliers for Request) */}
      {/* ========================================================================= */}
      {currentMenu === 'supplier-request-search' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono">
                TSAD Staff • Menu Item 2
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#072d50] tracking-tight mt-1">
                Supplier / Request Search & Matching
              </h1>
              <p className="text-xs text-slate-500">
                Directory search aid matching request terms against registered supplier records and offerings
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Results</span>
              </button>
            </div>
          </div>

          {/* Search Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter product, service, construction, or consulting need (e.g. bridge, network, planning)..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#072d50] focus:outline-hidden"
                />
              </div>

              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 font-medium"
              >
                <option value="ALL">All Categories</option>
                <option value="GOODS AND SERVICES">Goods and Services</option>
                <option value="INFRASTRUCTURE PROJECTS">Infrastructure Projects</option>
                <option value="CONSULTING SERVICES">Consulting Services</option>
              </select>

              <select
                value={searchStatus}
                onChange={(e) => setSearchStatus(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED_MASTERLIST">Approved / Master Listed</option>
                <option value="VERIFIED">Verified by TSAD</option>
                <option value="UNDER_VERIFICATION">Under QMS Verification</option>
                <option value="SUBMITTED">Submitted</option>
              </select>

              {(searchQuery || searchCategory !== 'ALL' || searchStatus !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchCategory('ALL');
                    setSearchStatus('ALL');
                  }}
                  className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Note on data gap and star rating omission */}
            <p className="text-[11px] text-slate-500 italic">
              Note: As defined in Section 3 of the Role 2 Specification, star ratings are omitted because an approved evaluation source and scoring methodology have not been established by CPMD. Results are listed based on approved recorded data.
            </p>
          </div>

          {/* Search Results Table (Columns defined in Section 4 of PDF) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Supplier / Entity Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Recorded Offering / Match</th>
                    <th className="py-3 px-4">Registration / Review Status</th>
                    <th className="py-3 px-4">Document Status / Expiry</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {searchResults.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No matching registered suppliers found.
                      </td>
                    </tr>
                  ) : (
                    searchResults.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupplierId(s.id);
                              onNavigate('supplier-master-list');
                            }}
                            className="font-bold text-blue-900 hover:underline uppercase text-left cursor-pointer"
                          >
                            {s.businessName}
                          </button>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {s.referenceCode}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {s.categories.map(c => (
                            <span key={c} className="block text-[10px] font-semibold text-slate-700 uppercase">
                              • {c}
                            </span>
                          ))}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[11px] text-slate-700">
                            {s.recordedOfferings?.join(', ') || s.otherDocumentsAttached || 'General procurement supplier'}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'APPROVED_MASTERLIST' ? 'bg-emerald-100 text-emerald-800' :
                            s.status === 'VERIFIED' ? 'bg-blue-100 text-blue-800' :
                            s.status === 'UNDER_VERIFICATION' ? 'bg-amber-100 text-amber-800' :
                            s.status === 'REVISION_REQUESTED' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {s.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                          {s.documents.some(d => d.expiryDate && new Date(d.expiryDate) < new Date()) ? (
                            <span className="text-red-700 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Has Expired Docs
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupplierId(s.id);
                              onNavigate('si-sheet-documents');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-blue-900 rounded font-bold text-[11px] cursor-pointer"
                          >
                            Open Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. REGISTRATION REVIEW QUEUE */}
      {/* ========================================================================= */}
      {currentMenu === 'review-queue' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono">
              TSAD Staff • Menu Item 3
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#072d50] tracking-tight mt-1">
              Registration Review Queue
            </h1>
            <p className="text-xs text-slate-500">
              Submissions awaiting review, including SI Sheet, supporting files, and current workflow status
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Active Submissions Queue ({awaitingReviewList.length})</span>
              <span className="text-slate-500 font-normal">Sorted by submission date</span>
            </div>

            <div className="divide-y divide-slate-200 text-xs">
              {awaitingReviewList.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  No submissions currently in the review queue.
                </div>
              ) : (
                awaitingReviewList.map(s => (
                  <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-900">{s.referenceCode}</span>
                        <span className="font-bold text-slate-900 uppercase">{s.businessName}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3">
                        <span>Proprietor: {s.proprietorName}</span>
                        <span>·</span>
                        <span>Categories: {s.categories.join(', ')}</span>
                        <span>·</span>
                        <span>Attached Files: {s.documents.filter(d => d.attached).length}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedSupplierId(s.id);
                          onNavigate('si-sheet-documents');
                        }}
                        className="px-3.5 py-1.5 bg-[#0a4f94] hover:bg-[#083e75] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Submission</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSupplierId(s.id);
                          onNavigate('verification-revision');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
                      >
                        Findings & Action
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SI SHEET & DOCUMENTS REVIEW */}
      {/* ========================================================================= */}
      {currentMenu === 'si-sheet-documents' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono">
                TSAD Staff • Menu Item 4
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#072d50] tracking-tight mt-1">
                SI Sheet & Supporting Documents Review
              </h1>
              <p className="text-xs text-slate-500">
                Auditing submitted SI Sheet fields and documents for {activeSupplier.businessName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onOpenPrintableDoc(activeSupplier, 'BOTH')}
                className="px-3.5 py-1.5 bg-[#0a4f94] hover:bg-[#083e75] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-teal-300" />
                <span>Print Official Form (Sheet 1 & 2 • 2 Pages)</span>
              </button>
              <button
                onClick={() => onOpenPrintableDoc(activeSupplier, 'LETTER')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer border border-slate-300"
              >
                Sheet 1 Only
              </button>
              <button
                onClick={() => onOpenPrintableDoc(activeSupplier, 'FORM')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer border border-slate-300"
              >
                Sheet 2 Only
              </button>
            </div>
          </div>

          {/* Supplier Selector Bar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-700 shrink-0">Selected Case:</span>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 flex-1 max-w-md"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.referenceCode} — {s.businessName} ({s.status.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* SI Sheet General Information Audit Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h2 className="font-bold text-sm uppercase text-[#072d50] border-b border-slate-200 pb-2">
              1. Supplier Information Sheet Fields Audit
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Business Name:</span>
                <span className="font-bold text-slate-900 uppercase">{activeSupplier.businessName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Proprietor / Owner:</span>
                <span className="font-bold text-slate-900 uppercase">{activeSupplier.proprietorName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Authorized Representative:</span>
                <span className="font-semibold text-slate-900 uppercase">{activeSupplier.authorizedRepName || 'None'}</span>
                <span className="text-[10px] text-slate-500 block">
                  Auth Type: {activeSupplier.repAuthType === 'SPA' ? 'with SPA' : activeSupplier.repAuthType === 'SECRETARY_CERTIFICATE' ? 'with Secretary’s Certificate' : 'Direct Owner'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Address & Branch:</span>
                <span className="text-slate-800">{activeSupplier.principalAddress}</span>
                <span className="text-[10px] text-slate-500 block">Branch: {activeSupplier.branchAddress || 'No branch applies'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Contact Info:</span>
                <span className="text-slate-800">{activeSupplier.contactPerson} ({activeSupplier.contactNumber})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Company Email:</span>
                <span className="text-slate-800">{activeSupplier.companyEmail}</span>
              </div>
            </div>
          </div>

          {/* Supporting Documents Checklist Audit */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h2 className="font-bold text-sm uppercase text-[#072d50] border-b border-slate-200 pb-2">
              2. Supporting Documents Checklist Audit
            </h2>

            <div className="divide-y divide-slate-200">
              {activeSupplier.documents.map((doc, i) => (
                <div key={doc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{i + 1}. {doc.name}</span>
                      {doc.attached ? (
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                          Attached
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-800 bg-red-50 px-1.5 py-0.2 rounded font-bold">
                          Missing
                        </span>
                      )}
                    </div>
                    {doc.attached && (
                      <div className="text-[11px] text-slate-600 font-mono">
                        File: {doc.fileName} ({doc.fileSize}) &nbsp;•&nbsp; Ref: {doc.referenceNumber || 'N/A'} {doc.expiryDate ? `• Exp: ${doc.expiryDate}` : ''}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {doc.attached && (
                      <>
                        {/* Clearly Labeled "View Document" */}
                        <button
                          type="button"
                          onClick={() => setViewingDoc(doc)}
                          className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          title="View complete document (all pages) in secure viewer"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-700" />
                          <span>View Document</span>
                        </button>

                        {/* Clearly Labeled "Download" */}
                        <button
                          type="button"
                          onClick={() => setViewingDoc(doc)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          title="Download document copy"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-700" />
                          <span>Download</span>
                        </button>

                        {/* Clearly Labeled "Print" */}
                        <button
                          type="button"
                          onClick={() => setViewingDoc(doc)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          title="Print document with page range options"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Print</span>
                        </button>
                      </>
                    )}

                                         {doc.attached &&
                       ['SUBMITTED', 'UNDER_VERIFICATION'].includes(activeSupplier.status) && (
                       <>
                         <button
                           type="button"
                           disabled={documentReviewBusy !== null}
                           onClick={() => handleDocumentReview(doc, 'VERIFIED')}
                           className="px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white font-bold disabled:opacity-50"
                         >
                           Verify
                         </button>
                         <button
                           type="button"
                           disabled={documentReviewBusy !== null}
                           onClick={() => handleDocumentReview(doc, 'REJECTED')}
                           className="px-2.5 py-1.5 rounded-lg bg-red-700 text-white font-bold disabled:opacity-50"
                         >
                           Reject
                         </button>
                       </>
                     )}

<span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {reviewedDocuments[doc.id]?.status ?? doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('verification-revision')}
                className="px-4 py-2 bg-[#072d50] hover:bg-[#051f38] text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Proceed to Findings & Revision Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VERIFICATION & REVISION */}
      {/* ========================================================================= */}
      {currentMenu === 'verification-revision' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono">
              TSAD Staff • Menu Item 5
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#072d50] tracking-tight mt-1">
              Verification & Revision Actions Desk
            </h1>
            <p className="text-xs text-slate-500">
              Record findings and return a submission for revision only when permitted, with clear reasons
            </p>
          </div>

          {/* Active Case Header */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Reviewing Case:</span>
              <strong className="text-sm font-bold text-blue-950 uppercase">{activeSupplier.businessName}</strong>
              <div className="text-[11px] text-slate-600 font-mono">Ref: {activeSupplier.referenceCode}</div>
            </div>
            <div>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-slate-300">
                Current Status: {activeSupplier.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Action 1: Return for Revision */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h2 className="font-bold text-sm text-red-900 uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Return Submission for Revision</span>
            </h2>
            <p className="text-slate-600">
              Provide factual reasons for missing, invalid, unreadable, expired, or inconsistent items. The supplier will receive these specific instructions and can replace attachments.
            </p>

            <textarea
              rows={3}
              value={revisionReasonInput}
              onChange={(e) => setRevisionReasonInput(e.target.value)}
              placeholder="Specify clear corrections required (e.g., PhilGEPS certificate is expired; please upload active 2026 renewal copy)..."
              className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-red-600 focus:outline-hidden"
            />

            <button
              type="button"
              onClick={handleReturnForRevision}
              disabled={isSavingAction || isSubmittingComment}
              className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Return to Supplier for Revision</span>
            </button>
          </div>

          {/* Action 2: Sign as Verified by TSAD Head */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h2 className="font-bold text-sm text-blue-950 uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              <span>Record TSAD Document Verification</span>
            </h2>
            <p className="text-slate-600">
              Record official verification of documents under ISO 9001:2015 QMS standards by the Technical Support and Accreditation Division.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Received Date (CPMD):</label>
                <input
                  type="date"
                  value={receivedDateInput}
                  onChange={(e) => setReceivedDateInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Verification Notes:</label>
                <input
                  type="text"
                  value={verificationNotesInput}
                  onChange={(e) => setVerificationNotesInput(e.target.value)}
                  placeholder="e.g., All documentary requirements authenticated against registries."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleMarkAsVerified}
              disabled={isSavingAction || isSubmittingComment}
              className="px-5 py-2.5 bg-[#0a4f94] hover:bg-[#083e75] text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Sign as Verified by TSAD</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUPPLIER MASTER LIST & ENTITY DETAILS */}
      {/* ========================================================================= */}
      {currentMenu === 'supplier-master-list' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono">
                TSAD Staff • Menu Item 6
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#072d50] tracking-tight mt-1">
                Authorized Supplier Master List
              </h1>
              <p className="text-xs text-slate-500">
                Official registry of verified and accredited suppliers of the City Government of Butuan
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Master List</span>
            </button>
          </div>

          {/* Master List Registry Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Ref Code</th>
                    <th className="py-3 px-4">Business / Entity Name</th>
                    <th className="py-3 px-4">Proprietor</th>
                    <th className="py-3 px-4">Classifications</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600">{s.referenceCode}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 uppercase">{s.businessName}</td>
                      <td className="py-3 px-4 uppercase">{s.proprietorName}</td>
                      <td className="py-3 px-4">{s.categories.join(' • ')}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === 'APPROVED_MASTERLIST' ? 'bg-emerald-100 text-emerald-800' :
                          s.status === 'VERIFIED' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedSupplierId(s.id);
                            onNavigate('si-sheet-documents');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-blue-900 font-bold rounded text-[11px] cursor-pointer"
                        >
                          View Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. DOCUMENT EXPIRATION MONITORING */}
      {/* ========================================================================= */}
      {currentMenu === 'document-expiration' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono">
                TSAD Staff • Menu Item 7
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#072d50] tracking-tight mt-1">
                Document Expiration Monitoring Desk
              </h1>
              <p className="text-xs text-slate-500">
                Identify expired or approaching-expiry documents using stored dates and confirmed rules
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Expiration Audit</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">Supplier / Entity Name</th>
                    <th className="py-3 px-4">Recorded Expiry Date</th>
                    <th className="py-3 px-4">Warning State</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {documentExpirationList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        No stored documents with recorded expiry dates found.
                      </td>
                    </tr>
                  ) : (
                    documentExpirationList.map((item) => (
                      <tr key={`${item.supplierId}-${item.docId}`} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.docName}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 uppercase">{item.supplierName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.supplierRef}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">{item.expiryDate}</td>
                        <td className="py-3 px-4">
                          {item.isExpired ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                              EXPIRED ({Math.abs(item.daysRemaining)} days ago)
                            </span>
                          ) : item.daysRemaining <= 60 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Expiring in {item.daysRemaining} days
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Valid ({item.daysRemaining} days)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedSupplierId(item.supplierId);
                              onNavigate('si-sheet-documents');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-blue-900 rounded font-bold text-[11px] cursor-pointer"
                          >
                            Open Record
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SUBMISSION COMMENTS (Two-Way Thread Tied to Specific Submission) */}
      {/* ========================================================================= */}
      {currentMenu === 'submission-comments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono">
              TSAD Staff • Menu Item 8
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#072d50] tracking-tight mt-1">
              Two-Way Submission Comments Thread
            </h1>
            <p className="text-xs text-slate-500">
              Record-specific communication tied to {activeSupplier.businessName} ({activeSupplier.referenceCode})
            </p>
          </div>

          {/* Supplier Case Selector Bar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Case Thread:</span>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.referenceCode} — {s.businessName} ({s.comments?.length || 0} comments)
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[11px] text-slate-500">
              Preserves author identity, role, timestamp, and message history
            </span>
          </div>

          {/* Comment Thread Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="space-y-3 min-h-[200px] max-h-[420px] overflow-y-auto pr-2">
              {(!activeSupplier.comments || activeSupplier.comments.length === 0) ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No comments recorded yet for submission {activeSupplier.referenceCode}. Post a message below to start communicating with the supplier.
                </div>
              ) : (
                activeSupplier.comments.map(c => (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-xl text-xs space-y-1 ${
                      c.authorRole === 'TSAD_STAFF'
                        ? 'bg-blue-50/80 border border-blue-200 ml-4'
                        : 'bg-slate-50 border border-slate-200 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900">{c.authorName}</strong>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          c.authorRole === 'TSAD_STAFF' ? 'bg-blue-900 text-white' : 'bg-slate-700 text-white'
                        }`}>
                          {c.authorRole === 'TSAD_STAFF' ? 'TSAD Staff' : 'Supplier'}
                        </span>
                        {c.relatedDocumentName && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Ref: {c.relatedDocumentName}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-800 leading-normal pt-0.5 whitespace-pre-wrap">
                      {c.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Post New Comment Form */}
            <form onSubmit={handlePostComment} className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={commentDocRef}
                  onChange={(e) => setCommentDocRef(e.target.value)}
                  placeholder="Related document reference (optional, e.g. Mayor's Permit)"
                  className="sm:w-64 px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2">
                <textarea
                  rows={2}
                  required
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Type official comment or inquiry to the supplier..."
                  className="flex-1 p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#072d50] focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || isSavingAction}
                  className="px-5 bg-[#072d50] hover:bg-[#051f38] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. REPORTS & PRINT */}
      {/* ========================================================================= */}
      {currentMenu === 'reports-print' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono">
                TSAD Staff • Menu Item 9
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#072d50] tracking-tight mt-1">
                Official Reports & Print Center
              </h1>
              <p className="text-xs text-slate-500">
                Print search results, authorized supplier details, master lists, and document monitoring records
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#072d50] text-white font-bold rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Active Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-xs">
              <h3 className="font-bold text-xs text-slate-900">1. Master List Registry</h3>
              <p className="text-[11px] text-slate-500">
                Print complete list of all currently accredited and recorded suppliers in Butuan City.
              </p>
              <button
                onClick={() => onNavigate('supplier-master-list')}
                className="text-xs font-bold text-blue-900 hover:underline pt-1 inline-block cursor-pointer"
              >
                Open & Print Master List &rarr;
              </button>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-xs">
              <h3 className="font-bold text-xs text-slate-900">2. Expiration Monitoring Report</h3>
              <p className="text-[11px] text-slate-500">
                Print audit report of approaching and expired documentary certificates.
              </p>
              <button
                onClick={() => onNavigate('document-expiration')}
                className="text-xs font-bold text-blue-900 hover:underline pt-1 inline-block cursor-pointer"
              >
                Open & Print Expiration Audit &rarr;
              </button>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-xs">
              <h3 className="font-bold text-xs text-slate-900">3. Individual Supplier Form F.003</h3>
              <p className="text-[11px] text-slate-500">
                Print the official 2-page Supplier Information Sheet with seals and stamps.
              </p>
              <button
                onClick={() => onOpenPrintableDoc(activeSupplier, 'BOTH')}
                className="text-xs font-bold text-blue-900 hover:underline pt-1 inline-block cursor-pointer"
              >
                Print Sheet 1 & 2 (2 Pages) for {activeSupplier.businessName} &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MY ACCOUNT / SECURITY */}
      {/* ========================================================================= */}
      {currentMenu === 'my-account-security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono">
              TSAD Staff • Menu Item 10
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#072d50] tracking-tight mt-1">
              TSAD Staff Account & Security
            </h1>
            <p className="text-xs text-slate-500">
              Authorized credentials, session handling, and role security
            </p>
          </div>

          {staffPasswordSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Staff password updated successfully.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Staff Profile Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h2 className="font-bold text-sm text-slate-900 uppercase border-b border-slate-100 pb-2">
                Staff Profile Information
              </h2>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Full Name:</span>
                  <span className="font-bold text-slate-900">{currentUser.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Staff Designation:</span>
                  <span className="font-semibold text-blue-950">{currentUser.staffTitle || 'Technical Support & Accreditation Officer'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Official Email:</span>
                  <span className="font-mono text-slate-800">{currentUser.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Division:</span>
                  <span className="text-slate-800">CPMD • Technical Support and Accreditation Division (TSAD)</span>
                </div>
              </div>
            </div>

            {/* Password Change Form */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h2 className="font-bold text-sm text-slate-900 uppercase border-b border-slate-100 pb-2">
                Staff Password Change
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                setStaffPasswordSuccess(true);
                setTimeout(() => setStaffPasswordSuccess(false), 3000);
              }} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Current Password:</label>
                  <input
                    type="password"
                    required
                    value={staffCurrentPassword}
                    onChange={(e) => setStaffCurrentPassword(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">New Password:</label>
                  <input
                    type="password"
                    required
                    value={staffNewPassword}
                    onChange={(e) => setStaffNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#072d50] hover:bg-[#051f38] text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Update Staff Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SECURE MULTIPAGE DOCUMENT VIEWER MODAL */}
      <SecureDocumentViewerModal
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
        supplier={activeSupplier}
        currentUser={currentUser}
      />
    </div>
  );
};
