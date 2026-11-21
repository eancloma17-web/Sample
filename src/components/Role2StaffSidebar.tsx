import React from 'react';
import { 
  Role2MenuItem, 
  UserAccount, 
  SupplierApplication 
} from '../types';
import { 
  LayoutDashboard, 
  Search, 
  Inbox, 
  FileCheck2, 
  FileSignature, 
  BookOpenCheck, 
  CalendarClock, 
  MessageSquare, 
  Printer, 
  UserCog, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface Role2StaffSidebarProps {
  currentMenu: Role2MenuItem;
  onSelectMenu: (menu: Role2MenuItem) => void;
  isOpen: boolean;
  onToggle: () => void;
  currentUser: UserAccount;
  submissionsAwaitingReviewCount: number;
  expiredDocsCount: number;
  commentsCount: number;
  onSignOut: () => void;
}

export const Role2StaffSidebar: React.FC<Role2StaffSidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isOpen,
  onToggle,
  currentUser,
  submissionsAwaitingReviewCount,
  expiredDocsCount,
  commentsCount,
  onSignOut,
}) => {
  const menuItems: {
    id: Role2MenuItem;
    number: number;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', number: 1, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'supplier-request-search', number: 2, label: 'Supplier / Request Search', icon: Search },
    { 
      id: 'review-queue', 
      number: 3, 
      label: 'Registration Review Queue', 
      icon: Inbox,
      badge: submissionsAwaitingReviewCount > 0 ? submissionsAwaitingReviewCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 font-bold'
    },
    { id: 'si-sheet-documents', number: 4, label: 'SI Sheet & Documents', icon: FileCheck2 },
    { id: 'verification-revision', number: 5, label: 'Verification & Revision', icon: FileSignature },
    { id: 'supplier-master-list', number: 6, label: 'Supplier Master List', icon: BookOpenCheck },
    { 
      id: 'document-expiration', 
      number: 7, 
      label: 'Document Expiration', 
      icon: CalendarClock,
      badge: expiredDocsCount > 0 ? expiredDocsCount : undefined,
      badgeColor: 'bg-red-100 text-red-900 font-bold'
    },
    { 
      id: 'submission-comments', 
      number: 8, 
      label: 'Submission Comments', 
      icon: MessageSquare,
      badge: commentsCount > 0 ? commentsCount : undefined,
      badgeColor: 'bg-sky-100 text-sky-900 font-bold'
    },
    { id: 'reports-print', number: 9, label: 'Reports & Print', icon: Printer },
    { id: 'my-account-security', number: 10, label: 'My Account / Security', icon: UserCog },
    { id: 'sign-out', number: 11, label: 'Sign Out', icon: LogOut },
  ];

  const handleMenuClick = (id: Role2MenuItem) => {
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

      {/* Role 2 Sidebar Container */}
      <aside
        className={`no-print fixed top-16 bottom-0 left-0 z-30 bg-[#07243e] text-slate-100 border-r border-[#0d3f6d] flex flex-col transition-all duration-300 ease-in-out select-none shadow-xl ${
          isOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
        aria-label="Role 2 TSAD Staff Navigation"
      >
        {/* Header & Toggle */}
        <div className="p-3.5 border-b border-[#0d3f6d] flex items-center justify-between">
          {isOpen ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-300 whitespace-nowrap">
                TSAD Staff • TSAD Staff Menu
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <span className="text-[10px] font-extrabold text-sky-300">TSAD</span>
            </div>
          )}

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isOpen ? 'Hide staff menu' : 'Show staff menu'}
            aria-label={isOpen ? 'Collapse staff menu' : 'Expand staff menu'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Staff Profile Snippet (when expanded) */}
        {isOpen && (
          <div className="p-3.5 bg-[#0a3560]/70 border-b border-[#0d3f6d] space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-sky-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AUTHORIZED STAFF</span>
            </div>
            <div className="font-bold text-xs text-white truncate" title={currentUser.name}>
              {currentUser.name}
            </div>
            <div className="text-[10px] text-sky-200/80 truncate">
              {currentUser.staffTitle || 'Technical Support & Accreditation Officer'}
            </div>
          </div>
        )}

        {/* 11 Exact Role 2 Menu Items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMenu === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                title={!isOpen ? `${item.number}. ${item.label}` : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group relative ${
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
                    {item.badge !== undefined && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ml-2 shrink-0 ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Active indicator line when collapsed */}
                {!isOpen && isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-sky-400 rounded-r" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        {isOpen && (
          <div className="p-3 border-t border-[#0d3f6d] bg-[#051a2d] text-[10px] text-sky-300/70 space-y-0.5">
            <div className="flex items-center justify-between">
              <span>Authority:</span>
              <span className="font-mono text-sky-200">TSAD QMS Staff</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Standard:</span>
              <span className="font-mono text-sky-200">ISO 9001:2015</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
