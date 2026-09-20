import React from "react";
import { Download, FileCode2, BarChart3, ShieldCheck, Cpu } from "lucide-react";
import { AppTheme } from "../types";
import { Logo } from "./Logo";
import { ThemeSelector } from "./ThemeSelector";

interface HeaderProps {
  agentType: "guardian" | "baseline";
  onToggleAgent: () => void;
  onOpenSubmission: () => void;
  onOpenBenchmarks: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  agentType,
  onToggleAgent,
  onOpenSubmission,
  onOpenBenchmarks,
  currentTheme,
  onSelectTheme,
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Logo and Clean Identity */}
        <div className="flex items-center gap-3">
          <Logo size="md" showText={true} />
        </div>

        {/* Center: Clean Agent Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-black/5 dark:bg-white/5 border-current/15">
          <button
            id="btn-select-guardian"
            onClick={() => agentType !== "guardian" && onToggleAgent()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              agentType === "guardian"
                ? "bg-cyan-600 text-white shadow-sm shadow-cyan-900/40"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Guardian Agent</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
          </button>
          <button
            id="btn-select-baseline"
            onClick={() => agentType !== "baseline" && onToggleAgent()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              agentType === "baseline"
                ? "bg-rose-600 text-white shadow-sm shadow-rose-900/40"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Baseline</span>
          </button>
        </div>

        {/* Right side: Clean Theme Changing Section + Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <ThemeSelector
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
          />

          <button
            id="btn-open-benchmarks"
            onClick={onOpenBenchmarks}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-current/15 hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="Open Benchmark Suite"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Benchmarks</span>
          </button>

          <button
            id="btn-open-submission"
            onClick={onOpenSubmission}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-current/15 hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="View Submission Source"
          >
            <FileCode2 className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Files</span>
          </button>

          <a
            id="btn-download-zip"
            href="/MM26AI02_submission.zip"
            download="MM26AI02_submission.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
            title="Download Submission ZIP"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ZIP</span>
          </a>
        </div>
      </div>
    </header>
  );
};
