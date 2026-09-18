"use client";

import React, { useState } from "react";
import { X, Download, Copy, Check, FileText } from "lucide-react";
import { downloadTextFile } from "@/lib/simulation/reportExporter";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdownContent: string;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  markdownContent,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const filename = `hyperscaler-architecture-spec-${new Date().toISOString().slice(0, 10)}.md`;
    downloadTextFile(markdownContent, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl glass-panel rounded-2xl border border-cyan-500/30 p-6 flex flex-col gap-4 text-mono text-xs shadow-[0_0_50px_rgba(0,240,255,0.15)] max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase text-white font-mono">
                Architecture Spec & FinOps Report
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Executive technical summary ready for GitHub PRs, design docs, or RFP reviews
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-400">
            Format: GitHub-Flavored Markdown (.md)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600 flex items-center gap-1.5 transition-all text-[10px] font-semibold"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied to Clipboard!" : "Copy Markdown"}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all text-[10px]"
            >
              <Download className="w-3 h-3" />
              Download .md
            </button>
          </div>
        </div>

        {/* Code Preview Box */}
        <div className="flex-1 overflow-y-auto rounded-xl bg-[#030712] border border-slate-800 p-4 font-mono text-[11px] text-slate-300 whitespace-pre-wrap selection:bg-cyan-500/30 selection:text-white leading-relaxed">
          {markdownContent}
        </div>
      </div>
    </div>
  );
};
