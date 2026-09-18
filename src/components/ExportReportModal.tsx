"use client";

import React, { useState, useEffect } from "react";
import { X, Download, Copy, Check, FileText, Archive, Sparkles } from "lucide-react";
import { downloadTextFile } from "@/lib/simulation/reportExporter";
import { compressGzip, supportsCompressionStream, triggerHaptic } from "@/lib/browser/webApis";
import { useMouseSpotlight } from "@/hooks/useMouseSpotlight";

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
  const [compressionStats, setCompressionStats] = useState<{
    originalBytes: number;
    compressedBytes: number;
    ratioPercent: number;
    blob?: Blob;
  } | null>(null);

  const spotlight = useMouseSpotlight();

  useEffect(() => {
    if (!isOpen || !markdownContent) return;

    let mounted = true;
    compressGzip(markdownContent).then((result) => {
      if (mounted) {
        setCompressionStats(result);
      }
    });

    return () => {
      mounted = false;
    };
  }, [isOpen, markdownContent]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      triggerHaptic("medium");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownloadMd = () => {
    triggerHaptic("medium");
    const filename = `hyperscaler-architecture-spec-${new Date().toISOString().slice(0, 10)}.md`;
    downloadTextFile(markdownContent, filename);
  };

  const handleDownloadGzip = () => {
    if (!compressionStats?.blob) return;
    triggerHaptic("heavy");
    const filename = `hyperscaler-architecture-spec-${new Date().toISOString().slice(0, 10)}.md.gz`;
    const url = URL.createObjectURL(compressionStats.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canCompress = supportsCompressionStream();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        onMouseMove={spotlight.onMouseMove}
        onMouseLeave={spotlight.onMouseLeave}
        className="relative w-full max-w-3xl glass-panel gpu-spotlight cyber-hud-notch rounded-2xl border border-cyan-500/30 p-6 flex flex-col gap-4 text-mono text-xs shadow-[0_0_50px_rgba(0,240,255,0.15)] max-h-[85vh]"
      >
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
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">
              Format: GitHub-Flavored Markdown (.md)
            </span>
            {compressionStats && canCompress && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                GZIP: -{compressionStats.ratioPercent}% (
                {(compressionStats.originalBytes / 1024).toFixed(1)}KB →{" "}
                {(compressionStats.compressedBytes / 1024).toFixed(1)}KB)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600 flex items-center gap-1.5 transition-all text-[10px] font-semibold cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied to Clipboard!" : "Copy Markdown"}
            </button>

            <button
              onClick={handleDownloadMd}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all text-[10px] cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Download .md
            </button>

            {canCompress && (
              <button
                onClick={handleDownloadGzip}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all text-[10px] font-semibold cursor-pointer"
                title="Download compressed specification using native browser CompressionStream"
              >
                <Archive className="w-3 h-3 text-emerald-400" />
                Download .md.gz
              </button>
            )}
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
