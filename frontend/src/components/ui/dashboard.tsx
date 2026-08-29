import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Upload,
  FileText,
  X,
  Sparkles,
  Briefcase,
  Gauge,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  LogOut,
  MapPin,
  Clock,
  Settings,
  User,
} from "lucide-react";
import CareerIllustration from "@/components/ui/career-illustration";
import { detectPlatform } from "@/lib/platforms";

const API_URL = "http://localhost:5000";

// =====================================================
// TYPES — mirror backend/routes/parseResume.js output
// (which itself mirrors parser.py's parse_resume_for_api)
// =====================================================

interface LiveJob {
  company: string;
  role: string;
  location: string;
  posted: string;
  apply_url: string;
}

interface PortalLink {
  platform: string;
  category: string;
  url: string;
}

interface MatchSet {
  live_jobs: LiveJob[];
  portal_links: PortalLink[];
}

interface ParsedResumeData {
  candidate_name: string;
  skills: string[];
  predicted_role: string;
  preferred_role: string | null;
  experience_months: number;
  location: string;
  resume_score: number;
  resume_score_notes: string[];
  resume_matches: MatchSet;
  preferred_matches: MatchSet | null;
}

interface CareerProfile {
  fullName: string;
  jobTitle: string;
  experienceLevel: string;
  industry: string;
}

interface AppliedJobRecord {
  _id: string;
  platform: string;
  role: string;
  createdAt: string;
}

interface JobEntry {
  id: string;
  title: string;
  subtitle: string;
  locationText: string;
  postedText: string;
  postedDaysAgo: number;
  url: string;
  linkType: "live" | "gateway";
  platformName: string;
  platformLogo: string;
  buttonLabel: string;
}

const LOADING_MESSAGES = [
  "Reading your resume...",
  "Detecting your skills...",
  "Matching you to a role...",
  "Searching job platforms...",
  "Almost there...",
];

type SortMode = "default" | "newest";

// =====================================================
// TYPEWRITER HOOK
// =====================================================

function useTypewriter(text: string, speed = 45) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return displayed;
}

// =====================================================
// PARSE A HUMAN "posted" STRING INTO A SORTABLE NUMBER
// =====================================================
// LinkedIn's scraped listings give text like "3 days ago",
// "1 week ago", "Recently posted", etc. — not a clean
// number. This turns that into an approximate day count so
// the "sort by newest" filter has something to sort on.
// Gateway/search-link entries have no real posting date, so
// they get Infinity and always sort to the end.

function parsePostedToDays(posted: string): number {
  if (!posted) return Infinity;
  const lower = posted.toLowerCase();

  if (lower.includes("just now") || lower.includes("today") || lower.includes("recently")) {
    return 0;
  }

  const numMatch = lower.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 0;

  if (lower.includes("hour") || lower.includes("minute")) return 0;
  if (lower.includes("day")) return num;
  if (lower.includes("week")) return num * 7;
  if (lower.includes("month")) return num * 30;
  if (lower.includes("year")) return num * 365;

  return Infinity;
}

// =====================================================
// TURN A MatchSet INTO DISPLAYABLE JobEntry[]
// =====================================================

function buildJobEntries(matchSet: MatchSet, roleLabel: string): JobEntry[] {
  const liveEntries: JobEntry[] = (matchSet.live_jobs || []).map((job, i) => {
    const platform = detectPlatform(job.apply_url);
    return {
      id: `live-${roleLabel}-${i}`,
      title: job.role,
      subtitle: job.company,
      locationText: job.location || "",
      postedText: job.posted || "",
      postedDaysAgo: parsePostedToDays(job.posted),
      url: job.apply_url,
      linkType: "live",
      platformName: platform.name,
      platformLogo: platform.logo,
      buttonLabel: "Apply",
    };
  });

  const gatewayEntries: JobEntry[] = (matchSet.portal_links || []).map((link, i) => {
    const platform = detectPlatform(link.url);
    return {
      id: `gateway-${roleLabel}-${i}`,
      title: link.platform,
      subtitle: `${link.category} · for "${roleLabel}"`,
      locationText: "",
      postedText: "",
      postedDaysAgo: Infinity,
      url: link.url,
      linkType: "gateway",
      platformName: platform.name,
      platformLogo: platform.logo,
      buttonLabel: "Search Jobs",
    };
  });

  return [...liveEntries, ...gatewayEntries];
}

