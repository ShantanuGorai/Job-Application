import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";

const API_URL = "http://localhost:5000";

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  industry: string;
  careerGoal: string;
  idealRole: string;
  experienceLevel: string;
  skills: string;
  salaryRange: string;
  availability: string;
  workPreferences: string[];
  additionalInfo: string;
}

const emptyProfile: ProfileData = {
  fullName: "",
  email: "",
  phone: "",
  jobTitle: "",
  industry: "",
  careerGoal: "",
  idealRole: "",
  experienceLevel: "",
  skills: "",
  salaryRange: "",
  availability: "",
  workPreferences: [],
  additionalInfo: "",
};

const INDUSTRY_OPTIONS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail & E-commerce",
  "Real Estate",
  "Food & Beverage",
  "Non-profit",
  "Other",
];

const SALARY_OPTIONS = [
  "Under $40,000",
  "$40,000 - $70,000",
  "$70,000 - $100,000",
  "$100,000 - $150,000",
  "$150,000+",
];

const GOAL_OPTIONS = [
  "Find a full-time job",
  "Find freelance/contract work",
  "Switch careers",
  "Get promoted/advance in current role",
  "Explore internship opportunities",
];

const EXPERIENCE_OPTIONS = [
  "Entry Level (0-2 years)",
  "Mid Level (3-5 years)",
  "Senior Level (6-10 years)",
  "Executive/Leadership (10+ years)",
];

const AVAILABILITY_OPTIONS = ["Immediately", "Within 2 weeks", "1 month", "Flexible"];

const WORK_PREFERENCE_OPTIONS = [
  "Remote",
  "Hybrid",
  "On-site",
  "Full-time",
  "Part-time",
  "Contract",
  "Willing to relocate",
  "Open to travel",
];


function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-zinc-900 mb-2">{children}</label>;
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-y"
    />
  );
}

function SelectInput({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function RadioOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
        selected ? "border-indigo-500 bg-indigo-50" : "border-zinc-200 hover:border-zinc-300"
      }`}
    >
      <span
        className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
          selected ? "border-indigo-600" : "border-zinc-300"
        }`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
      </span>
      <span className="font-medium text-zinc-900 text-sm">{label}</span>
    </button>
  );
}

function CheckboxOption({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
        checked ? "border-indigo-500 bg-indigo-50" : "border-zinc-200 hover:border-zinc-300"
      }`}
    >
      <span
        className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
          checked ? "border-indigo-600 bg-indigo-600" : "border-zinc-300"
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>
      <span className="font-medium text-zinc-900 text-sm">{label}</span>
    </button>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm shadow-zinc-100 p-6 sm:p-8 mb-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}


export default function Account() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileData>(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/career-profiles/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.profile) {
          const p = result.profile;
          setData({
            fullName: p.fullName || "",
            email: p.email || "",
            phone: p.phone || "",
            jobTitle: p.jobTitle || "",
            industry: p.industry || "",
            careerGoal: p.careerGoal || "",
            idealRole: p.idealRole || "",
            experienceLevel: p.experienceLevel || "",
            skills: p.skills || "",
            salaryRange: p.salaryRange || "",
            availability: p.availability || "",
            workPreferences: Array.isArray(p.workPreferences) ? p.workPreferences : [],
            additionalInfo: p.additionalInfo || "",
          });
        } else {
          // No profile yet — send them to onboarding instead.
          navigate("/get-started", { replace: true });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleWorkPreference = (pref: string) => {
    setData((prev) => ({
      ...prev,
      workPreferences: prev.workPreferences.includes(pref)
        ? prev.workPreferences.filter((p) => p !== pref)
        : [...prev.workPreferences, pref],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError("");
      setShowSaved(false);

      const response = await fetch(`${API_URL}/api/career-profiles/me`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not save your changes.");
      }

      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

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

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-zinc-900">Account details</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Update the details you gave us when you signed up — this is what powers your job
            matches.
          </p>
        </div>

        <Section title="Personal Info">
          <div>
            <Label>Full Name</Label>
            <TextInput value={data.fullName} onChange={(v) => update("fullName", v)} placeholder="John Doe" />
          </div>
          <div>
            <Label>Email Address</Label>
            <TextInput
              type="email"
              value={data.email}
              onChange={(v) => update("email", v)}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <Label>Phone Number</Label>
            <TextInput
              type="tel"
              value={data.phone}
              onChange={(v) => update("phone", v)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </Section>

        <Section title="Professional">
          <div>
            <Label>Current or desired job title</Label>
            <TextInput
              value={data.jobTitle}
              onChange={(v) => update("jobTitle", v)}
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div>
            <Label>Industry</Label>
            <SelectInput
              value={data.industry}
              onChange={(v) => update("industry", v)}
              placeholder="Select an industry"
              options={INDUSTRY_OPTIONS}
            />
          </div>
        </Section>

        <Section title="Career Goals">
          <div>
            <Label>Primary career goal</Label>
            <div className="space-y-2.5">
              {GOAL_OPTIONS.map((opt) => (
                <RadioOption
                  key={opt}
                  label={opt}
                  selected={data.careerGoal === opt}
                  onClick={() => update("careerGoal", opt)}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>Ideal role or company</Label>
            <TextArea
              value={data.idealRole}
              onChange={(v) => update("idealRole", v)}
              placeholder="What does your dream job look like?"
            />
          </div>
        </Section>

        <Section title="Experience & Skills">
          <div>
            <Label>Experience level</Label>
            <div className="space-y-2.5">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <RadioOption
                  key={opt}
                  label={opt}
                  selected={data.experienceLevel === opt}
                  onClick={() => update("experienceLevel", opt)}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>Key skills</Label>
            <TextArea
              value={data.skills}
              onChange={(v) => update("skills", v)}
              placeholder="e.g. Python, Project Management, UI Design"
            />
          </div>
        </Section>

        <Section title="Compensation & Availability">
          <div>
            <Label>Expected salary range (USD)</Label>
            <SelectInput
              value={data.salaryRange}
              onChange={(v) => update("salaryRange", v)}
              placeholder="Select your salary range"
              options={SALARY_OPTIONS}
            />
          </div>
          <div>
            <Label>Availability to start</Label>
            <div className="space-y-2.5">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <RadioOption
                  key={opt}
                  label={opt}
                  selected={data.availability === opt}
                  onClick={() => update("availability", opt)}
                />
              ))}
            </div>
          </div>
        </Section>

        <Section title="Work Preferences">
          <div>
            <Label>Preferred work arrangement</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {WORK_PREFERENCE_OPTIONS.map((opt) => (
                <CheckboxOption
                  key={opt}
                  label={opt}
                  checked={data.workPreferences.includes(opt)}
                  onClick={() => toggleWorkPreference(opt)}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>Anything else we should know?</Label>
            <TextArea
              value={data.additionalInfo}
              onChange={(v) => update("additionalInfo", v)}
              placeholder="Any additional info about your career goals"
            />
          </div>
        </Section>

        {saveError && <p className="text-sm text-red-600 mb-4">{saveError}</p>}

        <div className="flex items-center gap-4 pb-12">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>

          <AnimatePresence>
            {showSaved && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600"
              >
                <Check className="w-4 h-4" />
                Saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}