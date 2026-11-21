import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UserAccount, SupplierApplication, DocumentItem } from '../types';
import { 
  checkDocumentAccess, 
  StorageAccessResult,
  getRealDocumentSignedUrl 
} from '../services/documentStorageService';
import { ButuanCitySeal } from './Seals';
import { 
  FileText, 
  Download, 
  Printer, 
  ExternalLink, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Info, 
  CheckCircle2, 
  FileCheck2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  AlertTriangle,
  QrCode,
  Layers
} from 'lucide-react';

// Derive the page type from the existing document model instead of using an undefined type.
type DocumentPage = NonNullable<DocumentItem['pages']>[number];

interface SecureDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  supplier: SupplierApplication;
  currentUser: UserAccount | null;
}

export const SecureDocumentViewerModal: React.FC<SecureDocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  supplier,
  currentUser,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'SINGLE' | 'ALL'>('ALL');
  
  // Printing state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printPageSelection, setPrintPageSelection] = useState<'ALL' | 'RANGE'>('ALL');
  const [printPageRangeInput, setPrintPageRangeInput] = useState<string>('1-2');
  const [isPrinting, setIsPrinting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const printContainerRef = useRef<HTMLDivElement>(null);

  const [realSignedUrl, setRealSignedUrl] = useState<string | null>(null);
  const [isLoadingSignedUrl, setIsLoadingSignedUrl] = useState<boolean>(false);

  // Reset page & fetch real signed URL when doc changes
  useEffect(() => {
    if (doc) {
      setCurrentPage(1);
      setIsPrintModalOpen(false);

      let isCancelled = false;
      if (doc.storagePath) {
        setIsLoadingSignedUrl(true);
        getRealDocumentSignedUrl(doc, 900)
          .then(res => {
            if (!isCancelled && res.signedUrl) {
              setRealSignedUrl(res.signedUrl);
            }
          })
          .catch(e => {
            console.warn('Notice: real signed url lookup:', e);
          })
          .finally(() => {
            if (!isCancelled) setIsLoadingSignedUrl(false);
          });
      } else {
        setRealSignedUrl(null);
      }

      return () => {
        isCancelled = true;
      };
    }
  }, [doc]);

  // Authorization evaluation
  const accessResult: StorageAccessResult = useMemo(() => {
    if (!doc) {
      return {
        allowed: false,
        reason: 'No document specified',
        bucketName: 'supplier-documents-private',
        storagePath: '',
      };
    }
    return checkDocumentAccess(currentUser, supplier, doc);
  }, [currentUser, supplier, doc]);

  // Multipage document structure
  const pages: DocumentPage[] = useMemo(() => {
    if (!doc || !accessResult.allowed) return [];
    return doc.pages ?? [];
  }, [doc, supplier, accessResult.allowed]);

  const totalPages = pages.length;

  if (!isOpen || !doc) return null;

  // Handle Download action
  const handleDownload = () => {
    if (!accessResult.allowed) return;

    const safeFileName = doc.fileName || `${doc.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    // 1. If real storage signed URL exists
    if (realSignedUrl) {
      const a = window.document.createElement('a');
      a.href = realSignedUrl;
      a.download = safeFileName;
      a.target = '_blank';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      return;
    }

    // 2. If real fileDataUrl exists (e.g. user uploaded base64 data)
    if (doc.fileDataUrl) {
      const link = window.document.createElement('a');
      link.href = doc.fileDataUrl;
      link.download = safeFileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      return;
    }

    // No uploaded file is available; never manufacture an official document.
    alert('No authentic uploaded file is available for download.');
  };

  // Handle "Open PDF in new tab" fallback
  const handleOpenInNewTab = () => {
    if (!accessResult.allowed) return;

    if (realSignedUrl) {
      window.open(realSignedUrl, '_blank');
      return;
    }

    if (doc.fileDataUrl) {
      window.open(doc.fileDataUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    alert('No authentic uploaded file is available to open.');
  };

  // Resolve pages to print based on selection
  const resolvePagesToPrint = (): DocumentPage[] => {
    if (printPageSelection === 'ALL') {
      return pages;
    }

    // Parse range input like "1-2" or "1, 3" or "2"
    const selectedPageNumbers = new Set<number>();
    const parts = printPageRangeInput.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map(s => parseInt(s.trim(), 10));
        if (!isNaN(startStr) && !isNaN(endStr)) {
          const start = Math.max(1, Math.min(startStr, endStr));
          const end = Math.min(totalPages, Math.max(startStr, endStr));
          for (let i = start; i <= end; i++) {
            selectedPageNumbers.add(i);
          }
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= totalPages) {
          selectedPageNumbers.add(num);
        }
      }
    }

    if (selectedPageNumbers.size === 0) {
      return pages; // fallback to all
    }

    return pages.filter(p => selectedPageNumbers.has(p.pageNumber));
  };

  // Print only the original uploaded file, never a synthetic government document.
  const handleExecutePrint = () => {
    const url = realSignedUrl || doc.fileDataUrl;
    if (!url) { alert('No authentic uploaded document is available for printing.'); return; }
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) alert('Allow pop-ups to open the original document for printing.');
    setIsPrintModalOpen(false);
  };

  // Copy signed link
  const handleCopySignedUrl = () => {
    const urlToCopy = realSignedUrl || accessResult.signedUrl;
    if (urlToCopy) {
      navigator.clipboard.writeText(urlToCopy);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex flex-col justify-between animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. TOP SECURE APP HEADER */}
      {/* ========================================================================= */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-lg">
        {/* Left: Document Info & Security Badges */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0a4f94] flex items-center justify-center shrink-0 border border-blue-400/30">
            <FileText className="w-5 h-5 text-teal-300" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider bg-blue-950/80 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                CPMD TSAD Document Vault
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {supplier.referenceCode}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                doc.status === 'VERIFIED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {doc.status}
              </span>
            </div>

            <h2 className="text-sm md:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{doc.name}</span>
              {doc.isCertifiedTrueCopy && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-semibold">
                  Uploader-declared certified copy
                </span>
              )}
            </h2>

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="font-semibold text-slate-300">{supplier.businessName}</span>
              <span>•</span>
              <span className="font-mono text-slate-400">{doc.fileName || 'No file uploaded'}</span>
              <span>•</span>
              <span>{doc.fileSize || 'Size not recorded'}</span>
            </div>
          </div>
        </div>

        {/* Right: Security & Storage Info + Close */}
        <div className="flex items-center gap-2 self-end md:self-center">
          {accessResult.allowed && (
            <div className="hidden lg:flex flex-col items-end text-[10px] font-mono text-slate-400 mr-2 border-r border-slate-800 pr-3">
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Access check • {accessResult.roleScope}
              </span>
              <span className="text-slate-400">
                Bucket: {accessResult.bucketName} • Exp: 15m
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. ACTION BAR (Clearly Labeled Actions) */}
      {/* ========================================================================= */}
      <div className="bg-slate-800/90 border-b border-slate-700/80 px-4 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Actions Group: View, Download, Print, New Tab */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Clearly Labeled "View Document" */}
          <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('ALL')}
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                viewMode === 'ALL'
                  ? 'bg-[#0a4f94] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="View all pages continuously"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>View All Pages</span>
            </button>
            <button
              onClick={() => setViewMode('SINGLE')}
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                viewMode === 'SINGLE'
                  ? 'bg-[#0a4f94] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="View page-by-page"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Page {currentPage} of {totalPages}</span>
            </button>
          </div>

          {/* Clearly Labeled "Download" */}
          <button
            onClick={handleDownload}
            disabled={!accessResult.allowed}
            className={`px-3.5 py-1.5 font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors ${
              accessResult.allowed
                ? 'bg-slate-700 hover:bg-slate-600 text-white cursor-pointer border border-slate-600'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
            title="Download full document copy"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Download</span>
          </button>

          {/* Clearly Labeled "Print" */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={!accessResult.allowed}
            className={`px-3.5 py-1.5 font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors ${
              accessResult.allowed
                ? 'bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title="Print actual document with page options"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>Print</span>
          </button>

          {/* Fallback "Open PDF in new tab" */}
          <button
            onClick={handleOpenInNewTab}
            disabled={!accessResult.allowed}
            className="px-3 py-1.5 font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-900 rounded-lg flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            title="Open printable document in a clean new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Open PDF in new tab</span>
          </button>
        </div>

        {/* View Controls: Navigation & Zoom */}
        {accessResult.allowed && (
          <div className="flex items-center gap-3">
            {/* Page navigation when in SINGLE view */}
            {viewMode === 'SINGLE' && (
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-200 px-2 font-bold">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 text-slate-400">
              <button
                onClick={() => setZoomLevel(z => Math.max(75, z - 15))}
                className="p-1 hover:text-white cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-300 px-1 font-semibold w-10 text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(z => Math.min(150, z + 15))}
                className="p-1 hover:text-white cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="text-[10px] px-1 hover:text-white cursor-pointer underline font-mono"
                title="Reset zoom"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE / VIEWER CANVAS */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto bg-slate-900/95 p-4 sm:p-6 flex flex-col items-center">
        {/* CASE A: Access Denied (Supabase RLS Policy Violation) */}
        {!accessResult.allowed ? (
          <div className="max-w-lg w-full bg-slate-900 border border-red-500/40 rounded-2xl p-6 text-center space-y-4 my-auto shadow-2xl">
            <div className="w-14 h-14 bg-red-950 border border-red-500/50 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 bg-red-950/60 px-2.5 py-0.5 rounded border border-red-800">
                Storage RLS Access Violation
              </span>
              <h3 className="text-lg font-bold text-white mt-2">
                Document Access Restricted
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {accessResult.reason || 'You do not have authorized credentials to access this private document bucket.'}
              </p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-left space-y-1 font-mono">
              <div><strong>Storage Bucket:</strong> supplier-documents-private</div>
              <div><strong>Object Key:</strong> {accessResult.storagePath}</div>
              <div><strong>Authenticated User:</strong> {currentUser?.email || 'Anonymous'}</div>
              <div><strong>Assigned Role:</strong> {currentUser?.role || 'None'}</div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
            >
              Return to Safe Workspace
            </button>
          </div>
        ) : (
          /* CASE B: Authorized Document Display */
          <div 
            ref={printContainerRef}
            className="w-full max-w-4xl space-y-8 my-auto transition-all"
            style={{ zoom: `${zoomLevel}%` }}
          >
            {/* If actual file is uploaded to Supabase Storage */}
            {realSignedUrl && (
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <div className="flex items-center gap-3">
                    <ButuanCitySeal size={48} className="w-12 h-12" />
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0a3560] flex items-center gap-2">
                        <span>UPLOADED FILE FROM PRIVATE STORAGE</span>
                        <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                          Encrypted Vault Object
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {doc.fileName || doc.name} • Path: {doc.storagePath}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center bg-slate-900/10 p-2 rounded-lg border border-slate-200 min-h-[500px]">
                  {doc.fileName?.toLowerCase().endsWith('.pdf') || doc.mimeType?.includes('pdf') ? (
                    <iframe 
                      src={realSignedUrl} 
                      title={doc.name}
                      className="w-full h-[750px] rounded-lg border border-slate-300 shadow-inner bg-white" 
                    />
                  ) : (
                    <img 
                      src={realSignedUrl} 
                      alt={doc.name}
                      className="max-h-[750px] w-auto object-contain rounded shadow-md border border-slate-300" 
                    />
                  )}
                </div>
              </div>
            )}

            {/* If actual fileDataUrl exists (User uploaded image or document in session) */}
            {!realSignedUrl && doc.fileDataUrl && (
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <div className="flex items-center gap-3">
                    <ButuanCitySeal size={48} className="w-12 h-12" />
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0a3560]">
                        UPLOADED DOCUMENT (NOT INDEPENDENTLY CERTIFIED)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {doc.fileName} • Ref: {doc.referenceNumber || supplier.referenceCode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Certification declared by uploader
                    </span>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Uploaded {doc.uploadedAt || 'Date unavailable'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center bg-slate-100 p-4 rounded-lg border border-slate-200">
                  {(doc.mimeType?.includes('pdf') || doc.fileName?.toLowerCase().endsWith('.pdf')) ? (
                    <iframe src={doc.fileDataUrl} title={doc.name} className="w-full h-[750px] rounded-lg border border-slate-300" />
                  ) : (
                    <img src={doc.fileDataUrl} alt={doc.name} className="max-h-[750px] w-auto object-contain rounded shadow-md border border-slate-300" />
                  )}
                </div>
              </div>
            )}

            {!realSignedUrl && !doc.fileDataUrl && (
              <div role="alert" className="rounded-lg bg-amber-50 p-6 text-amber-950">
                The original uploaded document is unavailable. No permit, receipt, certificate, or signature will be generated as a substitute.
              </div>
            )}
            {/* Synthetic document rendering disabled; original uploads only. */}
            {false && pages
              .filter(page => viewMode === 'ALL' || page.pageNumber === currentPage)
              .map((page) => (
                <div 
                  key={page.pageNumber}
                  id={`doc-page-${page.pageNumber}`}
                  className="bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden text-slate-900 print-sheet p-8 sm:p-10 space-y-6 relative"
                  style={{ minHeight: '1050px' }}
                >
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] overflow-hidden">
                    <div className="text-[120px] font-black uppercase text-slate-900 -rotate-45 font-mono">
                      CERTIFIED TRUE COPY
                    </div>
                  </div>

                  {/* Header: Republic / City Seal & Official Heading */}
                  <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
                    <div className="shrink-0">
                      <ButuanCitySeal size={70} className="w-16 h-16 sm:w-20 sm:h-20" />
                    </div>

                    <div className="text-center flex-1 px-4 space-y-1">
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-600">
                        Republic of the Philippines
                      </div>
                      <div className="text-sm sm:text-base font-extrabold uppercase text-[#072d50] tracking-tight">
                        City Government of Butuan
                      </div>
                      <div className="text-[11px] font-bold text-slate-700">
                        City Procurement Management Department (CPMD)
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Technical Support and Accreditation Division (TSAD) • ISO 9001:2015 QMS
                      </div>
                    </div>

                    {/* Official Stamp & QR Badge */}
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="w-16 h-16 border-2 border-emerald-700 rounded-lg p-1 flex flex-col items-center justify-center bg-emerald-50 text-emerald-900 text-center select-none shadow-xs">
                        <QrCode className="w-7 h-7 text-emerald-800" />
                        <span className="text-[8px] font-mono font-bold mt-0.5">VERIFIED</span>
                      </div>
                      <span className="text-[8px] font-mono text-slate-400 mt-1">
                        P.{page.pageNumber} / {totalPages}
                      </span>
                    </div>
                  </div>

                  {/* Document Title & Badge */}
                  <div className="text-center space-y-1 py-1">
                    {page.badge && (
                      <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-800 px-3 py-0.5 rounded-full border border-slate-300">
                        {page.badge}
                      </span>
                    )}
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#0a3560]">
                      {page.title}
                    </h3>
                    {page.subtitle && (
                      <p className="text-xs text-slate-600 font-medium">
                        {page.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Body Content Lines */}
                  {page.contentLines && page.contentLines.length > 0 && (
                    <div className="space-y-2 text-xs text-slate-800 leading-relaxed bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                      {page.contentLines.map((line, idx) => (
                        <p key={idx} className={line.startsWith('BUSINESS NAME:') || line.startsWith('PRIMARY PURPOSE:') ? 'font-bold text-slate-900' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Key Values Matrix */}
                  {page.keyValues && page.keyValues.length > 0 && (
                    <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                      <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-bold text-xs uppercase tracking-wider text-slate-800">
                        Official Assessment & Regulatory Particulars
                      </div>
                      <div className="divide-y divide-slate-200 text-xs">
                        {page.keyValues.map((kv, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 p-3 hover:bg-slate-50 transition-colors">
                            <span className="font-bold text-slate-600 uppercase text-[11px] sm:col-span-1">
                              {kv.label}:
                            </span>
                            <span className="font-semibold text-slate-900 sm:col-span-2 font-mono text-xs">
                              {kv.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Statutory & Official Notes */}
                  {page.officialNotes && page.officialNotes.length > 0 && (
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-950">
                      <div className="font-bold flex items-center gap-1.5 text-amber-900 text-[11px] uppercase tracking-wide">
                        <Info className="w-3.5 h-3.5 text-amber-700" />
                        <span>Regulatory Guidance & Statutory Conditions:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-700">
                        {page.officialNotes.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Signatures & Seal Block */}
                  <div className="pt-8 border-t-2 border-slate-200 flex flex-col sm:flex-row items-end justify-between gap-6">
                    <div className="space-y-1 text-[10px] text-slate-500 font-mono">
                      <div><strong>Document ID:</strong> {doc?.id}</div>
                      <div><strong>Reference Code:</strong> {supplier.referenceCode}</div>
                      <div><strong>Storage Signature:</strong> SHA-256 Validated</div>
                      <div><strong>QMS Audit Standard:</strong> ISO 9001:2015 Clause 8.4</div>
                    </div>

                    <div className="text-center sm:text-right min-w-[220px]">
                      <div className="inline-block border-b-2 border-slate-900 pb-1 px-4 w-full text-center">
                        <span className="font-extrabold uppercase text-xs text-slate-900 block">
                          {page.signatoryName || supplier.proprietorName}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-600 block mt-1">
                        {page.signatoryTitle || 'Authorized Commercial Signatory'}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-mono">
                        Official Signatory • Certified True Copy
                      </span>
                    </div>
                  </div>

                  {/* Page Footer */}
                  <div className="pt-4 border-t border-slate-200 text-center flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>CPMD Form CPMD.TSAD.F.003 • Annex Documentary Set</span>
                    <span>Page {page.pageNumber} of {totalPages}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. FOOTER: Security Notice & Role Boundary Guarantee */}
      {/* ========================================================================= */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 py-3 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Role Boundary Policy:</strong> Viewing and printing access does <em>not</em> automatically grant approval, rejection, editing, or deletion permissions.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {accessResult.allowed && (
            <button
              onClick={handleCopySignedUrl}
              className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white bg-slate-800 rounded flex items-center gap-1 cursor-pointer"
              title="Copy secure signed storage token"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? 'Token Copied' : 'Copy Token'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-3.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 5. PRINT PAGE RANGE & ALL PAGES MODAL */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-sm text-[#0a3560]">
                  Print Certified Document
                </h3>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                The original file will open in a new tab. Use your browser or PDF viewer to choose pages and print.
              </p>

              {/* Option 1: All Pages */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/70 cursor-pointer">
                <input
                  type="radio"
                  name="printSelection"
                  checked={printPageSelection === 'ALL'}
                  onChange={() => setPrintPageSelection('ALL')}
                  className="mt-0.5 text-blue-900"
                />
                <div>
                  <span className="font-bold text-slate-900 block">All Pages (Complete Multipage Document)</span>
                  <span className="text-[11px] text-slate-500">
                    Opens the original uploaded file for printing; no seals or signatures are added.
                  </span>
                </div>
              </label>

              {/* Option 2: Page Range */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/70 cursor-pointer">
                <input
                  type="radio"
                  name="printSelection"
                  checked={false}
                  onChange={() => {}} disabled
                  className="mt-0.5 text-blue-900"
                />
                <div className="flex-1 space-y-1.5">
                  <span className="font-bold text-slate-900 block">Select Page Range:</span>
                  <input
                    type="text"
                    disabled={printPageSelection !== 'RANGE'}
                    value={printPageRangeInput}
                    onChange={(e) => setPrintPageRangeInput(e.target.value)}
                    placeholder="e.g. 1-2, 3 or 1, 3"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-blue-900 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Page selection is available in your PDF viewer; estimated page count: {totalPages} (e.g. "1-{Math.min(2, totalPages)}" or "1, {totalPages}")
                  </span>
                </div>
              </label>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-950 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
                <span>
                  <strong>Clean Print Isolation:</strong> The original document opens in a new tab; use the browser print controls.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePrint}
                disabled={isPrinting}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isPrinting ? 'Preparing Print...' : 'Proceed to Print'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

