import React from 'react';
import { 
  Role1MenuItem, 
  SupplierApplication, 
  UserAccount 
} from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  UploadCloud, 
  Activity, 
  ShieldCheck, 
  UserCog, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Building2,
  Menu,
  X
} from 'lucide-react';
import { ButuanCitySeal, CpmdSeal, ButuanOnBanner } from './Seals';

interface Role1SidebarProps {
  currentMenu: Role1MenuItem;
  onSelectMenu: (menu: Role1MenuItem) => void;
  isOpen: boolean;
  onToggle: () => void;
  supplier: SupplierApplication;
  currentUser: UserAccount;
  onSignOut: () => void;
  onOpenHelp: () => void;
}

export const Role1Sidebar: React.FC<Role1SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isOpen,
  onToggle,
  supplier,
  currentUser,
  onSignOut,
  onOpenHelp,
}) => {
  // Calculate incomplete items for notification indicator
  const missingCategories = supplier.categories.length === 0;
  const missingGeneral = !supplier.businessName || !supplier.proprietorName || !supplier.contactNumber || !supplier.companyEmail;
  const missingDocsCount = supplier.documents.filter(d => d.required && !d.attached).length;
  const totalIncomplete = (missingCategories ? 1 : 0) + (missingGeneral ? 1 : 0) + missingDocsCount;

  const menuItems: { id: Role1MenuItem; label: string; number: number; icon: React.ComponentType<{ className?: string }>; badge?: string | number; badgeColor?: string }[] = [
    { 
      id: 'dashboard', 
      number: 1, 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      badge: totalIncomplete > 0 ? `${totalIncomplete}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    { 
      id: 'si-sheet', 
      number: 2, 
      label: 'Supplier Information Sheet', 
      icon: FileText,
      badge: missingGeneral ? 'Incomplete' : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    { 
      id: 'document-submission', 
      number: 3, 
      label: 'Document Submission', 
      icon: UploadCloud,
      badge: missingDocsCount > 0 ? `${missingDocsCount} pending` : 'Ready',
      badgeColor: missingDocsCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
    },
    { 
      id: 'submission-status', 
      number: 4, 
      label: 'Submission Status', 
      icon: Activity,
      badge: supplier.status === 'APPROVED_MASTERLIST' ? 'Accredited' : supplier.status === 'REVISION_REQUESTED' ? 'Revision' : undefined,
      badgeColor: supplier.status === 'APPROVED_MASTERLIST' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
    },
    { 
      id: 'account-security', 
      number: 5, 
      label: 'Account Security', 
      icon: ShieldCheck,
      badge: currentUser.emailVerified ? 'Verified' : 'Unverified',
      badgeColor: currentUser.emailVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
    },
    { 
      id: 'my-account', 
      number: 6, 
      label: 'My Account', 
      icon: UserCog 
    },
    { 
      id: 'sign-out', 
      number: 7, 
      label: 'Sign Out', 
      icon: LogOut 
    },
  ];

  const handleMenuClick = (id: Role1MenuItem) => {
    if (id === 'sign-out') {
      onSignOut();
    } else {
      onSelectMenu(id);
    }
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onToggle}
          className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* SIDE MENUBAR CONTAINER */}
      <aside
        className={`no-print fixed top-16 bottom-0 left-0 z-30 bg-[#072d50] text-slate-100 border-r border-[#0d3f6d] flex flex-col transition-all duration-300 ease-in-out select-none shadow-xl ${
          isOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
        aria-label="Role 1 Supplier Navigation"
      >
        {/* Sidebar Header & Toggle */}
        <div className="p-3.5 border-b border-[#0d3f6d] flex items-center justify-between">
          {isOpen ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-300 whitespace-nowrap">
                Supplier • Supplier Menu
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <span className="text-[10px] font-extrabold text-sky-300">R1</span>
            </div>
          )}

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isOpen ? 'Hide side menu' : 'Show side menu'}
            aria-label={isOpen ? 'Collapse side menu' : 'Expand side menu'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Supplier Profile Snippet (shown when expanded) */}
        {isOpen && (
          <div className="p-3.5 bg-[#0a3560]/70 border-b border-[#0d3f6d] space-y-1">
            <div className="text-[10px] font-mono text-sky-300 flex items-center justify-between">
              <span>{supplier.referenceCode}</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                supplier.status === 'APPROVED_MASTERLIST' ? 'bg-emerald-500/20 text-emerald-300' :
                supplier.status === 'REVISION_REQUESTED' ? 'bg-red-500/20 text-red-300' :
                supplier.status === 'SUBMITTED' ? 'bg-sky-500/20 text-sky-300' :
                'bg-slate-700 text-slate-300'
              }`}>
                {supplier.status.replace('_', ' ')}
              </span>
            </div>
            <div className="font-bold text-xs text-white truncate" title={supplier.businessName}>
              {supplier.businessName || 'Draft Supplier'}
            </div>
            <div className="text-[11px] text-sky-200/80 truncate">
              {supplier.companyEmail}
            </div>
          </div>
        )}

        {/* 7 Role 1 Menu Items List */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMenu === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                title={!isOpen ? `${item.number}. ${item.label}` : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group relative ${
                  isActive
                    ? 'bg-[#0a4f94] text-white shadow-sm font-semibold'
                    : 'text-sky-100/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="shrink-0 flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-sky-300 group-hover:text-white'}`} />
                </div>

                {isOpen && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">
                      <span className="text-sky-300/70 mr-1.5 font-mono text-[11px]">{item.number}.</span>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 shrink-0 ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Active indicator bar on collapsed state */}
                {!isOpen && isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-sky-400 rounded-r" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        {isOpen && (
          <div className="p-3 border-t border-[#0d3f6d] bg-[#05223d] text-[10px] text-sky-300/70 space-y-1">
            <div className="flex items-center justify-between">
              <span>Form Code:</span>
              <span className="font-mono text-sky-200">CPMD.TSAD.F.003</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Revision:</span>
              <span className="font-mono text-sky-200">REV00</span>
            </div>
            <div className="pt-1 text-[9px] text-sky-300/50 text-center">
              City Government of Butuan • TSAD
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
