import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileEdit, Download, FileDown } from "lucide-react";
import { jsPDF } from "jspdf";

const API_URL = import.meta.env.VITE_API_URL;

interface TailorResumeProps {
  jobTitle: string;
  company?: string;
  jobUrl?: string;
}

const SECTION_HEADER_KEYWORDS = [
  "summary",
  "objective",
  "experience",
  "work experience",
  "professional experience",
  "education",
  "skills",
  "technical skills",
  "projects",
  "certifications",
  "achievements",
  "contact",
];

function looksLikeSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 40) return false;

  const lower = trimmed.toLowerCase().replace(/[:\-–]+$/, "");
  if (SECTION_HEADER_KEYWORDS.includes(lower)) return true;

  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  return letters.length > 2 && letters === letters.toUpperCase();
}


export default function TailorResume({ jobTitle, company, jobUrl }: TailorResumeProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tailoredResume, setTailoredResume] = useState("");
  const [gapNotes, setGapNotes] = useState("");
  const [usedJD, setUsedJD] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setLoading(false);
    setError("");
    setTailoredResume("");
    setGapNotes("");
    setUsedJD(false);
    setCopied(false);
  };

  const handleOpen = () => {
    setOpen(true);
    reset();
    handleGenerate();
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/tailor-resume`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl, jobTitle, company }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not tailor this resume right now.");
      }

      setTailoredResume(data.tailoredResume);
      setGapNotes(data.gapNotes || "");
      setUsedJD(!!data.usedJobDescription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tailoredResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filenameBase = `tailored-resume-${jobTitle.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;

  const handleDownloadTxt = () => {
    const blob = new Blob([tailoredResume], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const marginLeft = 48;
    const marginTop = 56;
    const marginBottom = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - marginLeft * 2;

    const bodySize = 10.5;
    const headerSize = 12;
    const bodyLineHeight = 14;
    const headerLineHeight = 18;

    let y = marginTop;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - marginBottom) {
        doc.addPage();
        y = marginTop;
      }
    };

    const paragraphs = tailoredResume.split("\n");

    paragraphs.forEach((rawLine) => {
      const line = rawLine.trimEnd();

      if (line.trim() === "") {
        y += bodyLineHeight * 0.6;
        return;
      }

      if (looksLikeSectionHeader(line)) {
        ensureSpace(headerLineHeight + 6);
        y += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(headerSize);
        doc.text(line.trim().toUpperCase(), marginLeft, y);
        y += 4;
        doc.setDrawColor(180);
        doc.line(marginLeft, y, pageWidth - marginLeft, y);
        y += headerLineHeight - 8;
        return;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodySize);
      const wrapped = doc.splitTextToSize(line, maxWidth);
      wrapped.forEach((wrappedLine: string) => {
        ensureSpace(bodyLineHeight);
        doc.text(wrappedLine, marginLeft, y);
        y += bodyLineHeight;
      });
    });

    doc.save(`${filenameBase}.pdf`);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
      >
        <FileEdit className="w-3.5 h-3.5" />
        Tailor My Resume
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-2xl bg-white shadow-xl p-6 max-h-[85vh] overflow-y-auto"
              style={{ fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileEdit className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-zinc-900">Tailor My Resume</h3>
              </div>
              <p className="text-sm text-zinc-500 mb-5 line-clamp-1">for {jobTitle}</p>

              {loading && (
                <div className="py-10 text-center">
                  <p className="text-sm text-emerald-600 font-medium animate-pulse">
                    Reading your resume and the job details, then rewriting... (can take up to a
                    minute)
                  </p>
                </div>
              )}

              {!loading && error && (
                <>
                  <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
                  <button
                    onClick={handleClose}
                    className="mt-5 text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
                  >
                    Close
                  </button>
                </>
              )}

              {!loading && !error && tailoredResume && (
                <>
                  <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 text-sm text-zinc-700 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-line font-mono text-xs">
                    {tailoredResume}
                  </div>

                  {!usedJD && (
                    <p className="text-xs text-zinc-400 mt-2">
                      We couldn't read the full job description, so this was tailored toward the
                      job title only.
                    </p>
                  )}

                  {gapNotes && (
                    <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-4">
                      <p className="text-xs font-semibold text-amber-700 mb-1.5">
                        Genuine gaps this resume doesn't cover:
                      </p>
                      <p className="text-xs text-amber-700 whitespace-pre-line">{gapNotes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-5">
                    <button
                      onClick={handleDownloadPdf}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
                    >
                      <FileDown className="w-4 h-4" />
                      Download PDF
                    </button>
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors"
                    >
                      {copied ? "Copied!" : "Copy text"}
                    </button>
                    <button
                      onClick={handleDownloadTxt}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      .txt
                    </button>
                    <button
                      onClick={handleClose}
                      className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors ml-auto"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}