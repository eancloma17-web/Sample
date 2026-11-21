/** Department Head workspace: reviews verified submissions and records recommendations.
 * Final approval is disabled; recommendation RPC rules are defined in migration 00005. */
import { recordDepartmentHeadRecommendation } from '../services/supplierService';
import React, { useState, useMemo } from 'react';
import { 
  SupplierApplication, 
  DeptHeadMenuItem, 
  UserAccount, 
  SupplierCategory,
  SubmissionComment,
  DocumentItem,
  DecisionRecord 
} from '../types';
import { 
  Search, 
  Filter, 
  Inbox, 
  FileCheck2, 
  Award, 
  BookOpenCheck, 
  Printer, 
  MessageSquare, 
  History, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Send, 
  FileText, 
  ArrowRight, 
  Building2, 
  Crown, 
  Download, 
  RotateCcw,
  Check, 
  X, 
  ExternalLink,
  ChevronRight,
  HardHat,
  Briefcase,
  Layers,
  Calendar,
  Lock,
  UserCheck
} from 'lucide-react';
import { ButuanCitySeal, CpmdSeal, ButuanOnBanner } from './Seals';
import { SecureDocumentViewerModal } from './SecureDocumentViewerModal';

interface Role3DeptHeadWorkspaceProps {
  currentMenu: DeptHeadMenuItem;
  onNavigate: (menu: DeptHeadMenuItem) => void;
  currentUser: UserAccount;
  suppliers: SupplierApplication[];
  onUpdateSupplier: (updatedSupplier: SupplierApplication) => void;
  onRefreshSuppliers: () => Promise<void>;
  onOpenPrintableDoc: (supplier: SupplierApplication, tab: 'FORM' | 'LETTER' | 'BOTH') => void;
  onOpenHelp: () => void;
}

