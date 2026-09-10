import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  Mail,
  Lock,
  ArrowLeft,
  PartyPopper,
  Loader,
  ShieldCheck,
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

const signUpModalSteps = [
  {
    message: "Creating your account...",
    icon: (
      <Loader className="w-12 h-12 text-primary animate-spin" />
    ),
  },
  {
    message: "Saving your details...",
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
    message: "Welcome Aboard!",
    icon: (
      <PartyPopper className="w-12 h-12 text-green-500" />
    ),
  },
];

const TEXT_LOOP_INTERVAL = 1.5;
const OTP_LENGTH = 4;

interface SignUpComponentProps {
  logo?: React.ReactNode;
  brandName?: string;
  onSwitchToLogin?: () => void;
}

export const AuthComponent = ({
  logo = <DefaultLogo />,
  brandName = "EaseMize",
  onSwitchToLogin,
}: SignUpComponentProps) => {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [authStep, setAuthStep] = useState<
    "email" | "password" | "confirmPassword" | "otp"
  >("email");

  const [modalStatus, setModalStatus] = useState<
    "closed" | "loading" | "error" | "success"
  >("closed");

  const [modalErrorMessage, setModalErrorMessage] =
    useState("");

  const [otpDigits, setOtpDigits] = useState<
    string[]
  >(Array(OTP_LENGTH).fill(""));

  const [resendStatus, setResendStatus] = useState<
    "idle" | "sending" | "sent"
  >("idle");

  const confettiRef = useRef<ConfettiRef>(null);

  const passwordInputRef =
    useRef<HTMLInputElement>(null);

  const confirmPasswordInputRef =
    useRef<HTMLInputElement>(null);

  const otpRefs = useRef<
    (HTMLInputElement | null)[]
  >([]);

  const isEmailValid =
    /\S+@\S+\.\S+/.test(email);

  const isPasswordValid =
    password.length >= 6;

  const isConfirmPasswordValid =
    confirmPassword.length >= 6;

  const isOtpComplete =
    otpDigits.every((d) => d !== "");



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


  const handleGoogleSignup = () => {
    window.location.href =
      `${API_URL}/auth/google`;
  };


  const handleGitHubSignup = () => {
    window.location.href =
      `${API_URL}/auth/github`;
  };



  const handleProgressStep = () => {

    if (
      authStep === "email" &&
      isEmailValid
    ) {
      setAuthStep("password");
      return;
    }

    if (
      authStep === "password" &&
      isPasswordValid
    ) {
      setAuthStep("confirmPassword");
    }
  };


  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleProgressStep();
    }
  };



  const handleConfirmPasswordSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      modalStatus !== "closed" ||
      authStep !== "confirmPassword"
    ) {
      return;
    }

    if (!isConfirmPasswordValid) {
      setModalErrorMessage(
        "Please enter your confirm password."
      );

      setModalStatus("error");
      return;
    }

    if (password !== confirmPassword) {
      setModalErrorMessage(
        "Passwords do not match!"
      );

      setModalStatus("error");
      return;
    }

    try {

      setModalStatus("loading");
      setModalErrorMessage("");

      const response = await fetch(
        `${API_URL}/auth/signup`,
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
            "Signup failed. Please try again."
        );
      }


      setModalStatus("closed");

      setAuthStep("otp");

      setOtpDigits(
        Array(OTP_LENGTH).fill("")
      );

      setResendStatus("idle");

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 500);

    } catch (error) {

      console.error(
        "Signup error:",
        error
      );

      setModalErrorMessage(
        error instanceof Error
          ? error.message
          : "Signup failed. Please try again."
      );

      setModalStatus("error");
    }
  };

 
  const handleOtpChange = (
    index: number,
    value: string
  ) => {
    const digit = value
      .replace(/[^0-9]/g, "")
      .slice(-1);

    const newOtp = [...otpDigits];

    newOtp[index] = digit;

    setOtpDigits(newOtp);

    if (
      digit &&
      index < OTP_LENGTH - 1
    ) {
      otpRefs.current[
        index + 1
      ]?.focus();
    }
  };

 

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {

    if (
      e.key === "Backspace" &&
      !otpDigits[index] &&
      index > 0
    ) {
      otpRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      e.key === "Enter" &&
      isOtpComplete
    ) {
      e.preventDefault();
      handleOtpSubmit();
    }
  };

  const handleOtpPaste = (
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, OTP_LENGTH);

    if (pasted.length > 0) {

      const newOtp =
        Array(OTP_LENGTH).fill("");

      for (
        let i = 0;
        i < pasted.length;
        i++
      ) {
        newOtp[i] = pasted[i];
      }

      setOtpDigits(newOtp);

      const focusIndex = Math.min(
        pasted.length,
        OTP_LENGTH - 1
      );

      otpRefs.current[
        focusIndex
      ]?.focus();
    }
  };

  const handleOtpSubmit = async () => {

    if (
      modalStatus !== "closed" ||
      authStep !== "otp"
    ) {
      return;
    }

    if (!isOtpComplete) {
      setModalErrorMessage(
        "Please enter all 4 digits."
      );

      setModalStatus("error");
      return;
    }

    const otp = otpDigits.join("");

    try {

      setModalStatus("loading");
      setModalErrorMessage("");

      const response = await fetch(
        `${API_URL}/auth/verify-otp`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Invalid verification code. Please try again."
        );
      }

   

      setTimeout(() => {

        fireSideCanons();

        setModalStatus("success");

    
        setTimeout(() => {
          navigate("/hero");
        }, 1200);

      }, TEXT_LOOP_INTERVAL * 1000);

    } catch (error) {

      console.error(
        "OTP verification error:",
        error
      );

      setModalErrorMessage(
        error instanceof Error
          ? error.message
          : "Verification failed. Please try again."
      );

      setModalStatus("error");


      setOtpDigits(
        Array(OTP_LENGTH).fill("")
      );

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 300);
    }
  };



  const handleResendOtp = async () => {

    if (resendStatus === "sending") {
      return;
    }

    try {

      setResendStatus("sending");
      setModalErrorMessage("");

      const response = await fetch(
        `${API_URL}/auth/resend-otp`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not resend verification code."
        );
      }

      setOtpDigits(
        Array(OTP_LENGTH).fill("")
      );

      setResendStatus("sent");

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 300);

  
      setTimeout(() => {
        setResendStatus("idle");
      }, 5000);

    } catch (error) {

      console.error(
        "Resend OTP error:",
        error
      );

      setModalErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not resend verification code."
      );

      setModalStatus("error");

      setResendStatus("idle");
    }
  };

  const handleGoBack = () => {

    if (authStep === "otp") {

      setAuthStep("confirmPassword");

      setOtpDigits(
        Array(OTP_LENGTH).fill("")
      );

    } else if (
      authStep === "confirmPassword"
    ) {

      setAuthStep("password");

      setConfirmPassword("");

    } else if (
      authStep === "password"
    ) {

      setAuthStep("email");
    }
  };

  const closeModal = () => {
    setModalStatus("closed");
    setModalErrorMessage("");
  };


  useEffect(() => {

    if (authStep === "password") {

      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 500);

    } else if (
      authStep === "confirmPassword"
    ) {

      setTimeout(() => {
        confirmPasswordInputRef.current?.focus();
      }, 500);

    } else if (
      authStep === "otp"
    ) {

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 500);
    }

  }, [authStep]);


  useEffect(() => {

    if (modalStatus === "success") {
      fireSideCanons();
    }

  }, [modalStatus]);



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
        modalSteps={signUpModalSteps}
        onClose={closeModal}
        successContent={
          <div className="flex flex-col items-center gap-4">

            {
              signUpModalSteps[
                signUpModalSteps.length - 1
              ].icon
            }

            <p className="text-lg font-medium text-foreground">
              {
                signUpModalSteps[
                  signUpModalSteps.length - 1
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

          {/* =====================================================
              EMAIL
          ===================================================== */}

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
                    Get started with Us
                  </p>

                </div>
              </BlurFade>

              <BlurFade delay={0.25 * 2}>
                <p className="text-sm font-medium text-muted-foreground">
                  Continue with
                </p>
              </BlurFade>

              {/* SOCIAL */}

              <BlurFade delay={0.25 * 3}>

                <div className="flex items-center justify-center gap-4 w-full">

                  <GlassButton
                    type="button"
                    onClick={handleGoogleSignup}
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
                    onClick={handleGitHubSignup}
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

          {/* =====================================================
              PASSWORD
          ===================================================== */}

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
                    Create your password
                  </p>

                </div>

              </BlurFade>

              <BlurFade delay={0.25 * 1}>

                <p className="text-sm font-medium text-muted-foreground">
                  Your password must be at least 6 characters long.
                </p>

              </BlurFade>

            </motion.div>
          )}

          {/* =====================================================
              CONFIRM PASSWORD
          ===================================================== */}

          {authStep === "confirmPassword" && (

            <motion.div
              key="confirm-title"
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
                    One Last Step
                  </p>

                </div>

              </BlurFade>

              <BlurFade delay={0.25 * 1}>

                <p className="text-sm font-medium text-muted-foreground">
                  Confirm your password to continue
                </p>

              </BlurFade>

            </motion.div>
          )}

          {/* =====================================================
              OTP UI
          ===================================================== */}

          {authStep === "otp" && (

            <motion.div
              key="otp-title"
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

                <div className="text-center flex flex-col items-center gap-3">

                  <div className="bg-primary/10 text-primary rounded-full p-3">
                    <ShieldCheck className="w-8 h-8" />
                  </div>

                  <p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-foreground whitespace-nowrap">
                    Verify Your Email
                  </p>

                </div>

              </BlurFade>

              <BlurFade delay={0.25 * 1}>

                <p className="text-sm font-medium text-muted-foreground max-w-[280px]">

                  Enter the 4-digit code to continue with{" "}

                  <span className="font-semibold text-foreground">
                    {email}
                  </span>

                </p>

              </BlurFade>

            </motion.div>
          )}

        </AnimatePresence>

        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          onSubmit={handleConfirmPasswordSubmit}
          className="w-[300px] space-y-6"
        >

          {/* EMAIL + PASSWORD */}

          <AnimatePresence>

            {authStep !== "confirmPassword" &&
              authStep !== "otp" && (

                <motion.div
                  key="email-password-fields"
                  exit={{
                    opacity: 0,
                    filter: "blur(4px)",
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut",
                  }}
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
                                      <EyeOff />
                                    ) : (
                                      <EyeOn />
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
                                  setPassword(
                                    e.target.value
                                  )
                                }
                                onKeyDown={handleKeyDown}
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
                                  type="button"
                                  onClick={handleProgressStep}
                                  size="icon"
                                  aria-label="Continue"
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

                          <button
                            type="button"
                            onClick={handleGoBack}
                            className="mt-4 flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                          >

                            <ArrowLeft className="w-4 h-4" />

                            Go back

                          </button>

                        </BlurFade>

                      </BlurFade>

                    )}

                  </AnimatePresence>

                </motion.div>
              )}

          </AnimatePresence>

          {/* CONFIRM PASSWORD */}

          <AnimatePresence>

            {authStep === "confirmPassword" && (

              <BlurFade
                key="confirm-password-field"
                className="w-full"
              >

                <div className="relative w-full">

                  <AnimatePresence>

                    {confirmPassword.length > 0 && (

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
                          Confirm Password
                        </label>

                      </motion.div>

                    )}

                  </AnimatePresence>

                  <div className="glass-input-wrap w-[300px]">

                    <div className="glass-input">

                      <span className="glass-input-text-area"></span>

                      <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">

                        {isConfirmPasswordValid ? (

                          <button
                            type="button"
                            aria-label="Toggle confirm password visibility"
                            onClick={() =>
                              setShowConfirmPassword(
                                !showConfirmPassword
                              )
                            }
                            className="text-foreground/80 hover:text-foreground transition-colors p-2 rounded-full"
                          >

                            {showConfirmPassword ? (
                              <EyeOff />
                            ) : (
                              <EyeOn />
                            )}

                          </button>

                        ) : (

                          <Lock className="h-5 w-5 text-foreground/80 flex-shrink-0" />

                        )}

                      </div>

                      <input
                        ref={confirmPasswordInputRef}
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(
                            e.target.value
                          )
                        }
                        className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none"
                      />

                      <div
                        className={cn(
                          "relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
                          isConfirmPasswordValid
                            ? "w-10 pr-1"
                            : "w-0"
                        )}
                      >

                        <GlassButton
                          type="submit"
                          size="icon"
                          aria-label="Continue to verification"
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

                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="mt-4 flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                  >

                    <ArrowLeft className="w-4 h-4" />

                    Go back

                  </button>

                </BlurFade>

              </BlurFade>
            )}

          </AnimatePresence>

          {/* OTP */}

          <AnimatePresence>

            {authStep === "otp" && (

              <BlurFade
                key="otp-fields"
                className="w-full"
              >

                <div className="flex items-center justify-center gap-3 w-[300px]">

                  {otpDigits.map((digit, i) => (

                    <div
                      key={i}
                      className="glass-input-wrap flex-1"
                      style={{
                        maxWidth: "56px",
                      }}
                    >

                      <div
                        className="glass-input"
                        style={{
                          justifyContent: "center",
                          padding: "0.25rem 0",
                        }}
                      >

                        <span className="glass-input-text-area"></span>

                        <input
                          ref={(el) => {
                            otpRefs.current[i] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(
                              i,
                              e.target.value
                            )
                          }
                          onKeyDown={(e) =>
                            handleOtpKeyDown(
                              e,
                              i
                            )
                          }
                          onPaste={handleOtpPaste}
                          aria-label={`OTP digit ${
                            i + 1
                          }`}
                          className="relative z-10 h-12 w-full bg-transparent text-center text-2xl font-semibold text-foreground focus:outline-none"
                        />

                      </div>

                    </div>

                  ))}

                </div>

                <div className="flex flex-col items-center gap-4 mt-6">

                  <div
                    className={cn(
                      "transition-all duration-300 overflow-hidden",
                      isOtpComplete
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    )}
                  >

                    <GlassButton
                      type="button"
                      onClick={handleOtpSubmit}
                      size="sm"
                      contentClassName="flex items-center gap-2"
                    >

                      <ShieldCheck className="w-4 h-4" />

                      <span className="font-semibold text-foreground">
                        Verify & Create Account
                      </span>

                    </GlassButton>

                  </div>

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
                    onClick={handleResendOtp}
                    disabled={resendStatus === "sending"}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                  >
                    {resendStatus === "sending"
                      ? "Sending..."
                      : resendStatus === "sent"
                      ? "Code sent!"
                      : "Didn't receive a code? Resend"}
                  </button>

                </div>

              </BlurFade>
            )}

          </AnimatePresence>

        </form>

        {/* SWITCH LOGIN */}

        <BlurFade
          delay={0.25 * 6}
          className="w-[300px]"
        >

          <p className="text-center text-sm text-muted-foreground">

            Already have an account?{" "}

            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold text-foreground hover:underline transition-colors"
            >
              Log in
            </button>

          </p>

        </BlurFade>

      </AuthShell>
    </>
  );
};


// =====================================================
// ICONS
// =====================================================

function EyeOn() {
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
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
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