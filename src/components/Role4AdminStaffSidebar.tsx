import React from 'react';
import { 
  AdminStaffMenuItem, 
  UserAccount 
} from '../types';
import { 
  LayoutDashboard, 
  Users, 
  KeyRound, 
  ListFilter, 
  SlidersHorizontal, 
  History, 
  ShieldCheck, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Server
} from 'lucide-react';

interface Role4AdminStaffSidebarProps {
  currentMenu: AdminStaffMenuItem;
  onSelectMenu: (menu: AdminStaffMenuItem) => void;
  isOpen: boolean;
  onToggle: () => void;
  currentUser: UserAccount;
  onSignOut: () => void;
}

export const Role4AdminStaffSidebar: React.FC<Role4AdminStaffSidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isOpen,
  onToggle,
  currentUser,
  onSignOut,
}) => {
  const menuItems: {
    id: AdminStaffMenuItem;
    number: number;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tag?: string;
    tagColor?: string;
  }[] = [
    { id: 'overview', number: 1, label: 'Overview & Console', icon: LayoutDashboard, tag: 'Console', tagColor: 'text-teal-300 bg-teal-950/60 border-teal-500/30' },
    { id: 'staff-accounts', number: 2, label: 'Staff Accounts', icon: Users, tag: 'Registry', tagColor: 'text-sky-300 bg-sky-950/60 border-sky-500/30' },
    { id: 'access-assistance', number: 3, label: 'Access Assistance', icon: KeyRound, tag: 'Recovery', tagColor: 'text-amber-300 bg-amber-950/60 border-amber-500/30' },
    { id: 'reference-lists', number: 4, label: 'Reference Lists', icon: ListFilter, tag: 'Standards', tagColor: 'text-emerald-300 bg-emerald-950/60 border-emerald-500/30' },
    { id: 'system-settings', number: 5, label: 'System Settings', icon: SlidersHorizontal, tag: 'Config', tagColor: 'text-indigo-300 bg-indigo-950/60 border-indigo-500/30' },
    { id: 'audit-records', number: 6, label: 'Activity & Audit Records', icon: History, tag: 'Read-Only', tagColor: 'text-rose-300 bg-rose-950/60 border-rose-500/30' },
    { id: 'account-security', number: 7, label: 'Account & Security', icon: ShieldCheck, tag: 'Secure', tagColor: 'text-teal-300 bg-teal-950/60 border-teal-500/30' },
    { id: 'sign-out', number: 8, label: 'Sign Out', icon: LogOut },
  ];

  const handleMenuClick = (id: AdminStaffMenuItem) => {
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

      {/* Role 4 MIS Sidebar Container */}
      <aside
        className={`no-print fixed top-16 bottom-0 left-0 z-30 bg-[#07243c] text-slate-100 border-r border-[#0e3b66] flex flex-col transition-all duration-300 ease-in-out select-none shadow-2xl ${
          isOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
        aria-label="Role 4 MIS Navigation"
      >
        {/* Header & Toggle */}
        <div className="p-3.5 border-b border-[#0e3b66] bg-[#051a2d] flex items-center justify-between">
          {isOpen ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-500/30 shadow-xs">
                <Server className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-300 whitespace-nowrap">
                MIS Officer • MIS Officer Console
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <span className="text-[10px] font-extrabold text-teal-300 font-mono">MIS</span>
            </div>
          )}

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isOpen ? 'Collapse navigation menu' : 'Expand navigation menu'}
            aria-label={isOpen ? 'Collapse navigation menu' : 'Expand navigation menu'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Profile & Boundary Notice */}
        {isOpen && (
          <div className="p-3.5 bg-gradient-to-r from-[#0a2e4c] to-[#08243c] border-b border-[#0e3b66] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-teal-300 font-bold flex items-center gap-1">
                SYSTEM ADMINISTRATION
              </span>
              <span className="text-emerald-300 bg-emerald-950/70 px-1.5 py-0.2 rounded border border-emerald-500/30 text-[9px] font-semibold">
                LEAST PRIVILEGE
              </span>
            </div>
            <div className="font-bold text-xs text-white truncate" title={currentUser.name}>
              {currentUser.name}
            </div>
            <div className="text-[10px] text-sky-200/90 truncate font-medium">
              {currentUser.staffTitle || 'MIS Administrator, City MIS Office'}
            </div>
          </div>
        )}

        {/* Exact 8 Menu Items per PDF */}
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
                    ? 'bg-gradient-to-r from-[#0d4f82] to-[#0a3e66] text-white shadow-md font-semibold border-l-2 border-teal-400'
                    : 'text-sky-100/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="shrink-0 flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-300' : 'text-sky-300 group-hover:text-white'}`} />
                </div>

                {isOpen && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">
                      <span className="text-sky-300/70 mr-1.5 font-mono text-[11px]">{item.number}.</span>
                      {item.label}
                    </span>
                    {item.tag && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ml-1 shrink-0 ${item.tagColor || 'text-slate-300 bg-slate-800'}`}>
                        {item.tag}
                      </span>
                    )}
                  </div>
                )}

                {/* Active indicator line when collapsed */}
                {!isOpen && isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-teal-400 rounded-r" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Scope boundary warning notice in footer */}
        {isOpen && (
          <div className="p-3 border-t border-[#0e3b66] bg-[#041422] text-[10px] text-sky-300/70 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Strict Role Boundary</span>
            </div>
            <p className="text-[9px] text-sky-200/60 leading-tight">
              No supplier verification, approval, or confidential file access. Technical & system administration controls strictly active.
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
