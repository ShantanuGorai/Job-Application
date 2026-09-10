import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Wrap any route element in this to require a logged-in session.
 * Checks GET /auth/me on mount. While checking, shows a minimal
 * loading state. If not authenticated, redirects to /login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [authStatus, setAuthStatus] = useState<
    "checking" | "authenticated" | "unauthenticated"
  >("checking");

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        });

        const data = await response.json();

        if (cancelled) return;

        setAuthStatus(data.authenticated ? "authenticated" : "unauthenticated");
      } catch (error) {
        console.error("Auth check failed:", error);
        if (!cancelled) {
          setAuthStatus("unauthenticated");
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  if (authStatus === "checking") {
    return (
      <div className="w-full min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
