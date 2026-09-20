import React, { useState } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = "md", showText = true }) => {
  const [imgError, setImgError] = useState(false);

  const imgSizeClass =
    size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-9 h-9";

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={`${imgSizeClass} rounded-xl overflow-hidden bg-white/10 p-0.5 border border-white/15 flex items-center justify-center shrink-0 shadow-sm`}
      >
        {!imgError ? (
          <img
            src="/logo.png"
            alt="Modelling Minds 2.0 Logo"
            className="w-full h-full object-contain rounded-[10px]"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            {/* Brain Neural Nodes Fallback */}
            <circle cx="35" cy="25" r="8" fill="#FF6B00" />
            <circle cx="50" cy="20" r="7" fill="#FF007A" />
            <circle cx="68" cy="25" r="8" fill="#9B00FF" />
            <circle cx="28" cy="45" r="9" fill="#FF8500" />
            <circle cx="48" cy="42" r="11" fill="#FF0080" />
            <circle cx="70" cy="45" r="9" fill="#7928CA" />
            <circle cx="38" cy="70" r="8" fill="#0070F3" />
            <circle cx="58" cy="68" r="8" fill="#00DFD8" />
            <line x1="35" y1="25" x2="50" y2="20" stroke="#FF6B00" strokeWidth="3" />
            <line x1="50" y1="20" x2="68" y2="25" stroke="#FF007A" strokeWidth="3" />
            <line x1="35" y1="25" x2="28" y2="45" stroke="#FF8500" strokeWidth="3" />
            <line x1="50" y1="20" x2="48" y2="42" stroke="#FF0080" strokeWidth="3" />
            <line x1="68" y1="25" x2="70" y2="45" stroke="#9B00FF" strokeWidth="3" />
            <line x1="28" y1="45" x2="48" y2="42" stroke="#FF0080" strokeWidth="3" />
            <line x1="48" y1="42" x2="70" y2="45" stroke="#7928CA" strokeWidth="3" />
            <line x1="28" y1="45" x2="38" y2="70" stroke="#0070F3" strokeWidth="3" />
            <line x1="70" y1="45" x2="58" y2="68" stroke="#00DFD8" strokeWidth="3" />
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-extrabold tracking-tight text-sm sm:text-base font-sans">
              MODELLING MINDS
            </span>
            <span className="text-cyan-500 font-extrabold text-sm sm:text-base">2.0</span>
          </div>
          <span className="text-[10px] tracking-wide opacity-60 font-mono">
            Cluster Fault-Tolerant System
          </span>
        </div>
      )}
    </div>
  );
};
