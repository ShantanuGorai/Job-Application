import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthComponent } from "@/components/ui/sign-up";
import { LoginComponent } from "@/components/ui/login";
import HeroSection from "@/components/ui/glassmorphism-trust-hero";
import BentoGrid01 from "@/components/ui/bento-grid-01";
import CareerOnboardingForm from "@/components/ui/career-onboarding-form";
import Dashboard from "@/components/ui/dashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// =====================================================
// /login — toggles between the login and signup views,
// same as before, just now living at its own route.
// =====================================================

function LoginPage() {
  const [view, setView] = useState<"signup" | "login">("login");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {view === "signup" ? (
          <AuthComponent
            brandName="EaseMize"
            onSwitchToLogin={() => setView("login")}
          />
        ) : (
          <LoginComponent
            brandName="EaseMize"
            onSwitchToSignUp={() => setView("signup")}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// =====================================================
// APP ROUTES
// =====================================================

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />

      {/* Public — reachable directly at 5173/features or via the
          "Explore Features" button on the hero page, no login needed. */}
      <Route path="/features" element={<BentoGrid01 />} />

      {/* Public — reachable directly at 5173/get-started or via the
          "Get Started" button on the hero page, no login needed. */}
      <Route path="/get-started" element={<CareerOnboardingForm />} />

      {/* Protected: only reachable with a valid session.
          ProtectedRoute checks GET /auth/me and bounces
          to /login if not authenticated. */}
      <Route
        path="/hero"
        element={
          <ProtectedRoute>
            <div className="w-full min-h-screen bg-zinc-950">
              <HeroSection />
            </div>
          </ProtectedRoute>
        }
      />

      {/* The main app hub: resume upload, job matches,
          applied-jobs tracking, profile score. */}
      <Route
        path="/main"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;