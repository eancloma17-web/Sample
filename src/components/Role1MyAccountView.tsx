import React, { useState } from 'react';
import { UserAccount, SupplierApplication } from '../types';
import { 
  UserCog, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Save, 
  Lock, 
  Info,
  ShieldCheck
} from 'lucide-react';

interface Role1MyAccountViewProps {
  currentUser: UserAccount;
  supplier: SupplierApplication;
  onUpdateSupplier: (updatedSupplier: SupplierApplication) => void;
  onUpdateUser: (updatedUser: UserAccount) => void;
}

export const Role1MyAccountView: React.FC<Role1MyAccountViewProps> = ({
  currentUser,
  supplier,
  onUpdateSupplier,
  onUpdateUser,
}) => {
  const [contactPerson, setContactPerson] = useState(supplier.contactPerson || '');
  const [contactNumber, setContactNumber] = useState(supplier.contactNumber || '');
  const [companyEmail, setCompanyEmail] = useState(supplier.companyEmail || '');
  const [branchAddress, setBranchAddress] = useState(supplier.branchAddress || '');
  const [noBranchApplies, setNoBranchApplies] = useState(supplier.noBranchApplies ?? (!supplier.branchAddress));
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveContactFields = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSupplier: SupplierApplication = {
      ...supplier,
      contactPerson: contactPerson.trim(),
      contactNumber: contactNumber.trim(),
      companyEmail: companyEmail.trim(),
      branchAddress: noBranchApplies ? '' : branchAddress.trim(),
      noBranchApplies: noBranchApplies,
      updatedAt: new Date().toISOString()
    };

    onUpdateSupplier(updatedSupplier);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
              Supplier • Menu Item 6
            </span>
            <span className="text-xs text-slate-400 font-mono">{supplier.referenceCode}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a3560] tracking-tight mt-1">
            My Account & Contact Profile
          </h1>
          <p className="text-xs text-slate-500">
            View supplier account details and edit permitted contact information fields
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-blue-50 text-blue-900 border border-blue-200 font-mono text-xs px-2.5 py-1 rounded-lg">
            Ref: {supplier.referenceCode}
          </span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Permitted contact fields updated successfully.</span>
        </div>
      )}

      {/* 1. READ-ONLY REGISTRY IDENTITY (Preserved official fields) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Official Supplier Registry Identity (Read-Only)</span>
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">CPMD Registry Record</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Business Name of Supplier / Contractor / Consultant:
            </span>
            <span className="font-bold text-blue-950 uppercase text-xs block">
              {supplier.businessName}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Name of Proprietor / Business Owner:
            </span>
            <span className="font-semibold text-slate-900 uppercase text-xs block">
              {supplier.proprietorName}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Principal Place of Business (Address):
            </span>
            <span className="text-slate-800 block">
              {supplier.principalAddress}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Registered Classifications:
            </span>
            <span className="font-semibold text-blue-900 block">
              {supplier.categories.join(' • ')}
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-600 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>
            Official business name and registered principal address can only be amended via formal letter to the Technical Support and Accreditation Division.
          </span>
        </div>
      </div>

      {/* 2. PERMITTED EDITABLE CONTACT & ACCOUNT FIELDS */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <UserCog className="w-4 h-4 text-[#0a4f94]" />
            <span>Permitted Editable Contact Fields</span>
          </h2>
          <p className="text-xs text-slate-500">
            As specified in Role 1 Section 1 Item 6: Suppliers may edit only permitted contact/account fields.
          </p>
        </div>

        <form onSubmit={handleSaveContactFields} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Person */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">
                Designated Contact Person: *
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Full name of contact person"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
              />
            </div>

            {/* Contact Number */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">
                Contact Number (Landline / Mobile): *
              </label>
              <input
                type="text"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g., 0917-000-0000 or (085) 342-0000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
              />
            </div>

            {/* Company Email Address */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800">
                  Company Email Address: *
                </label>
                <span className="text-[10px] text-slate-400">
                  Business Correspondence
                </span>
              </div>
              <input
                type="email"
                required
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="inquiries@company.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
              />
            </div>

            {/* Login Email (Distinguished) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800">
                  Login Credential Email:
                </label>
                <span className="text-[10px] text-slate-400">
                  Supabase Auth Account
                </span>
              </div>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 font-mono text-slate-600 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-500 block">
                Manage login credentials under Menu Item 5: Account Security.
              </span>
            </div>

            {/* Branch Address */}
            <div className="md:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800">
                  Branch, if any:
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noBranchApplies}
                    onChange={(e) => {
                      setNoBranchApplies(e.target.checked);
                      if (e.target.checked) setBranchAddress('');
                    }}
                  />
                  <span>No branch applies</span>
                </label>
              </div>
              <input
                type="text"
                disabled={noBranchApplies}
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
                placeholder={noBranchApplies ? 'No branch applies' : 'Enter branch address or location'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2 bg-[#0a4f94] hover:bg-[#083e75] text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Account Contact Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
