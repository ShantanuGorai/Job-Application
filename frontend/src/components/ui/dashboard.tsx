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
  Search,
  Lightbulb,
  BookOpen,
  Check,
} from "lucide-react";
import CareerIllustration from "@/components/ui/career-illustration";
import { detectPlatform } from "@/lib/platforms";
import { formatRelativeTime } from "@/lib/time";
import TailorResume from "@/components/ui/tailor-resume";

const API_URL = "http://localhost:5000";

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
  recommended_skills: string[];
  preferred_recommended_skills: string[];
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
  company: string;
  location: string;
  url: string;
  linkType: "live" | "gateway";
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


function RelativeTime({ date }: { date: string }) {
  const [, tick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => tick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  return <>{formatRelativeTime(date)}</>;
}



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


function buildJobEntries(
  matchSet: MatchSet,
  roleLabel: string
): { live: JobEntry[]; gateway: JobEntry[] } {
  const live: JobEntry[] = (matchSet.live_jobs || []).map((job, i) => {
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

  const gateway: JobEntry[] = (matchSet.portal_links || []).map((link, i) => {
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

  return { live, gateway };
}



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



function StatCard({
  icon,
  label,
  value,
  sublabel,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  accent: string;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={`w-full text-left rounded-2xl bg-white border border-zinc-100 shadow-sm shadow-zinc-100 p-5 flex items-center gap-4 ${
        onClick ? "cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all" : ""
      }`}
    >
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
    </Wrapper>
  );
}

function AppliedCheckbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 select-none"
    >
      <span
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
          checked ? "bg-emerald-500 border-emerald-500" : "bg-white border-zinc-300"
        }`}
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
            >
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span
        className={`text-sm font-semibold transition-colors ${
          checked ? "text-emerald-600" : "text-zinc-500"
        }`}
      >
        Already Applied
      </span>
    </button>
  );
}

function JobCard({
  entry,
  index,
  appliedAt,
  onVisit,
  onToggleApplied,
  onGeneratePitch,
  showTailorResume = true,
}: {
  entry: JobEntry;
  index: number;
  appliedAt?: string;
  onVisit: (entry: JobEntry) => void;
  onToggleApplied: (entry: JobEntry, applied: boolean) => void;
  onGeneratePitch: (entry: JobEntry) => void;
  showTailorResume?: boolean;
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
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

      {appliedAt && (
        <p className="text-xs font-medium text-emerald-600 mb-3">
          Applied <RelativeTime date={appliedAt} />
        </p>
      )}

      {entry.linkType === "live" && (
        <div>
          <button
            onClick={() => onGeneratePitch(entry)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors mb-3 self-start"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate tailored pitch
          </button>
          {showTailorResume && (
            <TailorResume jobTitle={entry.title} company={entry.subtitle} jobUrl={entry.url} />
          )}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <AppliedCheckbox
          checked={!!appliedAt}
          onToggle={() => onToggleApplied(entry, !appliedAt)}
        />

        <button
          onClick={() => onVisit(entry)}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-100 transition-colors flex-shrink-0"
        >
          {entry.buttonLabel}
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function RecommendedForYou({ data }: { data: ParsedResumeData }) {
  const hasNotes = data.resume_score_notes && data.resume_score_notes.length > 0;
  const hasPredictedSkills = data.recommended_skills && data.recommended_skills.length > 0;
  const hasPreferredSkills =
    data.preferred_recommended_skills && data.preferred_recommended_skills.length > 0;

  if (!hasNotes && !hasPredictedSkills && !hasPreferredSkills) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-white border border-zinc-100 shadow-sm shadow-zinc-100 p-6 mb-8"
    >
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold text-zinc-900">Recommended For You</h2>
      </div>
      <p className="text-sm text-zinc-500 mb-5">
        Tailored to the skills we found on your resume and the role you're aiming for.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hasNotes && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">
              Strengthen your resume
            </p>
            <ul className="space-y-1.5">
              {data.resume_score_notes.slice(0, 5).map((note) => (
                <li key={note} className="text-sm text-zinc-600 flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasPredictedSkills && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Skills to learn for {data.predicted_role}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.recommended_skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-medium bg-amber-50 text-amber-700 rounded-full px-3 py-1"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {hasPreferredSkills && data.preferred_role && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Skills to learn for {data.preferred_role}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.preferred_recommended_skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-medium bg-amber-50 text-amber-700 rounded-full px-3 py-1"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EndOfResults() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center text-center py-14 px-6"
    >
      <img
        src="https://linkilo.co/wp-content/uploads/2023/02/deadend-page.jpg"
        alt="You've reached the end of the current results"
        className="w-full max-w-xs h-auto rounded-2xl mb-6 opacity-90"
      />
      <h3 className="text-lg font-bold text-zinc-900 mb-1.5">
        That's everything we found for now
      </h3>
      <p className="text-sm text-zinc-500 max-w-sm">
        New roles get posted on these platforms every day. Check back soon, or try a different
        location or an updated resume to widen your matches.
      </p>
    </motion.div>
  );
}

function PitchModal({
  open,
  loading,
  error,
  pitch,
  jobTitle,
  usedJobDescription,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  error: string;
  pitch: string;
  jobTitle: string;
  usedJobDescription: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <h3 className="text-lg font-bold text-zinc-900">Tailored Pitch</h3>
            </div>
            <p className="text-sm text-zinc-500 mb-5 line-clamp-1">for {jobTitle}</p>

            {loading && (
              <div className="py-10 text-center">
                <p className="text-sm text-violet-600 font-medium animate-pulse">
                  Reading the job description and writing your pitch...
                </p>
              </div>
            )}

            {!loading && error && <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>}

            {!loading && !error && pitch && (
              <>
                <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 text-sm text-zinc-700 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-line">
                  {pitch}
                </div>
                {!usedJobDescription && (
                  <p className="text-xs text-zinc-400 mt-2">
                    We couldn't read the full job description for this posting, so this pitch is
                    based on the job title and your profile only.
                  </p>
                )}
                <div className="flex items-center gap-3 mt-5">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={onClose}
                    className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}

            {!loading && error && (
              <button
                onClick={onClose}
                className="mt-5 text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
              >
                Close
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function JobGrid({
  entries,
  appliedMap,
  onVisit,
  onToggleApplied,
  onGeneratePitch,
  showTailorResume = true,
}: {
  entries: JobEntry[];
  appliedMap: Record<string, string>;
  onVisit: (entry: JobEntry) => void;
  onToggleApplied: (entry: JobEntry, applied: boolean) => void;
  onGeneratePitch: (entry: JobEntry) => void;
  showTailorResume?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {entries.map((entry, i) => (
        <JobCard
          key={entry.id}
          entry={entry}
          index={i}
          appliedAt={appliedMap[entry.url]}
          onVisit={onVisit}
          onToggleApplied={onToggleApplied}
          onGeneratePitch={onGeneratePitch}
          showTailorResume={showTailorResume}
        />
      ))}
    </div>
  );
}

function RoleMatchBlock({
  title,
  subtitle,
  liveEntries,
  gatewayEntries,
  appliedMap,
  onVisit,
  onToggleApplied,
  onGeneratePitch,
  showTailorResume = true,
}: {
  title: string;
  subtitle?: string;
  liveEntries: JobEntry[];
  gatewayEntries: JobEntry[];
  appliedMap: Record<string, string>;
  onVisit: (entry: JobEntry) => void;
  onToggleApplied: (entry: JobEntry, applied: boolean) => void;
  onGeneratePitch: (entry: JobEntry) => void;
  showTailorResume?: boolean;
}) {
  if (liveEntries.length === 0 && gatewayEntries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4 }}
      className="mb-12"
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>

      {liveEntries.length > 0 && (
        <div className="mb-8">
          <div className="flex items-start gap-2.5 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-zinc-800">Direct Job Postings</h3>
              <p className="text-xs text-zinc-500">
                Real, individual listings we found live — click Apply to go straight to that
                job's own application page. Check "Already Applied" once you've submitted it.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <JobGrid
              entries={liveEntries}
              appliedMap={appliedMap}
              onVisit={onVisit}
              onToggleApplied={onToggleApplied}
              onGeneratePitch={onGeneratePitch}
              showTailorResume={showTailorResume}
            />
          </div>
        </div>
      )}

      {gatewayEntries.length > 0 && (
        <div>
          <div className="flex items-start gap-2.5 mb-1">
            <Search className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-zinc-800">Search More Platforms</h3>
              <p className="text-xs text-zinc-500">
                These aren't individual jobs yet — each button opens a pre-filled search on that
                platform so you can browse and pick a listing yourself.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <JobGrid
              entries={gatewayEntries}
              appliedMap={appliedMap}
              onVisit={onVisit}
              onToggleApplied={onToggleApplied}
              onGeneratePitch={onGeneratePitch}
              showTailorResume={showTailorResume}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// =====================================================
// MAIN DASHBOARD
// =====================================================

export default function Dashboard() {
  const navigate = useNavigate();
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
      .catch((err) => console.error("Could not load profile:", err));

    fetch(`${API_URL}/api/applied-jobs`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAppliedJobs(data.jobs);
        else console.error("Could not load applied jobs:", data.message);
      })
      .catch((err) => console.error("Could not load applied jobs:", err));

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
  // BUILD JOB ENTRY LISTS — split by role AND by type
  // -----------------------------------------------------

  const resumeSplit = useMemo(() => {
    if (!parsedData) return { live: [], gateway: [] };
    return buildJobEntries(parsedData.resume_matches, parsedData.predicted_role);
  }, [parsedData]);

  const preferredSplit = useMemo(() => {
    if (!parsedData || !parsedData.preferred_matches || !parsedData.preferred_role) {
      return { live: [], gateway: [] };
    }
    return buildJobEntries(parsedData.preferred_matches, parsedData.preferred_role);
  }, [parsedData]);

  const platformOptions = useMemo(() => {
    const all = [
      ...resumeSplit.live,
      ...resumeSplit.gateway,
      ...preferredSplit.live,
      ...preferredSplit.gateway,
    ];
    const names = Array.from(new Set(all.map((e) => e.platformName)));
    return ["All Platforms", ...names];
  }, [resumeSplit, preferredSplit]);

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

  const filteredResumeLive = useMemo(
    () => applySortAndFilter(resumeSplit.live),
    [resumeSplit, platformFilter, sortMode]
  );
  const filteredResumeGateway = useMemo(
    () => applySortAndFilter(resumeSplit.gateway),
    [resumeSplit, platformFilter, sortMode]
  );
  const filteredPreferredLive = useMemo(
    () => applySortAndFilter(preferredSplit.live),
    [preferredSplit, platformFilter, sortMode]
  );
  const filteredPreferredGateway = useMemo(
    () => applySortAndFilter(preferredSplit.gateway),
    [preferredSplit, platformFilter, sortMode]
  );

  const totalJobsFound =
    resumeSplit.live.length +
    resumeSplit.gateway.length +
    preferredSplit.live.length +
    preferredSplit.gateway.length;

  // Maps a job URL to when the person confirmed they applied to it —
  // only set when they explicitly check "Already Applied", never
  // automatically, since we have no way to know what happened on
  // the external site.
  const appliedMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const job of appliedJobs) {
      if (!map[job.url] || new Date(job.createdAt) > new Date(map[job.url])) {
        map[job.url] = job.createdAt;
      }
    }
    return map;
  }, [appliedJobs]);

  const appliedIdByUrl = useMemo(() => {
    const map: Record<string, string> = {};
    for (const job of appliedJobs) {
      map[job.url] = job._id;
    }
    return map;
  }, [appliedJobs]);

  // -----------------------------------------------------
  // VISIT — just opens the link, no tracking implied
  // -----------------------------------------------------

  const handleVisit = (entry: JobEntry) => {
    window.open(entry.url, "_blank", "noopener,noreferrer");
  };

  // -----------------------------------------------------
  // TOGGLE "ALREADY APPLIED" — the only thing that actually
  // creates/removes an AppliedJob record. Errors are surfaced
  // (not silently swallowed) since fetch() doesn't reject on
  // 4xx/5xx responses on its own.
  // -----------------------------------------------------

  const handleToggleApplied = async (entry: JobEntry, applied: boolean) => {
    if (applied) {
      try {
        const response = await fetch(`${API_URL}/api/applied-jobs`, {
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
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || `Request failed (${response.status})`);
        }

        setAppliedJobs((prev) => [
          {
            _id: data.id,
            platform: entry.platformName,
            role: entry.title,
            company: entry.subtitle,
            location: entry.locationText,
            url: entry.url,
            linkType: entry.linkType,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } catch (error) {
        console.error("Could not mark this job as applied:", error);
      }
    } else {
      const id = appliedIdByUrl[entry.url];
      if (!id) return;

      try {
        const response = await fetch(`${API_URL}/api/applied-jobs/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || `Request failed (${response.status})`);
        }

        setAppliedJobs((prev) => prev.filter((j) => j._id !== id));
      } catch (error) {
        console.error("Could not un-mark this job:", error);
      }
    }
  };

  const handleLogout = () => {
    fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }).finally(() => {
      window.location.href = "/login";
    });
  };

  // -----------------------------------------------------
  // AI-TAILORED PITCH GENERATOR
  // -----------------------------------------------------

  const [pitchOpen, setPitchOpen] = useState(false);
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchError, setPitchError] = useState("");
  const [pitchText, setPitchText] = useState("");
  const [pitchUsedJD, setPitchUsedJD] = useState(false);
  const [pitchJobTitle, setPitchJobTitle] = useState("");

  const handleGeneratePitch = async (entry: JobEntry) => {
    setPitchOpen(true);
    setPitchLoading(true);
    setPitchError("");
    setPitchText("");
    setPitchJobTitle(entry.title);

    try {
      const response = await fetch(`${API_URL}/api/generate-pitch`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobUrl: entry.url,
          jobTitle: entry.title,
          company: entry.subtitle,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not generate a pitch right now.");
      }

      setPitchText(data.pitch);
      setPitchUsedJD(!!data.usedJobDescription);
    } catch (error) {
      setPitchError(
        error instanceof Error ? error.message : "Could not generate a pitch right now."
      );
    } finally {
      setPitchLoading(false);
    }
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
            sublabel="Click to view all"
            onClick={() => navigate("/jobs-applied")}
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
          )}
        </div>

        {/* ===================== RECOMMENDED FOR YOU ===================== */}
        {parsedData && !parsing && <RecommendedForYou data={parsedData} />}

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

            <RoleMatchBlock
              title="Best matches for the given resume"
              subtitle={`Based on your skills, we think you're a great fit for ${parsedData.predicted_role}`}
              liveEntries={filteredResumeLive}
              gatewayEntries={filteredResumeGateway}
              appliedMap={appliedMap}
              onVisit={handleVisit}
              onToggleApplied={handleToggleApplied}
              onGeneratePitch={handleGeneratePitch}
            />

            {parsedData.preferred_role && (
              <RoleMatchBlock
                title={`Matches for "${parsedData.preferred_role}"`}
                subtitle="Because you told us this is the role you're targeting"
                liveEntries={filteredPreferredLive}
                gatewayEntries={filteredPreferredGateway}
                appliedMap={appliedMap}
                onVisit={handleVisit}
                onToggleApplied={handleToggleApplied}
                onGeneratePitch={handleGeneratePitch}
                showTailorResume={false}
              />
            )}

            {totalJobsFound === 0 ? (
              <p className="text-sm text-zinc-500 py-8 text-center">
                No results found. Try a different resume or location.
              </p>
            ) : (
              <EndOfResults />
            )}
          </>
        ) : null}

        <PitchModal
          open={pitchOpen}
          loading={pitchLoading}
          error={pitchError}
          pitch={pitchText}
          jobTitle={pitchJobTitle}
          usedJobDescription={pitchUsedJD}
          onClose={() => setPitchOpen(false)}
        />
      </div>
    </div>
  );
}