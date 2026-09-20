import React, { useState, useRef, useEffect } from "react";
import { AppTheme } from "../types";
import { THEMES } from "../theme";
import { Sun, Moon, Terminal, Compass, Palette, Check } from "lucide-react";

interface ThemeSelectorProps {
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const themeIcons: Record<AppTheme, React.ReactNode> = {
    light: <Sun className="w-3.5 h-3.5 text-amber-500" />,
    dark: <Moon className="w-3.5 h-3.5 text-cyan-400" />,
    cyber: <Terminal className="w-3.5 h-3.5 text-emerald-400" />,
    nordic: <Compass className="w-3.5 h-3.5 text-sky-400" />,
  };

  const themeColorsPreview: Record<AppTheme, string> = {
    light: "bg-white border-slate-300",
    dark: "bg-slate-900 border-slate-700",
    cyber: "bg-[#080d14] border-emerald-700",
    nordic: "bg-[#111722] border-sky-700",
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeThemeObj = THEMES[currentTheme];

  return (
    <div className="relative" ref={containerRef} id="theme-changing-section">
      {/* Trigger Button */}
      <button
        id="btn-theme-selector"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all hover:opacity-90 shadow-sm bg-black/5 dark:bg-white/5 border-current/20"
        title="Change App Theme"
      >
        <Palette className="w-3.5 h-3.5 text-cyan-500" />
        <span className="hidden sm:inline font-semibold">{activeThemeObj.name}</span>
        <span className="w-2.5 h-2.5 rounded-full border shrink-0 flex items-center justify-center">
          {themeIcons[currentTheme]}
        </span>
      </button>

      {/* Popover / Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800">
          <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
            Select Color Theme
          </div>

          <div className="space-y-1">
            {(Object.keys(THEMES) as AppTheme[]).map((themeKey) => {
              const t = THEMES[themeKey];
              const isSelected = currentTheme === themeKey;

              return (
                <button
                  key={themeKey}
                  id={`theme-option-${themeKey}`}
                  onClick={() => {
                    onSelectTheme(themeKey);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                    isSelected
                      ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${themeColorsPreview[themeKey]}`}
                    >
                      {themeIcons[themeKey]}
                    </span>
                    <span>{t.name}</span>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
