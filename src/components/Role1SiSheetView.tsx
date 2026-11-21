import React, { useState } from 'react';
import { 
  SupplierApplication, 
  SupplierCategory, 
  PhilgepsType, 
  RepresentativeAuthType 
} from '../types';
import { 
  Save, 
  Printer, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  HelpCircle,
  Building,
  Check
} from 'lucide-react';
import { ButuanCitySeal, CpmdSeal, ButuanOnBanner } from './Seals';

interface Role1SiSheetViewProps {
  supplier: SupplierApplication;
  onUpdateSupplier: (updated: SupplierApplication) => Promise<boolean>;
  onViewPrintableForm: () => void;
  onViewLetter: () => void;
  onOpenHelp: () => void;
}

export const Role1SiSheetView: React.FC<Role1SiSheetViewProps> = ({
  supplier,
  onUpdateSupplier,
  onViewPrintableForm,
  onViewLetter,
  onOpenHelp,
}) => {
  const [formData, setFormData] = useState<SupplierApplication>({ ...supplier });
  const [savedMessage, setSavedMessage] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Sync if supplier updates externally
  React.useEffect(() => {
    setFormData({ ...supplier });
  }, [supplier]);

  const isEditable = supplier.status === 'DRAFT' || supplier.status === 'REVISION_REQUESTED';

  const handleCategoryToggle = (category: SupplierCategory) => {
    if (!isEditable) return;
    let updated = [...formData.categories];
    if (updated.includes(category)) {
      if (updated.length > 1) {
        updated = updated.filter(c => c !== category);
      }
    } else {
      updated.push(category);
    }
    setFormData({ ...formData, categories: updated });
  };

  const handleSave = async () => {
    const errors: string[] = [];
    if (!formData.businessName?.trim()) errors.push('Business Name is required.');
    if (!formData.proprietorName?.trim()) errors.push('Name of Proprietor / Business Owner is required.');
    if (!formData.principalAddress?.trim()) errors.push('Principal Place of Business is required.');
    if (!formData.contactNumber?.trim()) errors.push('Contact Number is required.');
    if (!formData.contactPerson?.trim()) errors.push('Contact Person is required.');
    if (!formData.companyEmail?.trim()) errors.push('Company Email Address is required.');

    setValidationErrors(errors);

    const updated: SupplierApplication = {
      ...formData,
      updatedAt: new Date().toISOString()
    };
    if (!(await onUpdateSupplier(updated))) {
      setValidationErrors(['Save failed. Changes were not confirmed in Supabase. Please retry.']);
      return;
    }
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
              Form CPMD.TSAD.F.003. REV00
            </span>
            <span className="text-xs text-slate-400 font-mono">{supplier.referenceCode}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a3560] tracking-tight mt-1">
            Supplier Information Sheet (SI Sheet)
          </h1>
          <p className="text-xs text-slate-500">
            Source-aligned fields and official terminology. City Government of Butuan • CPMD TSAD
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onViewLetter}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Invitation Letter
          </button>
          <button
            onClick={onViewPrintableForm}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0a4275] hover:bg-[#08355e] rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printable Official Form</span>
          </button>
        </div>
      </div>

      {/* Lock Notice if not draft or revision requested */}
      {!isEditable && (
        <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 flex items-center gap-3 text-xs text-slate-700">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Fields are read-only:</strong> This application has already been {supplier.status === 'APPROVED_MASTERLIST' ? 'approved' : 'submitted for review'}. Only CPMD personnel may review or update office fields. If a correction is needed, contact the Technical Support and Accreditation Division.
          </span>
        </div>
      )}

      {/* Save Success Alert */}
      {savedMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Supplier Information Sheet changes saved successfully.</span>
        </div>
      )}

      {/* Validation Warnings */}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Please note the following incomplete required fields:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* FORM BODY CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8 text-xs text-slate-800">
        
        {/* 1. Supplier Category (Section 3 Implementation Requirement) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <label className="font-bold uppercase tracking-wider text-slate-900 text-xs">
              Supplier Category (Check all that apply)
            </label>
            <span className="text-[11px] text-slate-500">Official Classification</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['GOODS AND SERVICES', 'INFRASTRUCTURE PROJECTS', 'CONSULTING SERVICES'] as SupplierCategory[]).map((cat) => {
              const isChecked = formData.categories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  disabled={!isEditable}
                  onClick={() => handleCategoryToggle(cat)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isChecked
                      ? 'bg-blue-50/80 border-[#0a4f94] text-[#0a3560] font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  } ${!isEditable ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                >
                  <span className="text-xs uppercase">{cat}</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                    isChecked ? 'bg-[#0a4f94] border-[#0a4f94] text-white' : 'border-slate-300'
                  }`}>
                    {isChecked && <Check className="w-3 h-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. General Information Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="font-bold text-sm text-[#0a3560] uppercase tracking-wide">
              General Information
            </h2>
            <span className="text-[11px] text-slate-500">Section 3 Official Fields</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Name of Supplier/Contractor/Consultant */}
            <div className="md:col-span-2 space-y-1">
              <label className="block font-bold text-slate-800">
                Business Name of Supplier / Contractor / Consultant: *
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden uppercase font-semibold disabled:bg-slate-100"
                placeholder="Preserve the field's official meaning and wording"
              />
            </div>

            {/* Name of Proprietor / Business Owner */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">
                Name of Proprietor / Business Owner: *
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.proprietorName}
                onChange={(e) => setFormData({ ...formData, proprietorName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden uppercase disabled:bg-slate-100"
              />
            </div>

            {/* Name of Authorized Representative */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">
                Name of Authorized Representative:
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.authorizedRepName}
                onChange={(e) => setFormData({ ...formData, authorizedRepName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden uppercase disabled:bg-slate-100"
              />
              <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Representation authorization:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="repAuthType"
                    disabled={!isEditable}
                    checked={formData.repAuthType === 'SPA'}
                    onChange={() => setFormData({ ...formData, repAuthType: 'SPA' })}
                  />
                  <span>with SPA</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="repAuthType"
                    disabled={!isEditable}
                    checked={formData.repAuthType === 'SECRETARY_CERTIFICATE'}
                    onChange={() => setFormData({ ...formData, repAuthType: 'SECRETARY_CERTIFICATE' })}
                  />
                  <span>with Secretary’s Certificate</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="repAuthType"
                    disabled={!isEditable}
                    checked={formData.repAuthType === 'NONE'}
                    onChange={() => setFormData({ ...formData, repAuthType: 'NONE' })}
                  />
                  <span>None / Direct Owner</span>
                </label>
              </div>
            </div>

            {/* Principal Place of Business (Address) */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">
                Principal Place of Business (Address): *
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.principalAddress}
                onChange={(e) => setFormData({ ...formData, principalAddress: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden disabled:bg-slate-100"
              />
            </div>

            {/* Branch, if any */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  Branch, if any:
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isEditable}
                    checked={formData.noBranchApplies ?? (!formData.branchAddress)}
                    onChange={(e) => {
                      const noBranch = e.target.checked;
                      setFormData({ 
                        ...formData, 
                        noBranchApplies: noBranch, 
                        branchAddress: noBranch ? '' : formData.branchAddress 
                      });
                    }}
                  />
                  <span>No branch applies</span>
                </label>
              </div>
              <input
                type="text"
                disabled={!isEditable || formData.noBranchApplies}
                value={formData.branchAddress || ''}
                onChange={(e) => setFormData({ ...formData, branchAddress: e.target.value })}
                placeholder={formData.noBranchApplies ? 'No branch applies' : 'Enter branch address or location'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden disabled:bg-slate-100"
              />
            </div>

            {/* Contact Number */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">
                Contact Number: *
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="Landline and/or Mobile number"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden font-mono disabled:bg-slate-100"
              />
            </div>

            {/* Contact Person */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">
                Contact Person: *
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Full name of designated contact person"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden disabled:bg-slate-100"
              />
            </div>

            {/* Company Email Address (distinguish from login email) */}
            <div className="md:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  Company Email Address: *
                </label>
                <span className="text-[10px] text-slate-500">
                  Distinguished from login email for official correspondence
                </span>
              </div>
              <input
                type="email"
                disabled={!isEditable}
                value={formData.companyEmail}
                onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                placeholder="official@company.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {/* 3. Specific Registration / Licensure Numbers (from PDF) */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-sm text-[#0a3560] uppercase tracking-wide">
              Documentary Reference Information
            </h3>
            <span className="text-[11px] text-slate-500">Checklist Cross-Reference</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* PhilGEPS Certificate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">PhilGEPS Certificate:</label>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="philgepsType"
                      disabled={!isEditable}
                      checked={formData.philgepsType === 'RED'}
                      onChange={() => setFormData({ ...formData, philgepsType: 'RED' })}
                    />
                    <span>RED Membership</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="philgepsType"
                      disabled={!isEditable}
                      checked={formData.philgepsType === 'PLATINUM'}
                      onChange={() => setFormData({ ...formData, philgepsType: 'PLATINUM' })}
                    />
                    <span className="font-bold text-blue-900">PLATINUM Membership</span>
                  </label>
                </div>
              </div>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.philgepsCertNumber}
                onChange={(e) => setFormData({ ...formData, philgepsCertNumber: e.target.value })}
                placeholder="Certificate / Registration Number"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono disabled:bg-slate-100"
              />
            </div>

            {/* DTI / SEC */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">
                DTI / SEC Registration Certificate:
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.dtiSecNumber || ''}
                onChange={(e) => setFormData({ ...formData, dtiSecNumber: e.target.value, hasDtiSecCert: true })}
                placeholder="Registration Number"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono disabled:bg-slate-100"
              />
            </div>

            {/* PCAB License (for contractors) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">
                PCAB License (for contractors):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  disabled={!isEditable}
                  value={formData.pcabLicenseNumber || ''}
                  onChange={(e) => setFormData({ ...formData, pcabLicenseNumber: e.target.value, hasPcabLicense: true })}
                  placeholder="License No."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono disabled:bg-slate-100"
                />
                <input
                  type="text"
                  disabled={!isEditable}
                  value={formData.pcabCategory || ''}
                  onChange={(e) => setFormData({ ...formData, pcabCategory: e.target.value })}
                  placeholder="Category (e.g. AAA, B)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Tax Clearance Certificate */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">
                Tax Clearance Certificate:
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.taxClearanceValidity || ''}
                onChange={(e) => setFormData({ ...formData, taxClearanceValidity: e.target.value, hasTaxClearance: true })}
                placeholder="Validity date or TCC Number"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
              />
            </div>

            {/* Exclusive Distributorship */}
            <div className="md:col-span-2 space-y-1">
              <label className="font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isEditable}
                  checked={formData.exclusiveDistributorship}
                  onChange={(e) => setFormData({ ...formData, exclusiveDistributorship: e.target.checked })}
                />
                <span>Certificate of Exclusive Distributorship (if available)</span>
              </label>
              {formData.exclusiveDistributorship && (
                <input
                  type="text"
                  disabled={!isEditable}
                  value={formData.exclusiveDistributorDetails || ''}
                  onChange={(e) => setFormData({ ...formData, exclusiveDistributorDetails: e.target.value })}
                  placeholder="Specify product lines or manufacturer authorization details"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                />
              )}
            </div>

            {/* Others (Specify) */}
            <div className="md:col-span-2 space-y-1">
              <label className="font-bold text-slate-800 block">
                Others (e.g., Joint Venture Agreement, Contractor’s Specialty, DBP Account) — specify:
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.otherDocumentsAttached || ''}
                onChange={(e) => setFormData({ ...formData, otherDocumentsAttached: e.target.value })}
                placeholder="Specify additional documentation"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {/* 4. Supplier Declaration (Preserve exact wording from PDF) */}
        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-200 space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-blue-950">
              Supplier Declaration
            </h3>
            <p className="text-[11px] text-slate-600">
              Preserved source text: "I/We hereby certify that the information stated and documents attached herein are true and correct."
            </p>
          </div>

          <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200 cursor-pointer">
            <input
              type="checkbox"
              disabled={!isEditable}
              checked={formData.certifiedTrueAndCorrect}
              onChange={(e) => setFormData({ ...formData, certifiedTrueAndCorrect: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded text-[#0a4f94]"
            />
            <span className="font-bold text-xs text-slate-900 leading-normal">
              I/We hereby certify that the information stated and documents attached herein are true and correct.
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">
                Printed Name of Signatory:
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.signatoryPrintedName}
                onChange={(e) => setFormData({ ...formData, signatoryPrintedName: e.target.value })}
                placeholder="Full name of proprietor or authorized representative"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white uppercase font-semibold disabled:bg-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">
                Date:
              </label>
              <input
                type="date"
                disabled={!isEditable}
                value={formData.submissionDate || new Date().toISOString().slice(0, 10)}
                onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono disabled:bg-slate-100"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            Note: Use client-approved declaration/signature method. Typing text does not constitute an unverified electronic signature.
          </p>
        </div>

        {/* 5. CPMD Personnel-Only Fields (Explicitly Read-Only for Suppliers) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-300 pb-2">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold uppercase text-[11px] text-slate-800">
                To be filled out by CPMD personnel (Office use only)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 italic">No supplier editing controls</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px] text-slate-700">
            <div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Received Date:</span>
              <span className="font-mono">{formData.receivedDate || 'Pending receipt'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Verified by:</span>
              <span>{formData.verifiedBy || 'Engr. MARK STEVEN T. ROSALES'}</span>
              <span className="text-[9px] text-slate-500 block">Technical Support and Accreditation Division Head</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Approved by:</span>
              <span>{formData.approvedBy || 'Not designated'}</span>
              <span className="text-[9px] text-slate-500 block">Acting Department Head</span>
            </div>
          </div>
        </div>

        {/* Actions bar */}
        {isEditable && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              Save your progress at any time. Form fields can be edited prior to final submission.
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#0a4f94] hover:bg-[#083e75] text-white font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Supplier Information Sheet</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
