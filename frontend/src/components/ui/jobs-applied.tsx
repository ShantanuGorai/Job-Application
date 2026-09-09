import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Briefcase, ExternalLink, MapPin } from "lucide-react";
import { detectPlatform } from "@/lib/platforms";
import { formatRelativeTime } from "@/lib/time";

const API_URL = "http://localhost:5000";

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

function RelativeTime({ date }: { date: string }) {
  const [, tick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => tick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  return <>{formatRelativeTime(date)}</>;
}

function AppliedJobCard({ job, index }: { job: AppliedJobRecord; index: number }) {
  const platform = detectPlatform(job.url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.35, delay: Math.min(index, 10) * 0.04, ease: "easeOut" }}
      className="rounded-2xl bg-white border border-zinc-100 shadow-sm shadow-zinc-100 p-5 flex flex-col h-full"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-lg border border-zinc-100 flex items-center justify-center bg-white flex-shrink-0 overflow-hidden">
          <img
            src={platform.logo}
            alt={platform.name}
            className="w-7 h-7 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-zinc-900 leading-snug line-clamp-2">{job.role}</p>
          <p className="text-sm text-zinc-500 truncate">{job.company}</p>
        </div>
      </div>

      {job.location && (
        <span className="inline-flex items-center gap-1 text-xs text-zinc-400 mb-2">
          <MapPin className="w-3.5 h-3.5" />
          {job.location}
        </span>
      )}

      <p className="text-xs font-medium text-emerald-600 mb-4">
        Visited <RelativeTime date={job.createdAt} />
      </p>

      <a
        href={job.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-100 transition-colors"
      >
        {job.linkType === "live" ? "Visit again" : "Search again"}
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </motion.div>
  );
}

export default function JobsApplied() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [jobs, setJobs] = useState<AppliedJobRecord[]>([]);

  const loadJobs = () => {
    setLoading(true);
    setLoadError("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    fetch(`${API_URL}/api/applied-jobs`, { credentials: "include", signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setJobs(data.jobs);
        } else {
          throw new Error(data.message || "Could not load applied jobs.");
        }
      })
      .catch((err) => {
        console.error("Could not load applied jobs:", err);
        setLoadError(
          err?.name === "AbortError"
            ? "This is taking longer than expected. Check that your backend is running."
            : "Could not load your applied jobs. Please try again."
        );
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <div
      className="min-h-screen w-full bg-zinc-50"
      style={{ fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif" }}
    >
      <nav className="bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-extrabold text-zinc-900">EaseMize</span>
        <button
          onClick={() => navigate("/main")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-zinc-900">Jobs Applied</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Every job you've clicked Apply or Search on, most recent first.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-zinc-400 text-sm">Loading...</div>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center text-center py-24 px-6">
            <p className="text-sm text-red-600 mb-4">{loadError}</p>
            <button
              onClick={loadJobs}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center py-24 px-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-5">
              <Briefcase className="w-7 h-7 text-zinc-400" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-1.5">No jobs applied yet</h2>
            <p className="text-sm text-zinc-500 max-w-sm mb-6">
              Once you click Apply or Search on a job from your dashboard, it'll show up here so
              you can keep track of everything you've looked at.
            </p>
            <button
              onClick={() => navigate("/main")}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
            >
              Find jobs
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
            {jobs.map((job, i) => (
              <AppliedJobCard key={job._id} job={job} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}