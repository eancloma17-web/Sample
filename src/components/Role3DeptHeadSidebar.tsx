import React from 'react';
import { 
  DeptHeadMenuItem, 
  UserAccount 
} from '../types';
import { 
  LayoutDashboard, 
  Inbox, 
  BookOpenCheck, 
  FileCheck2, 
  Award, 
  MessageSquare, 
  Printer, 
  History, 
  ShieldCheck, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Crown
} from 'lucide-react';

interface Role3DeptHeadSidebarProps {
  currentMenu: DeptHeadMenuItem;
  onSelectMenu: (menu: DeptHeadMenuItem) => void;
  isOpen: boolean;
  onToggle: () => void;
  currentUser: UserAccount;
  pendingFinalApprovalCount: number;
  totalUnderReviewCount: number;
  commentsCount: number;
  onSignOut: () => void;
}

export const Role3DeptHeadSidebar: React.FC<Role3DeptHeadSidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isOpen,
  onToggle,
  currentUser,
  pendingFinalApprovalCount,
  totalUnderReviewCount,
  commentsCount,
  onSignOut,
}) => {
  const menuItems: {
    id: DeptHeadMenuItem;
    number: number;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    { id: 'overview', number: 1, label: 'Executive Overview', icon: LayoutDashboard },
    { 
      id: 'review-queue', 
      number: 2, 
      label: 'Executive Review Queue', 
      icon: Inbox,
      badge: pendingFinalApprovalCount > 0 ? `${pendingFinalApprovalCount} Ready` : undefined,
      badgeColor: 'bg-emerald-500 text-white font-bold'
    },
    { id: 'supplier-records', number: 3, label: 'Master Supplier Records', icon: BookOpenCheck },
    { id: 'document-review', number: 4, label: 'Document Review Desk', icon: FileCheck2 },
    { 
      id: 'recommendations-decisions', 
      number: 5, 
      label: 'Recommendations & Decisions', 
      icon: Award,
      badge: (pendingFinalApprovalCount + totalUnderReviewCount) > 0 
        ? pendingFinalApprovalCount || totalUnderReviewCount 
        : undefined,
      badgeColor: 'bg-amber-400 text-amber-950 font-bold'
    },
    { 
      id: 'review-comments', 
      number: 6, 
      label: 'Department Review Comments', 
      icon: MessageSquare,
      badge: commentsCount > 0 ? commentsCount : undefined,
      badgeColor: 'bg-sky-400 text-sky-950 font-bold'
    },
    { id: 'reports-printing', number: 7, label: 'Reports & Official Printing', icon: Printer },
    { id: 'decision-history', number: 8, label: 'Decision Audit History', icon: History },
    { id: 'account-security', number: 9, label: 'Executive Account & Security', icon: ShieldCheck },
    { id: 'sign-out', number: 10, label: 'Sign Out', icon: LogOut },
  ];

  const handleMenuClick = (id: DeptHeadMenuItem) => {
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
          className="no-print fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Role 3 Dept Head Sidebar Container */}
      <aside
        className={`no-print fixed top-16 bottom-0 left-0 z-30 bg-[#061d33] text-slate-100 border-r border-[#0e3b66] flex flex-col transition-all duration-300 ease-in-out select-none shadow-2xl ${
          isOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
        aria-label="Role 3 Department Head Navigation"
      >
        {/* Header & Toggle */}
        <div className="p-3.5 border-b border-[#0e3b66] bg-[#051729] flex items-center justify-between">
          {isOpen ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 whitespace-nowrap">
                Department Head • Department Head
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <span className="text-[10px] font-extrabold text-amber-400">CPMD</span>
            </div>
          )}

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isOpen ? 'Hide executive menu' : 'Show executive menu'}
            aria-label={isOpen ? 'Collapse executive menu' : 'Expand executive menu'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Executive Profile Snippet (when expanded) */}
        {isOpen && (
          <div className="p-3.5 bg-gradient-to-r from-[#092847] to-[#07203a] border-b border-[#0e3b66] space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Crown className="w-3 h-3" />
                EXECUTIVE AUTHORITY
              </span>
              <span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                AUTHORIZED
              </span>
            </div>
            <div className="font-bold text-xs text-white truncate" title={currentUser.name}>
              {currentUser.name}
            </div>
            <div className="text-[10px] text-sky-200/90 truncate font-medium">
              {currentUser.staffTitle || 'Acting Department Head, CPMD'}
            </div>
          </div>
        )}

        {/* 10 Exact Role 3 Menu Items */}
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
                    ? 'bg-gradient-to-r from-[#0d4a82] to-[#0b3c6a] text-white shadow-md font-semibold border-l-2 border-amber-400'
                    : 'text-sky-100/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="shrink-0 flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-sky-300 group-hover:text-white'}`} />
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
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-400 rounded-r" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Authority Box */}
        {isOpen && (
          <div className="p-3 border-t border-[#0e3b66] bg-[#041221] text-[10px] text-sky-300/70 space-y-0.5">
            <div className="flex items-center justify-between">
              <span>Authority:</span>
              <span className="font-mono text-amber-300 font-semibold">Acting Dept Head</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Standard:</span>
              <span className="font-mono text-sky-200">ISO 9001:2015 QMS</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
