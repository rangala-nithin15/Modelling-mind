import React, { useState, useEffect } from "react";
import { Download, Copy, Check, FileText, Code2, ShieldCheck, X } from "lucide-react";

interface SubmissionFile {
  name: string;
  path: string;
  desc: string;
  content: string;
}

interface SubmissionModalProps {
  onClose: () => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({ onClose }) => {
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/submission-files")
      .then((res) => res.json())
      .then((data) => {
        setFiles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load submission files", err);
        setLoading(false);
      });
  }, []);

  const currentFile = files[selectedFileIndex];

  const handleCopy = () => {
    if (currentFile?.content) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Official Submission Package (MM26AI02)
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/50 font-mono">
                  COMPLIANT
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Single importable class: <code className="text-cyan-300">MyAgent(BaseAgent)</code> in <code className="text-amber-300">agent.py</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              id="btn-download-submission-zip"
              href="/MM26AI02_submission.zip"
              download="MM26AI02_submission.zip"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Selector Sidebar */}
          <div className="w-full md:w-64 bg-slate-950/60 border-r border-slate-800/80 p-3 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
              Submission Artifacts
            </div>
            {loading ? (
              <div className="text-xs text-slate-500 p-2">Loading files...</div>
            ) : (
              files.map((file, idx) => (
                <button
                  key={file.name}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition flex items-center justify-between ${
                    selectedFileIndex === idx
                      ? "bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-sm"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {file.name.endsWith(".md") ? (
                      <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950/90 overflow-hidden">
            <div className="p-3 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-900/40">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">{currentFile?.name}</span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  — {currentFile?.desc}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300 whitespace-pre leading-relaxed select-text">
              {currentFile?.content || "// File content not loaded"}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Tested against eval_harness.py · Zero external package dependencies · Compute compliant
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