// =====================================================
// SETTINGS DROPDOWN (nav) — Account / Log out
// =====================================================

function SettingsMenu({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Settings"
        aria-expanded={open}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
          open ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
        }`}
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex"
        >
          <Settings className="w-5 h-5" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-zinc-100 shadow-lg shadow-zinc-200/60 overflow-hidden z-20"
          >
            <button
              onClick={() => {
                setOpen(false);
                navigate("/account");
              }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors text-left"
            >
              <User className="w-4 h-4 text-zinc-400" />
              Account
            </button>
            <div className="h-px bg-zinc-100" />
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// SMALL PIECES
// =====================================================

function StatCard({
  icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm shadow-zinc-100 p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-zinc-900 leading-tight">{value}</p>
        <p className="text-sm text-zinc-500 truncate">{label}</p>
        {sublabel && <p className="text-xs text-zinc-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

function JobCard({
  entry,
  index,
  onApply,
}: {
  entry: JobEntry;
  index: number;
  onApply: (entry: JobEntry) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05, ease: "easeOut" }}
      className="rounded-2xl bg-white border border-zinc-100 shadow-sm shadow-zinc-100 p-5 flex flex-col h-full"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-lg border border-zinc-100 flex items-center justify-center bg-white flex-shrink-0 overflow-hidden">
          <img
            src={entry.platformLogo}
            alt={entry.platformName}
            className="w-7 h-7 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-zinc-900 leading-snug line-clamp-2">{entry.title}</p>
          <p className="text-sm text-zinc-500 truncate">{entry.subtitle}</p>
        </div>
      </div>

      {(entry.locationText || entry.postedText) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
          {entry.locationText && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
              <MapPin className="w-3.5 h-3.5" />
              {entry.locationText}
            </span>
          )}
          {entry.postedText && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5" />
              {entry.postedText}
            </span>
          )}
        </div>
      )}

      <button
        onClick={() => onApply(entry)}
        className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-100 transition-colors"
      >
        {entry.buttonLabel}
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

function JobSection({
  title,
  subtitle,
  entries,
  onApply,
}: {
  title: string;
  subtitle?: string;
  entries: JobEntry[];
  onApply: (entry: JobEntry) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4 }}
      className="mb-10"
    >
      <div className="mb-4">
        <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>

      {/* Max 2 cards per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map((entry, i) => (
          <JobCard key={entry.id} entry={entry} index={i} onApply={onApply} />
        ))}
      </div>
    </motion.div>
  );
}

// =====================================================
// MAIN DASHBOARD
// =====================================================

export default function Dashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [location, setLocation] = useState("India");

  const [parsing, setParsing] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [parseError, setParseError] = useState("");
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const [appliedJobs, setAppliedJobs] = useState<AppliedJobRecord[]>([]);
  const [platformFilter, setPlatformFilter] = useState("All Platforms");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const firstName = profile?.fullName?.trim().split(" ")[0] || "there";
  const headline = `Hi ${firstName}, let's find your role.`;
  const typedHeadline = useTypewriter(headline);

  // -----------------------------------------------------
  // LOAD PROFILE + APPLIED JOBS + SAVED RESUME ON MOUNT
  // -----------------------------------------------------
  // This is what makes a refresh (or logging back in later)
  // NOT lose everything — the last successful parse is saved
  // server-side and re-fetched here instead of starting blank.

  useEffect(() => {
    fetch(`${API_URL}/api/career-profiles/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.profile) setProfile(data.profile);
      })
      .catch(() => {});

    fetch(`${API_URL}/api/applied-jobs`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAppliedJobs(data.jobs);
      })
      .catch(() => {});

    fetch(`${API_URL}/api/parse-resume/latest`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setParsedData(data.data);
      })
      .catch(() => {})
      .finally(() => setLoadingSaved(false));
  }, []);

  // -----------------------------------------------------
  // ROTATE LOADING MESSAGES WHILE PARSING
  // -----------------------------------------------------

  useEffect(() => {
    if (!parsing) {
      setLoadingMsgIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [parsing]);

  // -----------------------------------------------------
  // PARSE RESUME
  // -----------------------------------------------------

  const handleParse = async () => {
    if (!resumeFile) return;

    try {
      setParsing(true);
      setParseError("");

      const payload = new FormData();
      payload.append("resume", resumeFile);
      payload.append("preferredRole", profile?.jobTitle || "");
      payload.append("experienceLevel", profile?.experienceLevel || "");
      payload.append("location", location || "India");

      const response = await fetch(`${API_URL}/api/parse-resume`, {
        method: "POST",
        credentials: "include",
        body: payload,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not parse this resume. Please try again.");
      }

      setParsedData(result.data);
    } catch (error) {
      console.error("Resume parse error:", error);
      setParseError(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setParsing(false);
    }
  };

  // -----------------------------------------------------
  // BUILD JOB ENTRY LISTS — one per section
  // -----------------------------------------------------

  const resumeEntries: JobEntry[] = useMemo(() => {
    if (!parsedData) return [];
    return buildJobEntries(parsedData.resume_matches, parsedData.predicted_role);
  }, [parsedData]);

  const preferredEntries: JobEntry[] = useMemo(() => {
    if (!parsedData || !parsedData.preferred_matches || !parsedData.preferred_role) return [];
    return buildJobEntries(parsedData.preferred_matches, parsedData.preferred_role);
  }, [parsedData]);

  const platformOptions = useMemo(() => {
    const names = Array.from(
      new Set([...resumeEntries, ...preferredEntries].map((e) => e.platformName))
    );
    return ["All Platforms", ...names];
  }, [resumeEntries, preferredEntries]);

  const applySortAndFilter = (entries: JobEntry[]) => {
    let result = entries;
    if (platformFilter !== "All Platforms") {
      result = result.filter((e) => e.platformName === platformFilter);
    }
    if (sortMode === "newest") {
      result = [...result].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
    }
    return result;
  };

  const filteredResumeEntries = useMemo(
    () => applySortAndFilter(resumeEntries),
    [resumeEntries, platformFilter, sortMode]
  );

  const filteredPreferredEntries = useMemo(
    () => applySortAndFilter(preferredEntries),
    [preferredEntries, platformFilter, sortMode]
  );

  const totalJobsFound = resumeEntries.length + preferredEntries.length;

  // -----------------------------------------------------
  // APPLY CLICK — track then open in a new tab
  // -----------------------------------------------------

  const handleApply = (entry: JobEntry) => {
    window.open(entry.url, "_blank", "noopener,noreferrer");

    fetch(`${API_URL}/api/applied-jobs`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: entry.platformName,
        role: entry.title,
        company: entry.subtitle,
        location: entry.locationText,
        url: entry.url,
        linkType: entry.linkType,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAppliedJobs((prev) => [
            {
              _id: data.id,
              platform: entry.platformName,
              role: entry.title,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      })
      .catch(() => {
        // Tracking is best-effort — the tab already opened either way.
      });
  };

  const handleLogout = () => {
    fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }).finally(() => {
      window.location.href = "/login";
    });
  };

  return (
    <div
      className="min-h-screen w-full bg-zinc-50"
      style={{ fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* ===================== NAV ===================== */}
      <nav className="bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-extrabold text-zinc-900">EaseMize</span>
        <SettingsMenu onLogout={handleLogout} />
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ===================== WELCOME BANNER (plain, no color) ===================== */}
        <div className="rounded-3xl bg-white border border-zinc-100 shadow-sm shadow-zinc-100 px-8 py-10 flex flex-col md:flex-row items-center gap-8 mb-8">
          <div className="flex-1 min-w-0">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-full px-3 py-1 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              AI-powered job matching
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 mb-2 leading-tight min-h-[1.2em]">
              {typedHeadline}
              <span className="inline-block w-[3px] h-8 bg-zinc-900/70 ml-1 align-middle animate-pulse" />
            </h1>
            <p className="text-zinc-500 mb-6 max-w-md">
              Upload your resume below and we'll match your skills to open roles
              across LinkedIn, Naukri, Wellfound, and more.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Resume
            </button>
          </div>
          <div className="w-64 sm:w-80 flex-shrink-0">
            <CareerIllustration />
          </div>
        </div>

        {/* ===================== STATS ===================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<Gauge className="w-6 h-6 text-indigo-600" />}
            accent="#EEF2FF"
            value={parsedData ? `${parsedData.resume_score}` : "—"}
            label="ATS Resume Score"
            sublabel={parsedData ? "How strong your resume looks" : "Upload a resume to see this"}
          />
          <StatCard
            icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
            accent="#ECFDF5"
            value={String(appliedJobs.length)}
            label="Applied Jobs"
          />
          <StatCard
            icon={<Briefcase className="w-6 h-6 text-amber-600" />}
            accent="#FFFBEB"
            value={String(totalJobsFound)}
            label="Jobs Found"
            sublabel={parsedData ? "Based on your resume" : undefined}
          />
        </div>

        {/* ===================== UPLOAD CARD ===================== */}
        <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm shadow-zinc-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-zinc-900 mb-1">Upload a new resume</h2>
          <p className="text-sm text-zinc-500 mb-5">
            We'll re-analyze your skills and refresh your job matches.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full">
              {!resumeFile ? (
                <label className="flex items-center gap-3 w-full rounded-xl border-2 border-dashed border-zinc-200 px-4 py-4 cursor-pointer hover:border-indigo-300 transition-colors">
                  <Upload className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-zinc-600">
                    Click to choose a PDF, DOC, or DOCX file
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-zinc-900 truncate">
                      {resumeFile.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setResumeFile(null)}
                    className="flex-shrink-0 text-zinc-400 hover:text-zinc-700 transition-colors"
                    aria-label="Remove resume"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="w-full sm:w-44">
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5">
                Preferred location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-3.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
              />
            </div>

            <button
              onClick={handleParse}
              disabled={!resumeFile || parsing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {parsing ? "Analyzing..." : "Find Jobs"}
            </button>
          </div>

          {parsing && (
            <p className="mt-4 text-sm text-indigo-600 font-medium animate-pulse">
              {LOADING_MESSAGES[loadingMsgIndex]} (this can take up to a minute)
            </p>
          )}

          {parseError && (
            <p className="mt-4 text-sm text-red-600 whitespace-pre-line">{parseError}</p>
          )}

          {parsedData && !parsing && (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500">Detected skills:</span>
                {parsedData.skills.slice(0, 10).map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-medium bg-zinc-100 text-zinc-700 rounded-full px-3 py-1"
                  >
                    {skill}
                  </span>
                ))}
                {parsedData.skills.length > 10 && (
                  <span className="text-xs text-zinc-400">
                    +{parsedData.skills.length - 10} more
                  </span>
                )}
              </div>

              {parsedData.resume_score_notes && parsedData.resume_score_notes.length > 0 && (
                <div className="mt-5 pt-5 border-t border-zinc-100">
                  <p className="text-xs font-semibold text-zinc-500 mb-2">
                    Ways to strengthen your resume:
                  </p>
                  <ul className="space-y-1">
                    {parsedData.resume_score_notes.slice(0, 4).map((note) => (
                      <li key={note} className="text-sm text-zinc-600 flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* ===================== RESULTS ===================== */}
        {loadingSaved ? null : parsedData ? (
          <>
            <div className="flex items-center justify-end gap-3 mb-2">
              <div className="relative">
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="appearance-none rounded-full border border-zinc-200 bg-white pl-4 pr-9 py-2 text-sm font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="default">Default order</option>
                  <option value="newest">Newest posted first</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              </div>

              <div className="relative">
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="appearance-none rounded-full border border-zinc-200 bg-white pl-4 pr-9 py-2 text-sm font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {platformOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              </div>
            </div>

            <JobSection
              title="Best matches for the given resume"
              subtitle={`Based on your skills, we think you're a great fit for ${parsedData.predicted_role}`}
              entries={filteredResumeEntries}
              onApply={handleApply}
            />

            {parsedData.preferred_role && (
              <JobSection
                title={`Matches for "${parsedData.preferred_role}"`}
                subtitle="Because you told us this is the role you're targeting"
                entries={filteredPreferredEntries}
                onApply={handleApply}
              />
            )}

            {resumeEntries.length === 0 && preferredEntries.length === 0 && (
              <p className="text-sm text-zinc-500 py-8 text-center">
                No results found. Try a different resume or location.
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}