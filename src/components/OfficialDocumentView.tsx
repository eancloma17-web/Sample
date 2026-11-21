import React, { useRef, useState } from 'react';
import { SupplierApplication } from '../types';
import { ButuanCitySeal, CpmdSeal, ButuanOnBanner } from './Seals';
import { Printer, ArrowLeft, ShieldCheck, Layers, FileText, CheckCircle2, Info } from 'lucide-react';

interface OfficialDocumentViewProps {
  supplier: SupplierApplication;
  activeTab?: 'FORM' | 'LETTER' | 'BOTH';
  onBack?: () => void;
}

export const OfficialDocumentView: React.FC<OfficialDocumentViewProps> = ({
  supplier,
  activeTab: initialTab = 'BOTH',
  onBack,
}) => {
  const [tab, setTab] = useState<'FORM' | 'LETTER' | 'BOTH'>(initialTab);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isPrintingIframe, setIsPrintingIframe] = useState(false);

  // Standard window.print
  const handlePrint = () => {
    window.print();
  };

  // Fail-safe isolated print via hidden iframe (prints ONLY the document sheets with 100% purity)
  const handleIsolatedPrint = () => {
    if (!printAreaRef.current) return;
    setIsPrintingIframe(true);

    try {
      const existingFrame = document.getElementById('isolated-print-frame');
      if (existingFrame) existingFrame.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'isolated-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        setIsPrintingIframe(false);
        return;
      }

      // Collect current document styles (Tailwind + custom print styles)
      let stylesHtml = '';
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
        stylesHtml += node.outerHTML;
      });

      // Extra inline print perfection for the isolated document
      stylesHtml += `
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          .print-sheet {
            display: block !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-sheet:last-of-type,
          .print-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .border-slate-700, .border-slate-800, .border-slate-900, .border-black {
            border-color: #000000 !important;
          }
          .bg-slate-50, .bg-slate-100, .bg-slate-200 {
            background-color: #f1f5f9 !important;
          }
        </style>
      `;

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>CPMD_Official_Document_${supplier.referenceCode || 'Document'}</title>
            ${stylesHtml}
          </head>
          <body>
            <div>
              ${printAreaRef.current.innerHTML}
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setIsPrintingIframe(false);
      }, 500);
    } catch {
      window.print();
      setIsPrintingIframe(false);
    }
  };

  // Reusable official letterhead component
  const DocumentLetterhead = ({ pageNumber }: { pageNumber: string }) => (
    <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900 select-none">
      <div className="shrink-0">
        <ButuanCitySeal size={62} className="w-16 h-16 sm:w-16 sm:h-16" />
      </div>
      <div className="text-center flex-1 px-3">
        <p className="text-[10px] tracking-widest text-slate-700 font-semibold uppercase">
          Republic of the Philippines
        </p>
        <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-950 uppercase leading-snug font-serif">
          CITY GOVERNMENT OF BUTUAN
        </h1>
        <h2 className="text-xs sm:text-xs font-bold text-blue-950 uppercase tracking-wide">
          City Procurement Management Department
        </h2>
        <p className="text-[9.5px] text-slate-600">
          City Hall Bldg., J.P. Rosales Ave., Doongan, Butuan City • Tel. No. (085) 817-5000
        </p>
      </div>
      <div className="shrink-0">
        <CpmdSeal size={62} className="w-16 h-16 sm:w-16 sm:h-16" />
      </div>
    </div>
  );

  // Reusable official document footer
  const DocumentFooter = ({ pageLabel }: { pageLabel: string }) => (
    <div className="mt-3 pt-2 border-t-2 border-slate-900 flex items-center justify-between text-[9px] text-slate-700 select-none">
      <div className="space-y-0.2 font-mono text-[8.5px] text-slate-800">
        <div>Phone: <strong>09489144370 / (085) 817-5000</strong></div>
        <div>Email: <strong>cgb.cpmso@gmail.com / tsad.cgb@gmail.com</strong></div>
        <div>Website: <strong>http://www.butuan.gov.ph</strong></div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[8.5px] text-slate-600 uppercase tracking-widest">{pageLabel}</span>
          <span className="font-mono font-bold text-slate-950 bg-slate-100 px-1 py-0.2 rounded border border-slate-400 text-[8.5px]">
            CPMD.TSAD.F.003. REV00
          </span>
        </div>
        <ButuanOnBanner className="h-4.5" />
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 print:p-0 print:m-0 print:max-w-none">
      
      {/* ========================================================================= */}
      {/* TOP CONTROLS & PRINT ADVISORY (EXCLUDED FROM PRINT) */}
      {/* ========================================================================= */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Workspace</span>
              </button>
            )}

            {/* TAB SELECTOR */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setTab('BOTH')}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  tab === 'BOTH'
                    ? 'bg-[#0a4275] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Both Sheets (Sheet 1 & 2 • 2 Pages)</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('LETTER')}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'LETTER'
                    ? 'bg-[#0a4275] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sheet 1: Official Letter
              </button>
              <button
                type="button"
                onClick={() => setTab('FORM')}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'FORM'
                    ? 'bg-[#0a4275] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sheet 2: SI Sheet Form (F.003)
              </button>
            </div>
          </div>

          {/* PRIMARY ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleIsolatedPrint}
              disabled={isPrintingIframe}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Prints clean paper pages directly via dedicated isolated printer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-700" />
              <span>{isPrintingIframe ? 'Preparing Paper...' : 'Isolated Paper Print'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-extrabold text-white bg-[#07243c] hover:bg-[#051729] rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-teal-300" />
              <span>Print Official Document</span>
            </button>
          </div>
        </div>

        {/* PRINT ADVISORY BANNER */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-950 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <p className="font-bold text-sky-900 flex items-center gap-2">
              <span>Authentic Paper Printing Active:</span>
              <span className="font-mono text-[10px] bg-sky-200/70 text-sky-900 px-1.5 py-0.2 rounded border border-sky-300">
                A4 / Letter Standard
              </span>
            </p>
            <p className="text-[11px] text-sky-800">
              {tab === 'BOTH' 
                ? 'Prints exactly 2 physical paper sheets: Sheet 1 (Page 1: Official Invitation Letter) and Sheet 2 (Page 2: Form CPMD.TSAD.F.003 Supplier Information Sheet).' 
                : tab === 'LETTER'
                ? 'Prints exactly 1 physical paper sheet: Sheet 1 (Official Invitation Letter).'
                : 'Prints exactly 1 physical paper sheet: Sheet 2 (Form CPMD.TSAD.F.003 Supplier Information Sheet).'}
              {' In your browser print dialog, select '}
              <strong>"A4"</strong> or <strong>"Letter"</strong> and enable <strong>"Background graphics"</strong> to render official seals and borders.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE CANVAS CONTAINER */}
      {/* ========================================================================= */}
      <div ref={printAreaRef} className="space-y-8 print:space-y-0">
        
        {/* ======================================================================= */}
        {/* SHEET 1: OFFICIAL INVITATION LETTER (PAGE 1) */}
        {/* ======================================================================= */}
        {(tab === 'BOTH' || tab === 'LETTER') && (
          <div className="print-sheet bg-white shadow-xl border border-slate-300 rounded-xl p-6 sm:p-10 text-slate-900 max-w-4xl mx-auto font-serif flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
            
            <div>
              {/* LETTERHEAD */}
              <DocumentLetterhead pageNumber="1" />

              {/* LETTER BODY */}
              <div className="mt-5 space-y-4 text-[11.5px] sm:text-[12px] text-slate-900 leading-relaxed font-sans">
                
                {/* Date & Reference */}
                <div className="flex justify-between items-baseline text-xs text-slate-700 font-mono border-b border-slate-200 pb-1.5">
                  <span>Date: <strong className="text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></span>
                  <span>Reference Code: <strong className="text-blue-950 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">{supplier.referenceCode}</strong></span>
                </div>

                {/* Addressee */}
                <div className="pt-1 font-bold uppercase tracking-wide text-slate-950 text-xs font-sans">
                  THE PROPRIETOR / AUTHORIZED REPRESENTATIVE<br />
                  <span className="text-blue-950 font-black text-sm">{supplier.businessName}</span><br />
                  <span className="font-normal normal-case text-slate-700 text-xs">{supplier.principalAddress}</span>
                </div>

                {/* Subject Line */}
                <div className="pt-0.5">
                  <span className="font-black underline text-slate-950 uppercase text-xs tracking-wide">
                    Subject: Master List of Suppliers of the City Government of Butuan
                  </span>
                </div>

                {/* Salutation */}
                <p className="font-semibold text-slate-900 pt-0.5">Dear Sir / Madam,</p>

                <p className="font-bold text-blue-950 italic">
                  Warm ButuanON Greetings!
                </p>

                <p className="text-justify indent-6">
                  We would like to thank you for providing the City Government of Butuan quality goods and services, infrastructure projects and consulting services for the past years.
                </p>

                <p className="text-justify indent-6">
                  To maintain a list of credible and eligible suppliers, the City Government of Butuan, being an agency implementing Quality Management System (QMS) and as an International Organization for Standardization (ISO) 9001:2015 accredited, requests your company to submit a duly filled-up Supplier Information Sheet and attach certified true copies of the following documents:
                </p>

                {/* 8 Mandatory Documents List */}
                <ol className="list-decimal pl-10 space-y-1 font-semibold text-slate-900 text-[11px] sm:text-[11.5px]">
                  <li>Mayor’s Permit (Current CY Validity)</li>
                  <li>Department of Trade and Industry (DTI) / Securities and Exchange Commission (SEC) Certificate</li>
                  <li>Contractor’s Certificate (Specialty, Project, if any)</li>
                  <li>Latest PhilGEPS Registration (Platinum or Red Membership)</li>
                  <li>Tax Clearance Certificate (BIR)</li>
                  <li>Certificate of Exclusive Distributorship (if applicable)</li>
                  <li>PCAB License (Mandatory for Infrastructure Contractors)</li>
                  <li>DBP Account Proof (Mandatory per Executive Order No. 27 Series 2023)</li>
                </ol>

                <p className="text-justify indent-6">
                  Once accomplished, please send your accomplished documents to the following address:
                </p>

                <div className="pl-4 border-l-4 border-blue-900 py-1 text-xs font-bold text-slate-900 bg-slate-50">
                  CITY PROCUREMENT MANAGEMENT DEPARTMENT<br />
                  <span className="font-normal text-slate-700">City Hall Bldg., J.P. Rosales Ave., Doongan, Butuan City</span>
                </div>

                <p className="text-justify indent-6">
                  For any questions or clarifications, you may contact the Technical Support and Accreditation Division via official e-mail address <a href="mailto:tsad.cgb@gmail.com" className="text-blue-900 underline font-bold">tsad.cgb@gmail.com</a>.
                </p>

                <p>Your cooperation is highly appreciated.</p>
                <p>Thank you very much.</p>

                {/* Signatory Block */}
                <div className="pt-4">
                  <p className="text-xs">Very truly yours,</p>
                  <div className="mt-6 font-bold text-slate-950 text-xs uppercase tracking-wide">
                    <span className="border-b-2 border-slate-900 pb-0.5 inline-block font-black">
                      FOR. VINCENT PHILIP F. PIENCENAVES
                    </span><br />
                    <span className="font-normal normal-case text-slate-700 text-[10.5px] block pt-0.5">
                      Acting Department Head, City Procurement Management Department
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <DocumentFooter pageLabel="Sheet 1 of 2 • Official Invitation Letter Notice" />
          </div>
        )}

        {/* VISIBLE PAGE BREAK DELIMITER (SCREEN ONLY) */}
        {tab === 'BOTH' && (
          <div className="no-print my-6 flex items-center justify-center gap-3 text-slate-400 text-xs font-mono">
            <div className="h-px bg-slate-300 flex-1" />
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200 font-bold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              <span>PAGE BREAK • SHEET 2 BEGINS ON NEXT PHYSICAL PAPER</span>
            </span>
            <div className="h-px bg-slate-300 flex-1" />
          </div>
        )}

        {/* ======================================================================= */}
        {/* SHEET 2: FORM CPMD.TSAD.F.003 SUPPLIER INFORMATION SHEET (PAGE 2) */}
        {/* ======================================================================= */}
        {(tab === 'BOTH' || tab === 'FORM') && (
          <div className="print-sheet bg-white shadow-xl border border-slate-300 rounded-xl p-6 sm:p-8 text-slate-900 max-w-4xl mx-auto font-sans flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
            
            <div>
              {/* LETTERHEAD */}
              <DocumentLetterhead pageNumber="2" />

              {/* FORM TITLE */}
              <div className="mt-2 text-center">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 font-serif">
                  SUPPLIER INFORMATION SHEET
                </h2>
                <p className="text-[9.5px] text-slate-600 font-mono">
                  FORM CPMD.TSAD.F.003. REV00 • ISO 9001:2015 ACCREDITED
                </p>
              </div>

              {/* CLASSIFICATION CHECKBOXES */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-1 my-1.5 border-y-2 border-slate-800 font-bold text-[10.5px] uppercase bg-slate-50">
                <label className="flex items-center gap-1.5 cursor-default">
                  <span className="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center bg-white font-bold text-[10px]">
                    {supplier.categories.includes('GOODS AND SERVICES') ? '✓' : ''}
                  </span>
                  <span>GOODS AND SERVICES</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-default">
                  <span className="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center bg-white font-bold text-[10px]">
                    {supplier.categories.includes('INFRASTRUCTURE PROJECTS') ? '✓' : ''}
                  </span>
                  <span>INFRASTRUCTURE PROJECTS</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-default">
                  <span className="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center bg-white font-bold text-[10px]">
                    {supplier.categories.includes('CONSULTING SERVICES') ? '✓' : ''}
                  </span>
                  <span>CONSULTING SERVICES</span>
                </label>
              </div>

              {/* SECTION 1: GENERAL INFORMATION */}
              <div className="border border-slate-800 text-[10.5px] my-1.5">
                <div className="bg-slate-200 px-2 py-0.5 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wide text-slate-900">
                  GENERAL INFORMATION
                </div>

                {/* Business Name */}
                <div className="p-1.5 border-b border-slate-800">
                  <div className="text-[9px] uppercase font-bold text-slate-600">
                    BUSINESS NAME OF SUPPLIER / CONTRACTOR / CONSULTANT:
                  </div>
                  <div className="font-black text-xs text-blue-950 uppercase pt-0.5">
                    {supplier.businessName || '—'}
                  </div>
                </div>

                {/* Owner & Rep */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-b border-slate-800">
                  <div className="p-1.5">
                    <div className="text-[9px] uppercase font-bold text-slate-600">
                      NAME OF PROPRIETOR / BUSINESS OWNER:
                    </div>
                    <div className="font-bold text-slate-900 pt-0.5 uppercase text-[10.5px]">
                      {supplier.proprietorName || '—'}
                    </div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-[9px] uppercase font-bold text-slate-600">
                      NAME OF AUTHORIZED REPRESENTATIVE:
                    </div>
                    <div className="font-bold text-slate-900 pt-0.5 uppercase text-[10.5px]">
                      {supplier.authorizedRepName || '—'}
                    </div>
                    <div className="flex items-center gap-3 pt-0.5 text-[9px] text-slate-700">
                      <span className="flex items-center gap-1">
                        <span className="font-bold font-mono">[{supplier.repAuthType === 'SPA' ? '✓' : ' '}]</span> with SPA
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-bold font-mono">[{supplier.repAuthType === 'SECRETARY_CERTIFICATE' ? '✓' : ' '}]</span> with Secretary’s Certificate
                      </span>
                    </div>
                  </div>
                </div>

                {/* Principal Address & Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-b border-slate-800">
                  <div className="p-1.5">
                    <div className="text-[9px] uppercase font-bold text-slate-600">
                      PRINCIPAL PLACE OF BUSINESS (ADDRESS):
                    </div>
                    <div className="text-slate-900 pt-0.5 text-[10.5px]">
                      {supplier.principalAddress || '—'}
                    </div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-[9px] uppercase font-bold text-slate-600">
                      BRANCH, if any:
                    </div>
                    <div className="text-slate-900 pt-0.5 text-[10.5px]">
                      {supplier.branchAddress || 'None'}
                    </div>
                  </div>
                </div>

                {/* Contact Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
                  <div className="p-1.5">
                    <div className="text-[9px] uppercase font-bold text-slate-600">
                      CONTACT NUMBER:
                    </div>
                    <div className="text-slate-900 pt-0.5 font-bold font-mono text-[10.5px]">
                      {supplier.contactNumber || '—'}
                    </div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-[9px] uppercase font-bold text-slate-600">
                      CONTACT PERSON:
                    </div>
                    <div className="text-slate-900 pt-0.5 font-medium text-[10.5px]">
                      {supplier.contactPerson || '—'}
                    </div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-[9px] uppercase font-bold text-slate-600">
                      COMPANY EMAIL ADDRESS:
                    </div>
                    <div className="text-slate-900 pt-0.5 font-bold font-mono text-[10px]">
                      {supplier.companyEmail || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DOCUMENTARY REQUIREMENTS */}
              <div className="border border-slate-800 text-[10px] my-1.5">
                <div className="bg-slate-200 px-2 py-0.5 font-bold border-b border-slate-800 text-[9.5px] text-slate-900">
                  DOCUMENTARY REQUIREMENTS: Kindly ( ✓ ) check if the certified true copy of the document is present and attached.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-b border-slate-800">
                  {/* Left Column */}
                  <div className="p-1.5 space-y-1.5">
                    {/* PhilGEPS */}
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-slate-950">
                        <span className="font-mono text-xs font-bold">[{supplier.philgepsType !== 'NONE' ? '✓' : ' '}]</span>
                        <span>PHILGEPS CERTIFICATE</span>
                      </div>
                      <div className="pl-5 space-y-0.2 text-[9px] text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">[{supplier.philgepsType === 'RED' ? '✓' : ' '}]</span>
                          <span>RED Membership</span>
                          <span className="font-mono ml-2">[{supplier.philgepsType === 'PLATINUM' ? '✓' : ' '}]</span>
                          <span>PLATINUM Membership</span>
                        </div>
                        {supplier.philgepsCertNumber && (
                          <div className="text-[9px] text-slate-600 font-mono">
                            Certificate No: {supplier.philgepsCertNumber}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DTI */}
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-slate-950">
                        <span className="font-mono text-xs font-bold">[{supplier.hasDtiSecCert ? '✓' : ' '}]</span>
                        <span>DTI REGISTRATION / SEC CERTIFICATE</span>
                      </div>
                      {supplier.dtiSecNumber && (
                        <div className="text-[9px] text-slate-600 pl-5 font-mono">
                          Registration No: {supplier.dtiSecNumber}
                        </div>
                      )}
                    </div>

                    {/* Tax Clearance */}
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-slate-950">
                        <span className="font-mono text-xs font-bold">[{supplier.hasTaxClearance ? '✓' : ' '}]</span>
                        <span>TAX CLEARANCE CERTIFICATE</span>
                      </div>
                      {supplier.taxClearanceValidity && (
                        <div className="text-[9px] text-slate-600 pl-5">
                          Validity: {supplier.taxClearanceValidity}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="p-1.5 space-y-1.5">
                    {/* Exclusive Distributorship */}
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-slate-950">
                        <span className="font-mono text-xs font-bold">[{supplier.exclusiveDistributorship ? '✓' : ' '}]</span>
                        <span>CERTIFICATE OF EXCLUSIVE DISTRIBUTORSHIP</span>
                      </div>
                      {supplier.exclusiveDistributorDetails && (
                        <div className="text-[9px] text-slate-600 pl-5">
                          {supplier.exclusiveDistributorDetails}
                        </div>
                      )}
                    </div>

                    {/* PCAB */}
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-slate-950">
                        <span className="font-mono text-xs font-bold">[{supplier.hasPcabLicense ? '✓' : ' '}]</span>
                        <span>PCAB LICENSE (for contractors)</span>
                      </div>
                      {supplier.pcabLicenseNumber && (
                        <div className="text-[9px] text-slate-600 pl-5 font-mono">
                          License No: {supplier.pcabLicenseNumber} ({supplier.pcabCategory || 'General'})
                        </div>
                      )}
                    </div>

                    {/* Company Profile */}
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-slate-950">
                        <span className="font-mono text-xs font-bold">[{supplier.hasCompanyProfile ? '✓' : ' '}]</span>
                        <span>COMPANY PROFILE</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Foreign Reciprocity */}
                <div className="p-1.5 border-b border-slate-800">
                  <div className="font-bold flex items-start gap-1.5 text-slate-950">
                    <span className="font-mono text-xs font-bold">[{supplier.hasForeignReciprocity ? '✓' : ' '}]</span>
                    <span className="text-[9px]">
                      CERTIFICATION ISSUED BY A FOREIGN GOVERNMENT OFFICE VALIDATING RECIPROCITY OF RIGHTS FOR FILIPINOS (if foreign supplier)
                    </span>
                  </div>
                  {supplier.foreignReciprocityDetails && (
                    <div className="text-[9px] text-slate-600 pl-5">
                      Details: {supplier.foreignReciprocityDetails}
                    </div>
                  )}
                </div>

                {/* Others (Mayor's Permit, DBP Account, etc.) */}
                <div className="p-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-slate-950">
                    <span className="font-mono text-xs font-bold">
                      [{supplier.otherDocumentsAttached || supplier.hasMayorsPermit || supplier.hasDbpAccount ? '✓' : ' '}]
                    </span>
                    <span>OTHERS (e.g., Joint Venture Agreement, Mayor’s Permit, DBP Account Proof, etc.)</span>
                  </div>
                  <div className="text-[9.5px] text-slate-800 pl-5 font-medium">
                    Specify: <span className="underline font-bold">
                      {[
                        supplier.hasMayorsPermit ? `Mayor's Permit (${supplier.mayorsPermitNumber || 'Attached'})` : null,
                        supplier.hasDbpAccount ? `DBP Account (${supplier.dbpAccountNumber || 'Attached'})` : null,
                        supplier.otherDocumentsAttached
                      ].filter(Boolean).join('; ') || 'None specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* CERTIFICATION STATEMENT */}
              <div className="pt-1.5 pb-2 text-center space-y-1.5">
                <p className="font-bold text-slate-950 text-[10.5px] italic">
                  I/We hereby certify that the information stated and documents attached herein are true and correct.
                </p>

                <div className="flex flex-row justify-between items-end px-8 pt-4 gap-4">
                  <div className="text-center w-60 border-t border-slate-900 pt-0.5">
                    <div className="font-black uppercase text-slate-950 text-[10.5px]">
                      {supplier.signatoryPrintedName || supplier.authorizedRepName || supplier.proprietorName}
                    </div>
                    <div className="text-[8.5px] text-slate-600 font-bold uppercase">
                      Printed Name and Signature
                    </div>
                  </div>

                  <div className="text-center w-40 border-t border-slate-900 pt-0.5">
                    <div className="font-bold text-slate-950 text-[10px] font-mono">
                      {supplier.submissionDate || new Date().toISOString().slice(0, 10)}
                    </div>
                    <div className="text-[8.5px] text-slate-600 font-bold uppercase">Date</div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: TO BE FILLED OUT BY CPMD PERSONNEL */}
              <div className="border border-slate-900 bg-slate-50/80 p-2 space-y-2 text-[10px] my-1.5">
                <div className="font-black uppercase text-[10px] tracking-wide text-blue-950 border-b border-slate-400 pb-0.5 flex items-center justify-between">
                  <span>To be filled out by CPMD personnel</span>
                  <span className="text-[9px] font-bold text-emerald-800 font-mono">
                    ISO 9001:2015 QUALITY CONTROL
                  </span>
                </div>

                <div className="text-[9.5px]">
                  Received Date: <strong className="underline ml-2 font-mono">{supplier.receivedDate || 'Pending receipt'}</strong>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  {/* Verified By */}
                  <div className="space-y-0.5">
                    <div className="text-[8.5px] uppercase font-bold text-slate-600">Verified by:</div>
                    <div className="pt-1.5 border-t border-slate-800">
                      <div className="font-black uppercase text-[10px] text-slate-950">
                        {supplier.verifiedBy || 'Engr. MARK STEVEN T. ROSALES'}
                      </div>
                      <div className="text-[9px] text-slate-800 font-semibold">
                        Technical Support and Accreditation Division Head
                      </div>
                      {supplier.verifiedDate && (
                        <div className="text-[8.5px] text-emerald-800 font-bold font-mono pt-0.2">
                          ✓ Verified Date: {supplier.verifiedDate}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Department Head review only; no final approval authority */}
                  <div className="space-y-0.5">
                    <div className="text-[8.5px] uppercase font-bold text-slate-600">Department Head review (not final approval):</div>
                    <div className="pt-1.5 border-t border-slate-800">
                      <div className="font-black uppercase text-[10px] text-slate-950">
                        {supplier.approvedBy ? `${supplier.approvedBy} (historical record — verify authorization)` : 'No recorded Department Head recommendation'}
                      </div>
                      <div className="text-[9px] text-slate-800 font-semibold">
                        Acting Department Head, CPMD
                      </div>
                      {supplier.approvedDate && (
                        <div className="text-[8.5px] text-emerald-800 font-bold font-mono pt-0.2">
                          Historical record date (not final approval): {supplier.approvedDate}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {supplier.approvalRemarks && (
                  <div className="text-[9.5px] bg-white p-1.5 rounded border border-slate-300 text-slate-800">
                    <span className="font-bold text-blue-950">Recorded Remarks (not accreditation):</span> {supplier.approvalRemarks}
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <DocumentFooter pageLabel="Sheet 2 of 2 • Form CPMD.TSAD.F.003" />
          </div>
        )}
      </div>
    </div>
  );
};
