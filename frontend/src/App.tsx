import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthComponent } from "@/components/ui/sign-up";
import { LoginComponent } from "@/components/ui/login";
import HeroSection from "@/components/ui/glassmorphism-trust-hero";
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

      {/* /main is a placeholder for your actual post-login
          dashboard/app screen. For now it renders the same
          hero content — swap in your real component here
          once you build it. */}
      <Route
        path="/main"
        element={
          <ProtectedRoute>
            <div className="w-full min-h-screen bg-zinc-950">
              <HeroSection />
            </div>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
