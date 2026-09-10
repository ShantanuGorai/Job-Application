import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  Mail,
  Lock,
  ArrowLeft,
  LogIn,
  Loader,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  Confetti,
  type ConfettiRef,
  BlurFade,
  GlassButton,
  GoogleIcon,
  GitHubIcon,
  DefaultLogo,
  AuthShell,
  AuthModal,
} from "@/components/ui/auth-shared";

const API_URL = import.meta.env.VITE_API_URL;

const loginModalSteps = [
  {
    message: "Verifying credentials...",
    icon: (
      <Loader className="w-12 h-12 text-primary animate-spin" />
    ),
  },
  {
    message: "Loading your workspace...",
    icon: (
      <Loader className="w-12 h-12 text-primary animate-spin" />
    ),
  },
  {
    message: "Almost there...",
    icon: (
      <Loader className="w-12 h-12 text-primary animate-spin" />
    ),
  },
  {
    message: "Welcome Back!",
    icon: (
      <LogIn className="w-12 h-12 text-green-500" />
    ),
  },
];

const TEXT_LOOP_INTERVAL = 1.5;

interface LoginComponentProps {
  logo?: React.ReactNode;
  brandName?: string;
  onSwitchToSignUp?: () => void;
}

export const LoginComponent = ({
  logo = <DefaultLogo />,
  brandName = "EaseMize",
  onSwitchToSignUp,
}: LoginComponentProps) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [authStep, setAuthStep] = useState<
    "email" | "password"
  >("email");

  const [modalStatus, setModalStatus] = useState<
    "closed" | "loading" | "error" | "success"
  >("closed");

  const [modalErrorMessage, setModalErrorMessage] =
    useState("");

  const confettiRef = useRef<ConfettiRef>(null);

  const passwordInputRef =
    useRef<HTMLInputElement>(null);

  const isEmailValid =
    /\S+@\S+\.\S+/.test(email);

  const isPasswordValid =
    password.length >= 1;

  // =====================================================
  // CONFETTI
  // =====================================================

  const fireSideCanons = () => {
    const fire = confettiRef.current?.fire;

    if (fire) {
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 100,
      };

      const particleCount = 50;

      fire({
        ...defaults,
        particleCount,
        origin: { x: 0, y: 1 },
        angle: 60,
      });

      fire({
        ...defaults,
        particleCount,
        origin: { x: 1, y: 1 },
        angle: 120,
      });
    }
  };

  // =====================================================
  // EMAIL LOGIN
  // =====================================================

  const handleFinalSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      modalStatus !== "closed" ||
      authStep !== "password"
    ) {
      return;
    }

    if (!email || !isEmailValid) {
      setModalErrorMessage(
        "Please enter a valid email address."
      );

      setModalStatus("error");
      return;
    }

    if (!isPasswordValid) {
      setModalErrorMessage(
        "Please enter your password."
      );

      setModalStatus("error");
      return;
    }

    try {
      setModalStatus("loading");
      setModalErrorMessage("");

      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Invalid email or password."
        );
      }

      // Backend login successful.
      // Keep the existing animation.
      setTimeout(() => {
        fireSideCanons();
        setModalStatus("success");

        // Redirect to Hero page (client-side route, same app)
        setTimeout(() => {
          navigate("/hero");
        }, 1200);
      }, TEXT_LOOP_INTERVAL * 3 * 1000);

    } catch (error) {
      console.error("Login error:", error);

      setModalErrorMessage(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again."
      );

      setModalStatus("error");
    }
  };

  // =====================================================
  // GOOGLE LOGIN
  // =====================================================

  const handleGoogleLogin = () => {
    window.location.href =
      `${API_URL}/auth/google`;
  };

  // =====================================================
  // GITHUB LOGIN
  // =====================================================

  const handleGitHubLogin = () => {
    window.location.href =
      `${API_URL}/auth/github`;
  };

  // =====================================================
  // EMAIL → PASSWORD
  // =====================================================

  const handleProgressStep = () => {
    if (
      authStep === "email" &&
      isEmailValid
    ) {
      setAuthStep("password");
    }
  };

  // =====================================================
  // ENTER KEY
  // =====================================================

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (authStep === "email") {
        handleProgressStep();
      }
    }
  };

  // =====================================================
  // GO BACK
  // =====================================================

  const handleGoBack = () => {
    if (authStep === "password") {
      setAuthStep("email");
    }
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    setModalStatus("closed");
    setModalErrorMessage("");
  };

  // =====================================================
  // PASSWORD AUTO FOCUS
  // =====================================================

  useEffect(() => {
    if (authStep === "password") {
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 500);
    }
  }, [authStep]);

  // =====================================================
  // CONFETTI
  // =====================================================

  useEffect(() => {
    if (modalStatus === "success") {
      fireSideCanons();
    }
  }, [modalStatus]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      <Confetti
        ref={confettiRef}
        manualstart
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]"
      />

      <AuthModal
        modalStatus={modalStatus}
        modalErrorMessage={modalErrorMessage}
        modalSteps={loginModalSteps}
        onClose={closeModal}
        successContent={
          <div className="flex flex-col items-center gap-4">
            {
              loginModalSteps[
                loginModalSteps.length - 1
              ].icon
            }

            <p className="text-lg font-medium text-foreground">
              {
                loginModalSteps[
                  loginModalSteps.length - 1
                ].message
              }
            </p>
          </div>
        }
      />

      <AuthShell
        brandName={brandName}
        logo={logo}
        modalStatus={modalStatus}
      >
        <AnimatePresence mode="wait">

          {/* ================= EMAIL STEP ================= */}

          {authStep === "email" && (
            <motion.div
              key="email-content"
              initial={{
                y: 6,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              className="w-full flex flex-col items-center gap-4"
            >
              <BlurFade
                delay={0.25 * 1}
                className="w-full"
              >
                <div className="text-center">
                  <p className="font-serif font-light text-4xl sm:text-5xl md:text-6xl tracking-tight text-foreground whitespace-nowrap">
                    Welcome Back
                  </p>
                </div>
              </BlurFade>

              <BlurFade delay={0.25 * 2}>
                <p className="text-sm font-medium text-muted-foreground">
                  Continue with
                </p>
              </BlurFade>

              {/* SOCIAL LOGIN */}

              <BlurFade delay={0.25 * 3}>
                <div className="flex items-center justify-center gap-4 w-full">

                  <GlassButton
                    type="button"
                    onClick={handleGoogleLogin}
                    contentClassName="flex items-center justify-center gap-2"
                    size="sm"
                  >
                    <GoogleIcon />

                    <span className="font-semibold text-foreground">
                      Google
                    </span>
                  </GlassButton>

                  <GlassButton
                    type="button"
                    onClick={handleGitHubLogin}
                    contentClassName="flex items-center justify-center gap-2"
                    size="sm"
                  >
                    <GitHubIcon />

                    <span className="font-semibold text-foreground">
                      GitHub
                    </span>
                  </GlassButton>

                </div>
              </BlurFade>

              <BlurFade
                delay={0.25 * 4}
                className="w-[300px]"
              >
                <div className="flex items-center w-full gap-2 py-2">
                  <hr className="w-full border-border" />

                  <span className="text-xs font-semibold text-muted-foreground">
                    OR
                  </span>

                  <hr className="w-full border-border" />
                </div>
              </BlurFade>
            </motion.div>
          )}

          {/* ================= PASSWORD STEP ================= */}

          {authStep === "password" && (
            <motion.div
              key="password-title"
              initial={{
                y: 6,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              className="w-full flex flex-col items-center text-center gap-4"
            >
              <BlurFade
                delay={0}
                className="w-full"
              >
                <div className="text-center">
                  <p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-foreground whitespace-nowrap">
                    Enter your password
                  </p>
                </div>
              </BlurFade>

              <BlurFade delay={0.25 * 1}>
                <p className="text-sm font-medium text-muted-foreground">
                  Welcome back, enter your password to continue.
                </p>
              </BlurFade>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ================= LOGIN FORM ================= */}

        <form
          onSubmit={handleFinalSubmit}
          className="w-[300px] space-y-6"
        >
          <motion.div
            key="email-password-fields"
            className="w-full space-y-6"
          >

            {/* EMAIL */}

            <BlurFade
              delay={
                authStep === "email"
                  ? 0.25 * 5
                  : 0
              }
              inView={true}
              className="w-full"
            >
              <div className="relative w-full">

                <AnimatePresence>
                  {authStep === "password" && (
                    <motion.div
                      initial={{
                        y: -10,
                        opacity: 0,
                      }}
                      animate={{
                        y: 0,
                        opacity: 1,
                      }}
                      transition={{
                        duration: 0.3,
                        delay: 0.4,
                      }}
                      className="absolute -top-6 left-4 z-10"
                    >
                      <label className="text-xs text-muted-foreground font-semibold">
                        Email
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="glass-input-wrap w-full">
                  <div className="glass-input">

                    <span className="glass-input-text-area"></span>

                    <div
                      className={cn(
                        "relative z-10 flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 ease-in-out",
                        email.length > 20 &&
                          authStep === "email"
                          ? "w-0 px-0"
                          : "w-10 pl-2"
                      )}
                    >
                      <Mail className="h-5 w-5 text-foreground/80 flex-shrink-0" />
                    </div>

                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      onKeyDown={handleKeyDown}
                      className={cn(
                        "relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none transition-[padding-right] duration-300 ease-in-out delay-300",
                        isEmailValid &&
                          authStep === "email"
                          ? "pr-2"
                          : "pr-0"
                      )}
                    />

                    <div
                      className={cn(
                        "relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
                        isEmailValid &&
                          authStep === "email"
                          ? "w-10 pr-1"
                          : "w-0"
                      )}
                    >
                      <GlassButton
                        type="button"
                        onClick={handleProgressStep}
                        size="icon"
                        aria-label="Continue with email"
                        contentClassName="text-foreground/80 hover:text-foreground"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </GlassButton>
                    </div>

                  </div>
                </div>

              </div>
            </BlurFade>

            {/* PASSWORD */}

            <AnimatePresence>
              {authStep === "password" && (
                <BlurFade
                  key="password-field"
                  className="w-full"
                >
                  <div className="relative w-full">

                    <AnimatePresence>
                      {password.length > 0 && (
                        <motion.div
                          initial={{
                            y: -10,
                            opacity: 0,
                          }}
                          animate={{
                            y: 0,
                            opacity: 1,
                          }}
                          transition={{
                            duration: 0.3,
                          }}
                          className="absolute -top-6 left-4 z-10"
                        >
                          <label className="text-xs text-muted-foreground font-semibold">
                            Password
                          </label>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="glass-input-wrap w-full">
                      <div className="glass-input">

                        <span className="glass-input-text-area"></span>

                        <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">

                          {isPasswordValid ? (
                            <button
                              type="button"
                              aria-label="Toggle password visibility"
                              onClick={() =>
                                setShowPassword(
                                  !showPassword
                                )
                              }
                              className="text-foreground/80 hover:text-foreground transition-colors p-2 rounded-full"
                            >
                              {showPassword ? (
                                <EyeOffIcon />
                              ) : (
                                <EyeOnIcon />
                              )}
                            </button>
                          ) : (
                            <Lock className="h-5 w-5 text-foreground/80 flex-shrink-0" />
                          )}

                        </div>

                        <input
                          ref={passwordInputRef}
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          placeholder="Password"
                          value={password}
                          onChange={(e) =>
                            setPassword(e.target.value)
                          }
                          className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none"
                        />

                        <div
                          className={cn(
                            "relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
                            isPasswordValid
                              ? "w-10 pr-1"
                              : "w-0"
                          )}
                        >
                          <GlassButton
                            type="submit"
                            size="icon"
                            aria-label="Log in"
                            contentClassName="text-foreground/80 hover:text-foreground"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </GlassButton>
                        </div>

                      </div>
                    </div>

                  </div>

                  <BlurFade
                    inView
                    delay={0.2}
                  >
                    <div className="mt-4 flex items-center justify-between w-full">

                      <button
                        type="button"
                        onClick={handleGoBack}
                        className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Go back
                      </button>

                      <button
                        type="button"
                        className="text-sm text-foreground/70 hover:text-foreground transition-colors hover:underline"
                      >
                        Forgot password?
                      </button>

                    </div>
                  </BlurFade>

                </BlurFade>
              )}
            </AnimatePresence>

          </motion.div>
        </form>

        {/* SWITCH TO SIGNUP */}

        <BlurFade
          delay={0.25 * 6}
          className="w-[300px]"
        >
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}

            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="font-semibold text-foreground hover:underline transition-colors"
            >
              Sign up
            </button>
          </p>
        </BlurFade>

      </AuthShell>
    </>
  );
};


// =====================================================
// PASSWORD ICONS
// =====================================================

function EyeOnIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle
        cx="12"
        cy="12"
        r="3"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line
        x1="2"
        x2="22"
        y1="2"
        y2="22"
      />
    </svg>
  );
}