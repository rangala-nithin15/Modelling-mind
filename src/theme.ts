import { AppTheme } from "./types";

export interface ThemeColors {
  id: AppTheme;
  name: string;
  badge: string;
  pageBg: string;
  cardBg: string;
  cardInner: string;
  cardBorder: string;
  headerBg: string;
  headerBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  chipBg: string;
  chipBorder: string;
}

export const THEMES: Record<AppTheme, ThemeColors> = {
  light: {
    id: "light",
    name: "Clean Light",
    badge: "Minimalist",
    pageBg: "bg-slate-100 text-slate-900",
    cardBg: "bg-white",
    cardInner: "bg-slate-50",
    cardBorder: "border-slate-200 shadow-sm",
    headerBg: "bg-white/95 backdrop-blur-md",
    headerBorder: "border-slate-200/90 shadow-sm",
    textPrimary: "text-slate-900",
    textSecondary: "text-slate-600",
    textMuted: "text-slate-400",
    accent: "text-cyan-600",
    accentBg: "bg-cyan-600 text-white",
    chipBg: "bg-slate-100",
    chipBorder: "border-slate-200",
  },
  dark: {
    id: "dark",
    name: "Midnight Dark",
    badge: "Classic",
    pageBg: "bg-slate-950 text-slate-100",
    cardBg: "bg-slate-900/95",
    cardInner: "bg-slate-950/60",
    cardBorder: "border-slate-800 shadow-lg",
    headerBg: "bg-slate-900/95 backdrop-blur-md",
    headerBorder: "border-slate-800 shadow-md",
    textPrimary: "text-slate-100",
    textSecondary: "text-slate-400",
    textMuted: "text-slate-500",
    accent: "text-cyan-400",
    accentBg: "bg-cyan-600 text-white",
    chipBg: "bg-slate-800",
    chipBorder: "border-slate-700",
  },
  cyber: {
    id: "cyber",
    name: "Cyber Emerald",
    badge: "Matrix",
    pageBg: "bg-[#060a0f] text-emerald-100",
    cardBg: "bg-[#0b1118]/95",
    cardInner: "bg-[#05080c]",
    cardBorder: "border-emerald-900/40 shadow-lg shadow-emerald-950/20",
    headerBg: "bg-[#080d14]/95 backdrop-blur-md",
    headerBorder: "border-emerald-900/50 shadow-md",
    textPrimary: "text-emerald-100",
    textSecondary: "text-emerald-400/80",
    textMuted: "text-emerald-600/70",
    accent: "text-emerald-400",
    accentBg: "bg-emerald-600 text-white",
    chipBg: "bg-[#0f1722]",
    chipBorder: "border-emerald-800/40",
  },
  nordic: {
    id: "nordic",
    name: "Nordic Frost",
    badge: "Balanced",
    pageBg: "bg-[#0f141c] text-sky-100",
    cardBg: "bg-[#151c27]/95",
    cardInner: "bg-[#0c1017]",
    cardBorder: "border-sky-900/40 shadow-lg",
    headerBg: "bg-[#111722]/95 backdrop-blur-md",
    headerBorder: "border-sky-900/50 shadow-md",
    textPrimary: "text-sky-50",
    textSecondary: "text-sky-300/80",
    textMuted: "text-sky-500/70",
    accent: "text-sky-400",
    accentBg: "bg-sky-600 text-white",
    chipBg: "bg-[#1b2331]",
    chipBorder: "border-sky-800/40",
  },
};
