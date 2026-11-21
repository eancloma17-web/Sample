import React from 'react';
import { ButuanCitySeal, CpmdSeal } from './Seals';
import { HelpCircle, LogOut, Menu } from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  currentUser: UserAccount | null;
  onSignOut: () => void;
  onOpenHelp: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSignOut,
  onOpenHelp,
  activeView,
  onNavigate,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="no-print bg-[#0a4275] text-white shadow-md border-b border-blue-900/60 sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand title, Official Seals & Side Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {currentUser && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 -ml-1 text-sky-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title={isSidebarOpen ? 'Hide Side Menu' : 'Show Side Menu'}
              aria-label={isSidebarOpen ? 'Hide Side Menu' : 'Show Side Menu'}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[11px] font-bold hidden sm:inline">
                {isSidebarOpen ? 'Hide Menu' : 'Show Menu'}
              </span>
            </button>
          )}

          <div 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <ButuanCitySeal size={38} className="w-9 h-9" />
              <CpmdSeal size={38} className="w-9 h-9 hidden md:block" />
            </div>
            <div className="border-l border-white/20 pl-2.5">
              <div className="text-[11px] sm:text-xs font-bold tracking-tight text-white uppercase whitespace-nowrap">
                BUTUAN CITY PROCUREMENT MANAGEMENT DEPARTMENT
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-sky-200 uppercase tracking-wider whitespace-nowrap">
                TSAD SUPPLIER INFORMATION SYSTEM
              </div>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation / Permitted Actions */}
        <div className="hidden lg:flex items-center text-xs font-medium text-sky-200/90 whitespace-nowrap">
          {currentUser?.role === 'SUPPLIER' ? (
            <span className="text-[11px] font-semibold text-sky-100 bg-white/10 px-2.5 py-1 rounded-md">
              Supplier • Supplier Portal Interface
            </span>
          ) : currentUser?.role === 'CPMD_HEAD' ? (
            <span className="text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-xs">
              Department Head • Department Head Executive Portal
            </span>
          ) : currentUser?.role === 'ADMIN_STAFF' || currentUser?.role === 'MIS_OFFICER' ? (
            <span className="text-[11px] font-bold text-teal-300 bg-teal-950/60 border border-teal-500/30 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-xs">
              MIS Officer • MIS Officer Console
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-sky-100 bg-white/10 px-2.5 py-1 rounded-md">
              TSAD Staff • TSAD Staff Workspace
            </span>
          )}
        </div>

        {/* Zone 3: Primary Action / Help & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenHelp}
            className="inline-flex items-center gap-1.5 text-xs text-sky-100 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-sky-200" />
            <span className="hidden sm:inline">Need help?</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/20">
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-white truncate max-w-[150px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-sky-200 truncate">
                  {currentUser.role === 'SUPPLIER'
                    ? 'Registered Supplier'
                    : currentUser.role === 'CPMD_HEAD'
                    ? 'Acting Department Head, CPMD'
                    : currentUser.role === 'ADMIN_STAFF' || currentUser.role === 'MIS_OFFICER'
                    ? 'MIS Administrator, City MIS Office'
                    : currentUser.staffTitle || 'TSAD Staff Officer'}
                </div>
              </div>
              <button
                onClick={onSignOut}
                title="Sign out"
                className="p-1.5 text-sky-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