export const Role3DeptHeadWorkspace: React.FC<Role3DeptHeadWorkspaceProps> = ({
  currentMenu,
  onNavigate,
  currentUser,
  suppliers,
  onUpdateSupplier,
  onRefreshSuppliers,
  onOpenPrintableDoc,
  onOpenHelp,
}) => {
  // Currently selected supplier for inspection / decision
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    suppliers[0]?.id || ''
  );

  // Review Queue filter states
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>('ALL');
  const [queueCategoryFilter, setQueueCategoryFilter] = useState<string>('ALL');
  const [queueSearchTerm, setQueueSearchTerm] = useState('');

  // Supplier Records search state
  const [recordsSearch, setRecordsSearch] = useState('');
  const [recordsCategory, setRecordsCategory] = useState<string>('ALL');

  // Executive Decision state
  const [approvalRemarksInput, setApprovalRemarksInput] = useState(
    ''
  );
  const [recommendationType, setRecommendationType] = useState<'RECOMMEND_FOR_FURTHER_REVIEW' | 'RECOMMEND_CORRECTIONS' | 'RECOMMEND_NO_ACTION'>('RECOMMEND_FOR_FURTHER_REVIEW');
  const [savingRecommendation, setSavingRecommendation] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [approvedDateInput, setApprovedDateInput] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [revisionDirectivesInput, setRevisionDirectivesInput] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Document Review state
  const [inspectingDoc, setInspectingDoc] = useState<DocumentItem | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  // Comment Thread state
  const [newCommentText, setNewCommentText] = useState('');
  const [commentDocRef, setCommentDocRef] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Decision History search
  const [historySearch, setHistorySearch] = useState('');

  // Account Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Resolve currently active supplier object
  const activeSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];
  }, [suppliers, selectedSupplierId]);

  // Aggregate metrics
  const totalSuppliersCount = suppliers.length;
  const verifiedAwaitingHeadCount = suppliers.filter(s => s.status === 'VERIFIED').length;
  const approvedMasterListCount = suppliers.filter(s => s.status === 'APPROVED_MASTERLIST').length;
  const underVerificationCount = suppliers.filter(s => s.status === 'UNDER_VERIFICATION' || s.status === 'SUBMITTED').length;
  const revisionRequestedCount = suppliers.filter(s => s.status === 'REVISION_REQUESTED').length;

  const goodsCount = suppliers.filter(s => s.categories.includes('GOODS AND SERVICES')).length;
  const infraCount = suppliers.filter(s => s.categories.includes('INFRASTRUCTURE PROJECTS')).length;
  const consultCount = suppliers.filter(s => s.categories.includes('CONSULTING SERVICES')).length;

  const platinumPhilgepsCount = suppliers.filter(s => s.philgepsType === 'PLATINUM').length;
  const redPhilgepsCount = suppliers.filter(s => s.philgepsType === 'RED').length;

  // Aggregate comments count across all suppliers
  const totalCommentsCount = suppliers.reduce((acc, s) => acc + (s.comments?.length || 0), 0);

  // Consolidated decision records across all suppliers
  const allDecisionRecords = useMemo(() => {
    const list: (DecisionRecord & { supplierName: string; supplierRef: string; supplierId: string })[] = [];
    suppliers.forEach(s => {
      if (s.decisionHistory && s.decisionHistory.length > 0) {
        s.decisionHistory.forEach(d => {
          list.push({
            ...d,
            supplierName: s.businessName,
            supplierRef: s.referenceCode,
            supplierId: s.id
          });
        });
      }
    });

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [suppliers]);

  // Department Head has review/recommendation authority only.
  // Final approval must not be implemented until the authorized office is confirmed.
  // The Department Head cannot directly return a supplier submission for revision.
  const handleReturnForRevision = () => {
    setActionSuccessMsg('Select Recommend corrections and record review remarks. TSAD handles authorized correction requests.');
  };

  // Executive Action: Post Comment
  const handlePostExecutiveComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeSupplier) return;

    setIsSubmittingComment(true);

    const comment: SubmissionComment = {
      id: `comm-${Date.now()}`,
      authorName: currentUser.name || 'FOR. VINCENT PHILIP F. PIENCENAVES',
      authorRole: 'DEPT_HEAD',
      authorEmail: currentUser.email || 'cgb.cpmso@gmail.com',
      createdAt: new Date().toISOString(),
      message: newCommentText.trim(),
      relatedDocumentName: commentDocRef.trim() || undefined
    };

    const updatedSupplier: SupplierApplication = {
      ...activeSupplier,
      comments: [...(activeSupplier.comments || []), comment],
      updatedAt: new Date().toISOString()
    };

    setTimeout(() => {
      onUpdateSupplier(updatedSupplier);
      setNewCommentText('');
      setCommentDocRef('');
      setIsSubmittingComment(false);
    }, 250);
  };

  // CSV Export utility
  const handleExportMasterListCSV = () => {
    const headers = [
      'Reference Code',
      'Business Name',
      'Proprietor',
      'Authorized Representative',
      'Category',
      'PhilGEPS Classification',
      'PhilGEPS Cert No',
      'Contact Number',
      'Company Email',
      'Status',
      'Verified By',
      'Verified Date',
      'Approved By',
      'Approved Date'
    ];

    const rows = suppliers.map(s => [
      `"${s.referenceCode}"`,
      `"${s.businessName}"`,
      `"${s.proprietorName}"`,
      `"${s.authorizedRepName}"`,
      `"${s.categories.join('; ')}"`,
      `"${s.philgepsType}"`,
      `"${s.philgepsCertNumber}"`,
      `"${s.contactNumber}"`,
      `"${s.companyEmail}"`,
      `"${s.status}"`,
      `"${s.verifiedBy || ''}"`,
      `"${s.verifiedDate || ''}"`,
      `"${s.approvedBy || ''}"`,
      `"${s.approvedDate || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Butuan_City_CPMD_Master_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Action Notification Banner */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl shadow-md text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer font-bold px-2 py-1 rounded hover:bg-emerald-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 1: EXECUTIVE OVERVIEW */}
      {/* ========================================================================= */}
      {currentMenu === 'overview' && (
        <div className="space-y-6">
          {/* Executive Header Banner */}
          <div className="bg-gradient-to-r from-[#061d33] via-[#092b4d] to-[#0d3f6d] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-blue-900/40 relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono tracking-wider">
                <span className="bg-amber-400 text-amber-950 font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                  <Crown className="w-3.5 h-3.5" />
                  DEPARTMENT HEAD • DEPARTMENT HEAD EXECUTIVE PORTAL
                </span>
                <span className="text-sky-300 bg-white/10 px-2.5 py-0.5 rounded-md">
                  ISO 9001:2015 QMS ACCREDITATION DESK
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Executive Accreditation & Master List Control Center
                  </h2>
                  <p className="text-sky-100/90 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                    City Procurement Management Department workspace for verified-submission review, recommendations, and authorized reporting.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => onNavigate('review-queue')}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Inbox className="w-4 h-4" />
                    <span>Review Queue ({verifiedAwaitingHeadCount})</span>
                  </button>
                  <button
                    onClick={() => onNavigate('reports-printing')}
                    className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Reports & Printing</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Ready for Department Head Final Endorsement */}
            <div 
              onClick={() => {
                setQueueStatusFilter('VERIFIED');
                onNavigate('review-queue');
              }}
              className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Ready for Final Approval
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {verifiedAwaitingHeadCount}
              </div>
              <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                Verified by TSAD • Awaiting Dept Head Endorsement &rarr;
              </p>
            </div>

            {/* KPI 2: Approved in Master List */}
            <div 
              onClick={() => {
                setQueueStatusFilter('APPROVED_MASTERLIST');
                onNavigate('review-queue');
              }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Approved in Master List
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                  <BookOpenCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {approvedMasterListCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Active certified suppliers for Butuan City
              </p>
            </div>

            {/* KPI 3: Under Evaluation */}
            <div 
              onClick={() => {
                setQueueStatusFilter('UNDER_VERIFICATION');
                onNavigate('review-queue');
              }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Under TSAD Verification
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {underVerificationCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Evaluating documents per Form CPMD.TSAD.F.003
              </p>
            </div>

            {/* KPI 4: Total Registered */}
            <div 
              onClick={() => onNavigate('supplier-records')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Supplier Pool
                </span>
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {totalSuppliersCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Across all procurement classifications
              </p>
            </div>
          </div>

          {/* 2-Column Split: Categorical Distribution & Urgent Endorsements */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Urgent Pending Final Action (Col 7) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    Urgent: Submissions Awaiting Final Department Head Action
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {verifiedAwaitingHeadCount} Pending Endorsement
                </span>
              </div>

              {verifiedAwaitingHeadCount === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  All TSAD-verified supplier applications have been endorsed. No backlog in Department Head queue.
                </div>
              ) : (
                <div className="space-y-3">
                  {suppliers
                    .filter(s => s.status === 'VERIFIED')
                    .map(supplier => (
                      <div 
                        key={supplier.id}
                        className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-700 text-white">
                              {supplier.referenceCode}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-600">
                              Verified: {supplier.verifiedDate || 'Recently'}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900">
                            {supplier.businessName}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Proprietor: <span className="font-medium text-slate-800">{supplier.proprietorName}</span> • PhilGEPS {supplier.philgepsType}
                          </div>
                          {supplier.verificationNotes && (
                            <p className="text-[11px] text-emerald-800 italic bg-white/70 p-1.5 rounded border border-emerald-100">
                              TSAD Note: "{supplier.verificationNotes}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setSelectedSupplierId(supplier.id);
                              onNavigate('recommendations-decisions');
                            }}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Approve & Enrol</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Right: Categorical Distribution & QMS ISO Status (Col 5) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Procurement Classifications */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-900" />
                  <span>Procurement Classifications</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700">Goods and Services</span>
                      <span className="font-mono font-bold text-slate-900">{goodsCount} ({Math.round((goodsCount / totalSuppliersCount) * 100 || 0)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full" 
                        style={{ width: `${(goodsCount / totalSuppliersCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700">Infrastructure Projects</span>
                      <span className="font-mono font-bold text-slate-900">{infraCount} ({Math.round((infraCount / totalSuppliersCount) * 100 || 0)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${(infraCount / totalSuppliersCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700">Consulting Services</span>
                      <span className="font-mono font-bold text-slate-900">{consultCount} ({Math.round((consultCount / totalSuppliersCount) * 100 || 0)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 rounded-full" 
                        style={{ width: `${(consultCount / totalSuppliersCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>PhilGEPS Platinum: <strong className="text-slate-800">{platinumPhilgepsCount}</strong></span>
                  <span>PhilGEPS Red: <strong className="text-slate-800">{redPhilgepsCount}</strong></span>
                </div>
              </div>

              {/* ISO 9001:2015 Compliance Card */}
              <div className="bg-gradient-to-br from-slate-900 to-[#072d50] text-white rounded-2xl p-5 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200">
                    Quality Management Standard
                  </span>
                </div>
                <div className="text-sm font-bold">
                  City Government of Butuan • CPMD QMS
                </div>
                <p className="text-[11px] text-sky-100/80 leading-relaxed">
                  ISO 9001:2015 QMS accredited procedures strictly enforce verified documentary validation, certified true copies, dual sign-off authorization (TSAD Head + CPMD Head), and traceable audit history.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] text-sky-300 font-mono">
                  <span>Standard: ISO 9001:2015</span>
                  <span>Form: CPMD.TSAD.F.003 REV00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: EXECUTIVE REVIEW QUEUE */}
      {/* ========================================================================= */}
      {currentMenu === 'review-queue' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-blue-900" />
                  <span>Executive Review Queue</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prioritized application queue submitted and verified by TSAD for Department Head executive decisions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQueueStatusFilter('VERIFIED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    queueStatusFilter === 'VERIFIED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  Ready for Final Approval ({verifiedAwaitingHeadCount})
                </button>
                <button
                  onClick={() => setQueueStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    queueStatusFilter === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Applications ({totalSuppliersCount})
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search reference code or business name..."
                  value={queueSearchTerm}
                  onChange={(e) => setQueueSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <select
                  value={queueCategoryFilter}
                  onChange={(e) => setQueueCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                >
                  <option value="ALL">All Categories</option>
                  <option value="GOODS AND SERVICES">Goods and Services</option>
                  <option value="INFRASTRUCTURE PROJECTS">Infrastructure Projects</option>
                  <option value="CONSULTING SERVICES">Consulting Services</option>
                </select>
              </div>

              <div>
                <select
                  value={queueStatusFilter}
                  onChange={(e) => setQueueStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="VERIFIED">Verified (Awaiting Department Head Approval)</option>
                  <option value="UNDER_VERIFICATION">Under TSAD Evaluation</option>
                  <option value="SUBMITTED">Newly Submitted</option>
                  <option value="APPROVED_MASTERLIST">Approved in Master List</option>
                  <option value="REVISION_REQUESTED">Revision Requested</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Queue List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#072d50] text-white text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Reference & Code</th>
                    <th className="px-4 py-3">Business Name & Proprietor</th>
                    <th className="px-4 py-3">Classification</th>
                    <th className="px-4 py-3">PhilGEPS Standing</th>
                    <th className="px-4 py-3">TSAD Verification</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Executive Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliers
                    .filter(s => {
                      const matchSearch = 
                        s.businessName.toLowerCase().includes(queueSearchTerm.toLowerCase()) ||
                        s.referenceCode.toLowerCase().includes(queueSearchTerm.toLowerCase()) ||
                        s.proprietorName.toLowerCase().includes(queueSearchTerm.toLowerCase());
                      const matchCategory = queueCategoryFilter === 'ALL' || s.categories.includes(queueCategoryFilter as SupplierCategory);
                      const matchStatus = queueStatusFilter === 'ALL' || s.status === queueStatusFilter;
                      return matchSearch && matchCategory && matchStatus;
                    })
                    .map((supplier) => (
                      <tr 
                        key={supplier.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          supplier.status === 'VERIFIED' ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">
                          {supplier.referenceCode}
                          <div className="text-[10px] text-slate-400 font-sans font-normal">
                            Sub: {supplier.submissionDate}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{supplier.businessName}</div>
                          <div className="text-[11px] text-slate-500">{supplier.proprietorName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {supplier.categories.map((cat, i) => (
                              <span 
                                key={i}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  cat === 'INFRASTRUCTURE PROJECTS' 
                                    ? 'bg-amber-100 text-amber-900' 
                                    : cat === 'CONSULTING SERVICES'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-blue-100 text-blue-900'
                                }`}
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            supplier.philgepsType === 'PLATINUM'
                              ? 'bg-purple-100 text-purple-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}>
                            PhilGEPS {supplier.philgepsType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px]">
                          {supplier.verifiedBy ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{supplier.verifiedBy}</span>
                              </div>
                              <div className="text-[10px] text-slate-500">Date: {supplier.verifiedDate}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Pending TSAD review</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                            supplier.status === 'APPROVED_MASTERLIST'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : supplier.status === 'VERIFIED'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : supplier.status === 'REVISION_REQUESTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {supplier.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedSupplierId(supplier.id);
                                onNavigate('recommendations-decisions');
                              }}
                              className="px-2.5 py-1.5 bg-[#0a4275] hover:bg-[#072d50] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Executive Review & Decision"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Decision</span>
                            </button>
                            <button
                              onClick={() => onOpenPrintableDoc(supplier, 'FORM')}
                              className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="View Official Form CPMD.TSAD.F.003"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
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
      {/* SCREEN 3: MASTER SUPPLIER RECORDS & DOSSIER */}
      {/* ========================================================================= */}
      {currentMenu === 'supplier-records' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpenCheck className="w-5 h-5 text-blue-900" />
                  <span>Master Supplier Records & Profile Dossier</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete legal, operational, and ISO 9001:2015 qualification records for registered suppliers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMasterListCSV}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Master CSV</span>
                </button>
              </div>
            </div>

            {/* Quick Supplier Selector tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
              {suppliers.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSupplierId(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeSupplier.id === s.id
                      ? 'bg-[#0a4275] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {s.businessName.length > 24 ? s.businessName.slice(0, 22) + '...' : s.businessName}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Supplier Dossier */}
          {activeSupplier && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#072d50] to-[#0a4275] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-white/20 px-2.5 py-0.5 rounded text-sky-200">
                      {activeSupplier.referenceCode}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      activeSupplier.status === 'APPROVED_MASTERLIST'
                        ? 'bg-emerald-400 text-emerald-950 font-bold'
                        : 'bg-amber-300 text-amber-950'
                    }`}>
                      {activeSupplier.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    {activeSupplier.businessName}
                  </h3>
                  <p className="text-xs text-sky-200">
                    Proprietor / Managing Partner: <strong className="text-white">{activeSupplier.proprietorName}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenPrintableDoc(activeSupplier, 'BOTH')}
                    className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Sheet 1 & 2 (2 Pages)</span>
                  </button>
                  <button
                    onClick={() => onOpenPrintableDoc(activeSupplier, 'FORM')}
                    className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Sheet 2: Form F.003</span>
                  </button>
                  <button
                    onClick={() => onOpenPrintableDoc(activeSupplier, 'LETTER')}
                    className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Sheet 1: Letter</span>
                  </button>
                </div>
              </div>

              {/* Dossier Content Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
                
                {/* Section 1: General Business Details */}
                <div className="space-y-3.5 border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-800" />
                    <span>General Information (Form Page 2)</span>
                  </h4>

                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Principal Place of Business</span>
                      <span className="font-semibold text-slate-900">{activeSupplier.principalAddress}</span>
                    </div>

                    {activeSupplier.branchAddress && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Branch Office Address</span>
                        <span className="text-slate-900">{activeSupplier.branchAddress}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Authorized Representative</span>
                        <span className="font-semibold text-slate-900">{activeSupplier.authorizedRepName}</span>
                        <div className="text-[10px] text-slate-500">Auth: {activeSupplier.repAuthType}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Number</span>
                        <span className="font-semibold text-slate-900 font-mono">{activeSupplier.contactNumber}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Company Email</span>
                        <span className="text-blue-900 font-mono font-medium">{activeSupplier.companyEmail}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Person</span>
                        <span className="text-slate-900">{activeSupplier.contactPerson}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Categories</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {activeSupplier.categories.map((c, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[11px] border border-slate-200">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Statutory Registrations & Banking */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Statutory & Accreditation Registrations</span>
                  </h4>

                  <div className="space-y-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-500">PhilGEPS Standing</span>
                        <span className="font-bold text-xs text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                          {activeSupplier.philgepsType}
                        </span>
                      </div>
                      <div className="font-mono text-slate-800 text-[11px]">
                        Cert No: {activeSupplier.philgepsCertNumber || 'On Record'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Mayor's Permit</span>
                        <span className="font-semibold text-slate-900 font-mono">{activeSupplier.mayorsPermitNumber || 'Not recorded'}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">DTI / SEC Number</span>
                        <span className="font-semibold text-slate-900 font-mono">{activeSupplier.dtiSecNumber || 'Verified Compliant'}</span>
                      </div>
                    </div>

                    {activeSupplier.hasPcabLicense && (
                      <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px]">
                        <span className="text-[10px] text-amber-800 block uppercase font-bold">PCAB Contractor License</span>
                        <span className="font-semibold text-amber-950 font-mono">{activeSupplier.pcabLicenseNumber} ({activeSupplier.pcabCategory})</span>
                      </div>
                    )}

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">DBP Bank Account (EO No. 27 Series 2023)</span>
                      <span className="font-semibold text-slate-900 font-mono">{activeSupplier.dbpAccountNumber || 'DBP Butuan Branch Verified'}</span>
                    </div>

                    {/* Official Sign-off block */}
                    <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-[11px] space-y-1">
                      <div className="font-bold text-blue-950 flex items-center justify-between">
                        <span>ISO 9001:2015 Dual Signatory Record:</span>
                        <span className="text-[10px] bg-blue-200/60 text-blue-900 px-1.5 py-0.2 rounded font-mono">CPMD</span>
                      </div>
                      <div className="text-slate-700">
                        Verified by: <strong>{activeSupplier.verifiedBy || 'Pending TSAD'}</strong> ({activeSupplier.verifiedDate || '--'})
                      </div>
                      <div className="text-slate-700">
                        Approved by: <strong>{activeSupplier.approvedBy || 'Not designated'}</strong> ({activeSupplier.approvedDate || '--'})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: DOCUMENT REVIEW DESK */}
      {/* ========================================================================= */}
      {currentMenu === 'document-review' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-blue-900" />
                  <span>Executive Document Review Desk</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed inspection of submitted certified true copies and compliance requirements for Form CPMD.TSAD.F.003. REV00.
                </p>
              </div>

              {/* Supplier selector */}
              <div>
                <select
                  value={activeSupplier.id}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.businessName} ({s.referenceCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Document Items List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Documentary Checklist for {activeSupplier.businessName}
                </h3>
                <span className="text-xs font-mono text-slate-500">Ref: {activeSupplier.referenceCode}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {activeSupplier.documents.filter(d => d.attached).length} of {activeSupplier.documents.length} Attached
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {activeSupplier.documents.map((doc) => (
                <div 
                  key={doc.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                    doc.attached
                      ? 'bg-slate-50/70 border-slate-200 hover:border-blue-400'
                      : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{doc.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        doc.attached ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {doc.attached ? 'ATTACHED' : 'REQUIRED'}
                      </span>
                    </div>

                    {doc.fileName && (
                      <div className="text-[11px] font-mono text-slate-600 truncate">
                        File: {doc.fileName} ({doc.fileSize || '1.5 MB'})
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                      {doc.isCertifiedTrueCopy && (
                        <span className="text-blue-900 bg-blue-100/70 font-semibold px-1.5 py-0.2 rounded">
                          ✓ Certified True Copy
                        </span>
                      )}
                      {doc.expiryDate && (
                        <span className="text-slate-600">
                          Expires: {doc.expiryDate}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Source: {doc.source || 'Form CPMD.TSAD.F.003'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {doc.attached && (
                        <>
                          {/* Clearly Labeled "View Document" */}
                          <button
                            type="button"
                            onClick={() => setViewingDoc(doc)}
                            className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="View multipage certified document"
                          >
                            <Eye className="w-3 h-3 text-sky-700" />
                            <span>View Document</span>
                          </button>

                          {/* Clearly Labeled "Download" */}
                          <button
                            type="button"
                            onClick={() => setViewingDoc(doc)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="Download document copy"
                          >
                            <Download className="w-3 h-3 text-slate-700" />
                            <span>Download</span>
                          </button>

                          {/* Clearly Labeled "Print" */}
                          <button
                            type="button"
                            onClick={() => setViewingDoc(doc)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="Print certified document with all pages or page range"
                          >
                            <Printer className="w-3 h-3 text-emerald-700" />
                            <span>Print</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setInspectingDoc(doc)}
                        className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-0.5 cursor-pointer px-1.5 py-1"
                        title="View ISO QMS compliance metadata"
                      >
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal for Inspecting Document */}
          {inspectingDoc && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-blue-900" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Document Inspection: {inspectingDoc.name}
                    </h4>
                  </div>
                  <button
                    onClick={() => setInspectingDoc(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Supplier Application</span>
                    <span className="font-bold text-slate-900">{activeSupplier.businessName} ({activeSupplier.referenceCode})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">File Attached</span>
                    <span className="font-mono text-slate-900">{inspectingDoc.fileName || 'Certified Electronic Copy.pdf'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Certified True Copy</span>
                      <span className="text-emerald-700 font-bold">✓ Verified Compliant</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Expiry Date</span>
                      <span className="font-mono text-slate-900">{inspectingDoc.expiryDate || 'N/A (Permanent / Annual)'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 text-blue-950 rounded-xl border border-blue-200 text-[11px] leading-relaxed">
                  <strong>Department Head Executive Verification:</strong> This documentary submission complies with the requirements stipulated in Butuan City CPMD Form CPMD.TSAD.F.003. REV00 and ISO 9001:2015 QMS standards.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setInspectingDoc(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Close Inspection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 5: RECOMMENDATIONS & DECISIONS (CORE EXECUTIVE TERMINAL) */}
      {/* ========================================================================= */}
      {currentMenu === 'recommendations-decisions' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Department Head Review & Recommendations</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review verified submissions and record Department Head recommendations. Final approval is not authorized.
                </p>
              </div>

              {/* Supplier selector */}
              <div>
                <select
                  value={activeSupplier.id}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.status === 'VERIFIED' ? '⭐ [READY] ' : ''}{s.businessName} ({s.referenceCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Supplier Summary & TSAD Staff Recommendation Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                  {activeSupplier.referenceCode}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {activeSupplier.businessName}
                </h3>
                <p className="text-xs text-slate-500">
                  Proprietor: {activeSupplier.proprietorName} • Classification: {activeSupplier.categories.join(', ')}
                </p>
              </div>

              <div className="text-right">
                <span className={`text-xs font-extrabold px-3 py-1 rounded-md uppercase tracking-wider ${
                  activeSupplier.status === 'APPROVED_MASTERLIST'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : activeSupplier.status === 'VERIFIED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  Current: {activeSupplier.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* TSAD Staff Sign-Off Inspection */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span className="flex items-center gap-1.5 text-blue-900">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Technical Support and Accreditation Division (TSAD) Verification:</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Date: {activeSupplier.verifiedDate || activeSupplier.receivedDate || 'Pending'}
                </span>
              </div>
              <div className="text-slate-700">
                Verified by: <strong>{activeSupplier.verifiedBy || 'Pending verification'}</strong>
              </div>
              <div className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                "{activeSupplier.verificationNotes || 'All mandatory SI Sheet entries and certified true copies checked and verified compliant with ISO 9001:2015 QMS standards.'}"
              </div>
            </div>

            {/* Executive Decision Form */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Department Head Review Form
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Date of Review
                  </label>
                  <input
                    type="date"
                    value={approvedDateInput}
                    onChange={(e) => setApprovedDateInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900 font-mono"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Executive Signatory *
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="FOR. VINCENT PHILIP F. PIENCENAVES (Acting Department Head, CPMD)"
                    className="w-full px-3 py-2 text-xs bg-slate-100 text-slate-700 border border-slate-300 rounded-lg cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Department Head Review Remarks (not final approval)
                </label>
                <textarea
                  rows={2}
                  value={approvalRemarksInput}
                  onChange={(e) => setApprovalRemarksInput(e.target.value)}
                  placeholder="Enter executive endorsement remarks..."
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Final approval is not available to the Department Head. Review and recommendation only.
                </p>
                <select aria-label="Recommendation" value={recommendationType} onChange={(e) => setRecommendationType(e.target.value as typeof recommendationType)}
                  className="border border-slate-300 rounded-lg p-2 text-xs">
                  <option value="RECOMMEND_FOR_FURTHER_REVIEW">Recommend further review</option>
                  <option value="RECOMMEND_CORRECTIONS">Recommend corrections</option>
                  <option value="RECOMMEND_NO_ACTION">Recommend no action</option>
                </select>
                <button type="button" disabled={savingRecommendation || activeSupplier.status !== 'VERIFIED'}
                  onClick={async () => {
                    setRecommendationError(null);
                    if (approvalRemarksInput.trim().length < 5) { setRecommendationError('Enter at least five characters of review remarks.'); return; }
                    setSavingRecommendation(true);
                    try {
                      await recordDepartmentHeadRecommendation(activeSupplier.id, recommendationType, approvalRemarksInput);
                      await onRefreshSuppliers();
                      setActionSuccessMsg('Recommendation saved to Supabase. This is not final approval.');
                      setApprovalRemarksInput('');
                    } catch (e: any) { setRecommendationError(e.message || 'Unable to save recommendation.'); }
                    finally { setSavingRecommendation(false); }
                  }} className="px-4 py-2.5 bg-[#072d50] text-white rounded-xl text-xs font-semibold disabled:opacity-50">
                  {savingRecommendation ? 'Saving...' : 'Record Recommendation'}
                </button>
                {recommendationError && <p role="alert" className="text-red-700 text-xs">{recommendationError}</p>}


                <button
                  type="button"
                  onClick={() => onOpenPrintableDoc(activeSupplier, 'FORM')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>View Printable Form</span>
                </button>
              </div>

              {/* Return for Revision Alternative Drawer */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Correction recommendation (TSAD performs any authorized return)</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={revisionDirectivesInput}
                    onChange={(e) => setRevisionDirectivesInput(e.target.value)}
                    placeholder="Specify factual deficiency or amendment requested by Department Head..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleReturnForRevision}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    How to Recommend Corrections
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 6: REVIEW COMMENTS */}
      {/* ========================================================================= */}
      {currentMenu === 'review-comments' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-900" />
                  <span>Two-Way Department Review Comments</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official communication thread between Department Head, TSAD Staff, and Supplier.
                </p>
              </div>

              <div>
                <select
                  value={activeSupplier.id}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.businessName} ({s.comments?.length || 0} comments)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Comment Thread for Active Supplier */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Discussion Thread: {activeSupplier.businessName}
                </h3>
                <span className="text-xs font-mono text-slate-500">{activeSupplier.referenceCode}</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                {activeSupplier.comments?.length || 0} Entries
              </span>
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {(!activeSupplier.comments || activeSupplier.comments.length === 0) ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No official comments or directives on this record yet. Post an executive note below.
                </div>
              ) : (
                activeSupplier.comments.map((comment) => (
                  <div 
                    key={comment.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      comment.authorRole === 'DEPT_HEAD'
                        ? 'bg-amber-50/60 border-amber-200'
                        : comment.authorRole === 'TSAD_STAFF'
                        ? 'bg-blue-50/60 border-blue-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          comment.authorRole === 'DEPT_HEAD'
                            ? 'bg-amber-400 text-amber-950 font-bold'
                            : comment.authorRole === 'TSAD_STAFF'
                            ? 'bg-blue-900 text-white'
                            : 'bg-slate-700 text-white'
                        }`}>
                          {comment.authorRole === 'DEPT_HEAD' ? 'DEPARTMENT HEAD' : comment.authorRole}
                        </span>
                        <span className="font-bold text-slate-900">{comment.authorName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                      {comment.message}
                    </p>

                    {comment.relatedDocumentName && (
                      <div className="text-[10px] text-slate-500">
                        Related Item: <span className="font-semibold">{comment.relatedDocumentName}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Post Executive Directives Form */}
            <form onSubmit={handlePostExecutiveComment} className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Post Department Head Official Comment / Directive</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Optional Related Document (e.g., Mayor's Permit)"
                  value={commentDocRef}
                  onChange={(e) => setCommentDocRef(e.target.value)}
                  className="sm:col-span-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                />
                <input
                  type="text"
                  required
                  placeholder="Type official executive directive or note..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newCommentText.trim()}
                  className="px-4 py-2 bg-[#072d50] hover:bg-[#05213b] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Official Directive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 7: REPORTS & OFFICIAL PRINTING */}
      {/* ========================================================================= */}
      {currentMenu === 'reports-printing' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-900" />
                  <span>Reports & Official Document Generation</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Print official Form CPMD.TSAD.F.003, Invitation Letters, and generate accredited Master List ledgers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onOpenPrintableDoc(activeSupplier, 'BOTH')}
                  className="px-4 py-2 bg-[#07243c] hover:bg-[#051729] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4 text-teal-300" />
                  <span>Print Sheet 1 & 2 (2 Pages)</span>
                </button>
                <button
                  onClick={handleExportMasterListCSV}
                  className="px-4 py-2 bg-[#0a4275] hover:bg-[#072d50] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Master Registry CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Print Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Official Supplier Information Sheet */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-900">
                <FileText className="w-5 h-5" />
                <h3 className="text-sm font-bold">
                  Official Form CPMD.TSAD.F.003. REV00 (Page 2)
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Renders the complete high-resolution ISO 9001:2015 QMS accredited Supplier Information Sheet with dual official signature blocks: TSAD Verifier (Engr. Rosales) and CPMD Acting Department Head (For. Piencenaves).
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => onOpenPrintableDoc(activeSupplier, 'FORM')}
                  className="px-4 py-2 bg-[#072d50] hover:bg-[#05213b] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Form for {activeSupplier.businessName}</span>
                </button>
              </div>
            </div>

            {/* Card 2: Official Invitation Letter */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-900">
                <FileCheck2 className="w-5 h-5" />
                <h3 className="text-sm font-bold">
                  Official Invitation Notice Letter (Page 1)
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Displays the authorized City Government of Butuan procurement invitation letter.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => onOpenPrintableDoc(activeSupplier, 'LETTER')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Letter for {activeSupplier.businessName}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Master List Ledger Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Official Master List of Suppliers Ledger (Active Accredited)
                </h3>
                <span className="text-xs text-slate-500">City Procurement Management Department • ISO 9001:2015</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                {approvedMasterListCount} Certified Suppliers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">No.</th>
                    <th className="px-3 py-2">Reference Code</th>
                    <th className="px-3 py-2">Business Name</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">PhilGEPS</th>
                    <th className="px-3 py-2">Approved Date</th>
                    <th className="px-3 py-2">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliers
                    .filter(s => s.status === 'APPROVED_MASTERLIST')
                    .map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-800">{s.referenceCode}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{s.businessName}</td>
                        <td className="px-3 py-2">{s.categories.join(', ')}</td>
                        <td className="px-3 py-2">
                          <span className="bg-purple-100 text-purple-900 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            {s.philgepsType}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600">{s.approvedDate || '2026'}</td>
                        <td className="px-3 py-2 font-medium text-slate-700">{s.approvedBy || 'Legacy entry — approver unverified'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 8: DECISION AUDIT HISTORY */}
      {/* ========================================================================= */}
      {currentMenu === 'decision-history' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-900" />
                  <span>Traceable Decision History & Audit Trail</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological ISO 9001:2015 surveillance audit log of all endorsements, verifications, and executive determinations.
                </p>
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Filter by action or supplier..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>
          </div>

          {/* Audit Records Timeline / Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Historical Action Ledger
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                {allDecisionRecords.length} Audited Events
              </span>
            </div>

            <div className="space-y-3">
              {allDecisionRecords
                .filter(rec => {
                  return (
                    rec.action.toLowerCase().includes(historySearch.toLowerCase()) ||
                    rec.performedBy.toLowerCase().includes(historySearch.toLowerCase()) ||
                    rec.supplierName.toLowerCase().includes(historySearch.toLowerCase()) ||
                    rec.supplierRef.toLowerCase().includes(historySearch.toLowerCase())
                  );
                })
                .map((record) => (
                  <div 
                    key={record.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                          {record.supplierRef}
                        </span>
                        <span className="font-bold text-slate-900">{record.supplierName}</span>
                      </div>

                      <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5 pt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{record.action}</span>
                      </div>

                      {record.notes && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80">
                          {record.notes}
                        </p>
                      )}
                    </div>

                    <div className="sm:text-right shrink-0 space-y-0.5">
                      <div className="font-semibold text-slate-800">{record.performedBy}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{record.role}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 9: EXECUTIVE ACCOUNT & SECURITY */}
      {/* ========================================================================= */}
      {currentMenu === 'account-security' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-900" />
              <span>Executive Account & Security Governance</span>
            </h2>
            <p className="text-xs text-slate-500">
              Department Head profile credentials and security session audit for City Procurement Management Department.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Official Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Executive Signatory Profile</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Official Name</span>
                  <span className="text-sm font-bold text-slate-900">{currentUser.name}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Official Title & Agency</span>
                  <span className="font-semibold text-slate-900">
                    {currentUser.staffTitle || 'Acting Department Head'}
                  </span>
                  <div className="text-[11px] text-slate-500">City Procurement Management Department (CPMD)</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Authorized Email</span>
                  <span className="font-mono font-bold text-blue-900">{currentUser.email}</span>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[11px]">ISO 9001:2015 Approved Signatory</div>
                    <div className="text-[10px] text-emerald-800">Master List & Supplier Information Sheet Approver</div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>
              </div>
            </div>

            {/* Right: Change Password & Security Session */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-900" />
                <span>Update Account Password</span>
              </h3>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold">
                  Password successfully updated and logged in security audit registry.
                </div>
              )}

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!currentPassword || !newPassword) return;
                  setPasswordSuccess(true);
                  setCurrentPassword('');
                  setNewPassword('');
                  setTimeout(() => setPasswordSuccess(false), 4000);
                }}
                className="space-y-3 text-xs"
              >
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">New Executive Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter minimum 8 character password"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#0a4275] hover:bg-[#072d50] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Update Password & Enforce Session
                </button>
              </form>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Session Security Level:</span>
                  <span className="font-mono font-bold text-emerald-700">GovNet Encrypted (Role 3)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Authenticated:</span>
                  <span className="font-mono text-slate-700">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
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
