import React from 'react';
import butuanCitySealImg from '../assets/images/butuan-city-seal.png';
import procurementLogoImg from '../assets/images/procurement-logo.png';

export const ButuanCitySeal: React.FC<{
  className?: string;
  size?: number;
  title?: string;
  useImageTag?: boolean;
}> = ({ className = "w-12 h-12", size = 48, title = "City of Butuan Official Seal" }) => (
  <img
    src={butuanCitySealImg}
    alt={title}
    width={size}
    height={size}
    style={{ width: size, height: size, objectFit: 'contain' }}
    className={`shrink-0 select-none ${className}`}
  />
);

export const CpmdSeal: React.FC<{ className?: string; size?: number }> = ({
  className = "w-12 h-12",
  size = 48
}) => (
  <img
    src={procurementLogoImg}
    alt="City Procurement Management Department logo"
    width={size}
    height={size}
    style={{ width: size, height: size, objectFit: 'contain' }}
    className={`shrink-0 select-none ${className}`}
  />
);

export const ButuanOnBanner: React.FC<{ className?: string }> = ({ className = "h-8" }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <span className="font-extrabold tracking-tight text-blue-700 text-base italic">
        BUTUAN
      </span>
      <span className="bg-lime-500 text-white font-black text-xs px-1.5 py-0.5 rounded tracking-wider uppercase">
        ON
      </span>
      <span className="text-[11px] font-semibold text-slate-500 italic hidden sm:inline">
        A City Ascending!
      </span>
    </div>
  );
};
