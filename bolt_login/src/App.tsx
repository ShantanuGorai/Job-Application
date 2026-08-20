import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthComponent } from "@/components/ui/sign-up";
import { LoginComponent } from "@/components/ui/login";

function App() {
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
          <AuthComponent brandName="EaseMize" onSwitchToLogin={() => setView("login")} />
        ) : (
          <LoginComponent brandName="EaseMize" onSwitchToSignUp={() => setView("signup")} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default App;
