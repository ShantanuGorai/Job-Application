import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, ChevronDown } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

// =====================================================
// STEP DEFINITIONS
// =====================================================

const STEPS = [
  "Personal Info",
  "Professional",
  "Career Goals",
  "Experience",
  "Compensation",
  "Preferences",
] as const;

type StepName = (typeof STEPS)[number];

interface FormData {
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

const initialFormData: FormData = {
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

// =====================================================
// SMALL SHARED PIECES
// =====================================================

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-zinc-900 mb-2">
      {children}
    </label>
  );
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
      className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-300"
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
      rows={4}
      className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-300 resize-y"
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
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-zinc-200 px-4 py-3 pr-10 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-300 bg-white"
      >
        <option value="" disabled className="text-zinc-400">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
    </div>
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
      className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors ${
        selected ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300"
      }`}
    >
      <span
        className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
          selected ? "border-zinc-900" : "border-zinc-300"
        }`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-zinc-900" />}
      </span>
      <span className="font-semibold text-zinc-900">{label}</span>
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
      className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors ${
        checked ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300"
      }`}
    >
      <span
        className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
          checked ? "border-zinc-900 bg-zinc-900" : "border-zinc-300"
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>
      <span className="font-semibold text-zinc-900">{label}</span>
    </button>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-zinc-900 mb-1.5">{title}</h2>
      <p className="text-zinc-500">{subtitle}</p>
    </div>
  );
}

function Stepper({ currentIndex }: { currentIndex: number }) {
  const progressPercent = (currentIndex / (STEPS.length - 1)) * 100;

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between">
        {STEPS.map((label, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;

          return (
            <div key={label} className="flex flex-col items-center gap-2 flex-1">
              <motion.span
                animate={{ scale: isCurrent ? 1.15 : 1 }}
                transition={{ duration: 0.25 }}
                className={`w-3 h-3 rounded-full ${
                  isCompleted || isCurrent ? "bg-zinc-900" : "bg-zinc-200"
                } ${isCurrent ? "ring-4 ring-zinc-200" : ""}`}
              />
              <span
                className={`text-xs sm:text-sm font-medium text-center whitespace-nowrap ${
                  isCurrent
                    ? "text-zinc-900 font-semibold"
                    : isCompleted
                    ? "text-zinc-500"
                    : "text-zinc-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 h-1 w-full rounded-full bg-zinc-200 overflow-hidden">
        <motion.div
          className="h-full bg-zinc-900"
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

function NavButtons({
  onBack,
  isFirstStep,
  isLastStep,
  submitting,
}: {
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  submitting: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-10">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirstStep}
        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      {isLastStep ? (
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit"}
          <Check className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function CareerOnboardingForm() {
  const navigate = useNavigate();

  // Before showing the form, check whether this person already
  // completed onboarding — if so, skip straight to the dashboard
  // instead of making them fill it out again every time.
  const [checkingExisting, setCheckingExisting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/api/career-profiles/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.profile) {
          navigate("/main", { replace: true });
        } else {
          setCheckingExisting(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCheckingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [data, setData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const currentStep: StepName = STEPS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
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

  const goBack = () => {
    if (isFirstStep) return;
    setDirection(-1);
    setStepIndex((i) => i - 1);
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case "Personal Info":
        return data.fullName.trim() !== "" && /\S+@\S+\.\S+/.test(data.email);
      case "Professional":
        return data.jobTitle.trim() !== "" && data.industry !== "";
      case "Career Goals":
        return data.careerGoal !== "";
      case "Experience":
        return data.experienceLevel !== "";
      case "Compensation":
        return data.salaryRange !== "" && data.availability !== "";
      case "Preferences":
        return true;
    }
  };

  const handleSubmitStep = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isStepValid()) return;

    if (!isLastStep) {
      setDirection(1);
      setStepIndex((i) => i + 1);
      return;
    }

    // Final step — plain JSON now, no file attached here anymore.
    // Resume upload happens on the dashboard instead, right before
    // running the parser — no reason to ask for it twice.
    try {
      setSubmitting(true);
      setSubmitError("");

      const response = await fetch(`${API_URL}/api/career-profiles`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong. Please try again.");
      }

      setSubmitted(true);

      // Brief confirmation, then straight into the dashboard.
      setTimeout(() => {
        navigate("/main");
      }, 1600);
    } catch (error) {
      console.error("Career profile submission error:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (dir: 1 | -1) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 1 | -1) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  if (checkingExisting) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (submitted) {
    const firstName = data.fullName.trim().split(" ")[0] || "there";

    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full text-center"
        >
          <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center">
            <Check className="w-7 h-7 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Hi {firstName}, your profile is in.
          </h2>
          <p className="text-zinc-500 mb-8">
            Taking you to your dashboard, where you can upload your resume and
            see matching jobs.
          </p>
          <button
            onClick={() => navigate("/main")}
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Go now
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <Stepper currentIndex={stepIndex} />

        <form onSubmit={handleSubmitStep}>
          <div className="rounded-2xl border border-zinc-100 bg-white shadow-lg shadow-zinc-100 p-8 sm:p-10 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {currentStep === "Personal Info" && (
                  <>
                    <StepHeader
                      title="Tell us about yourself"
                      subtitle="Let's start with some basic information"
                    />
                    <div className="space-y-5">
                      <div>
                        <Label>Full Name</Label>
                        <TextInput
                          value={data.fullName}
                          onChange={(v) => update("fullName", v)}
                          placeholder="John Doe"
                        />
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
                        <Label>Phone Number (Optional)</Label>
                        <TextInput
                          type="tel"
                          value={data.phone}
                          onChange={(v) => update("phone", v)}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>
                  </>
                )}

                {currentStep === "Professional" && (
                  <>
                    <StepHeader
                      title="Professional Background"
                      subtitle="Tell us about your professional experience"
                    />
                    <div className="space-y-5">
                      <div>
                        <Label>Current or desired job title?</Label>
                        <TextInput
                          value={data.jobTitle}
                          onChange={(v) => update("jobTitle", v)}
                          placeholder="e.g. Software Engineer, Product Manager"
                        />
                      </div>
                      <div>
                        <Label>Which industry are you targeting?</Label>
                        <SelectInput
                          value={data.industry}
                          onChange={(v) => update("industry", v)}
                          placeholder="Select an industry"
                          options={INDUSTRY_OPTIONS}
                        />
                      </div>
                    </div>
                  </>
                )}

                {currentStep === "Career Goals" && (
                  <>
                    <StepHeader
                      title="Career Goals"
                      subtitle="What are you trying to achieve in your career?"
                    />
                    <div className="space-y-6">
                      <div>
                        <Label>What's your primary career goal?</Label>
                        <div className="space-y-3">
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
                        <Label>Describe your ideal role or company</Label>
                        <TextArea
                          value={data.idealRole}
                          onChange={(v) => update("idealRole", v)}
                          placeholder="What does your dream job look like?"
                        />
                      </div>
                    </div>
                  </>
                )}

                {currentStep === "Experience" && (
                  <>
                    <StepHeader
                      title="Experience & Skills"
                      subtitle="Tell us about your background"
                    />
                    <div className="space-y-6">
                      <div>
                        <Label>What's your experience level?</Label>
                        <div className="space-y-3">
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
                        <Label>List your key skills</Label>
                        <TextArea
                          value={data.skills}
                          onChange={(v) => update("skills", v)}
                          placeholder="e.g. Python, Project Management, UI Design"
                        />
                      </div>
                    </div>
                  </>
                )}

                {currentStep === "Compensation" && (
                  <>
                    <StepHeader
                      title="Compensation & Availability"
                      subtitle="Let's talk numbers and timing"
                    />
                    <div className="space-y-6">
                      <div>
                        <Label>What's your expected salary range? (USD)</Label>
                        <SelectInput
                          value={data.salaryRange}
                          onChange={(v) => update("salaryRange", v)}
                          placeholder="Select your salary range"
                          options={SALARY_OPTIONS}
                        />
                      </div>
                      <div>
                        <Label>When are you available to start?</Label>
                        <div className="space-y-3">
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
                    </div>
                  </>
                )}

                {currentStep === "Preferences" && (
                  <>
                    <StepHeader
                      title="Work Preferences"
                      subtitle="Last step — how do you like to work?"
                    />
                    <div className="space-y-6">
                      <div>
                        <Label>What type of work arrangement do you prefer?</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}

            <NavButtons
              onBack={goBack}
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              submitting={submitting}
            />
          </div>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Step {stepIndex + 1} of {STEPS.length}: {currentStep}
        </p>
      </div>
    </div>
  );
}