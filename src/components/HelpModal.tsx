import React from 'react';
import { X, Phone, Mail, Globe, MapPin, CheckCircle, FileText, ShieldAlert, Award } from 'lucide-react';
import { ButuanCitySeal, CpmdSeal, ButuanOnBanner } from './Seals';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-dialog-title"
      >
        {/* Header */}
        <div className="bg-[#0a4275] text-white p-6 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-xs">
              <ButuanCitySeal size={36} className="w-9 h-9" />
            </div>
            <div>
              <h2 id="help-dialog-title" className="text-base font-bold text-white tracking-tight">
                Accreditation Assistance & Support
              </h2>
              <p className="text-xs text-blue-100">
                Technical Support and Accreditation Division (TSAD) • CPMD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs leading-relaxed text-slate-700">
          {/* ISO 9001:2015 Accreditation notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Award className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-950 text-sm">
                ISO 9001:2015 Quality Management System (QMS)
              </h3>
              <p className="text-slate-600 mt-1">
                The City Government of Butuan maintains an accredited Master List of Credible and Eligible Suppliers for all public biddings, alternative modes, and procurement activities in compliance with RA 9184 and ISO 9001:2015 quality standards.
              </p>
            </div>
          </div>

          {/* Submission Guidelines based on PDF Page 1 */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-800" />
              Documentary Requirements Guidelines (Form CPMD.TSAD.F.003)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs">1. Certified True Copies</span>
                All uploaded documents must be authentic certified true copies with legible dry seals, registry numbers, or bar/QR codes.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs">2. PhilGEPS Registration</span>
                Indicate whether your company holds Red Membership or Platinum Membership with your active certificate code.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs">3. PCAB License</span>
                Mandatory for Infrastructure contractors. Must state current license category and validity date.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs">4. DBP Bank Account</span>
                Required for electronic disbursement and payment processing through the Development Bank of the Philippines.
              </div>
            </div>
          </div>

          {/* Official Contact Details from PDF */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">
              Official CPMD Contact Directory
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 text-slate-700">
                <MapPin className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Physical Address:</strong><br />
                  CITY PROCUREMENT MANAGEMENT DEPARTMENT<br />
                  City Hall Bldg., J.P. Rosales Ave., Doongan, Butuan City, Philippines
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700">
                <Phone className="w-4 h-4 text-blue-800 shrink-0" />
                <div>
                  <strong className="text-slate-900">Direct Telephone:</strong>{' '}
                  <a href="tel:09489144370" className="text-blue-800 hover:underline font-mono">09489144370</a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700">
                <Mail className="w-4 h-4 text-blue-800 shrink-0" />
                <div>
                  <strong className="text-slate-900">Accreditation Division Email:</strong>{' '}
                  <a href="mailto:tsad.cgb@gmail.com" className="text-blue-800 hover:underline">tsad.cgb@gmail.com</a>
                  <span className="text-slate-400 mx-2">|</span>
                  <a href="mailto:cgb.cpmso@gmail.com" className="text-blue-800 hover:underline">cgb.cpmso@gmail.com</a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700">
                <Globe className="w-4 h-4 text-blue-800 shrink-0" />
                <div>
                  <strong className="text-slate-900">Official Portal:</strong>{' '}
                  <a href="http://www.butuan.gov.ph" target="_blank" rel="noreferrer" className="text-blue-800 hover:underline">
                    http://www.butuan.gov.ph
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <ButuanOnBanner className="h-6" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
