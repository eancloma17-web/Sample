import React from 'react';
import { Landmark } from 'lucide-react';
import { ButuanOnBanner } from './Seals';

interface FooterProps {
  onOpenHelp?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenHelp }) => {
  return (
    <footer className="no-print bg-[#083863] text-sky-100 text-xs border-t border-blue-950 py-4 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left item */}
        <div className="flex items-center gap-2 text-sky-200">
          <Landmark className="w-4 h-4 text-sky-300 shrink-0" />
          <span>Official government service • Butuan City, Philippines</span>
        </div>

        {/* Center / Motto */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-[11px] text-sky-300">
            CPMD.TSAD.F.003. REV00 • ISO 9001:2015 Accredited QMS
          </span>
        </div>

        {/* Right items */}
        <div className="flex items-center gap-4 text-sky-200 text-xs">
          <button 
            onClick={onOpenHelp}
            className="hover:text-white hover:underline transition-colors cursor-pointer"
          >
            Privacy notice
          </button>
          <span className="text-sky-500">|</span>
          <button 
            onClick={onOpenHelp}
            className="hover:text-white hover:underline transition-colors cursor-pointer"
          >
            Terms of use
          </button>
        </div>
      </div>
    </footer>
  );
};
