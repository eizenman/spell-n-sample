import { createContext, useState, useEffect, useContext } from "react";
import { initAudiotool } from "@/lib/audiotool-nexus";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Audiotool client instance (returned from audiotool() call) – only set when authenticated
  const [audiotoolInstance, setAudiotoolInstance] = useState(null);
  const [userName, setUserName] = useState(null);

  // Raw result of initAudiotool – always available so that login can be called
  const [authResult, setAuthResult] = useState(null);

  // Authentication status derived from the presence of a client instance
  const isAuthenticated = !!audiotoolInstance;

  // Loading flag for async auth checks
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Any error that occurs during authentication
  const [authError, setAuthError] = useState(null);

  // Selected Machiniste – the ID of the machiniste chosen by the user
  const [machiniste, setMachiniste] = useState(null);

  /* ----------  OAuth flow (init + login)  ---------- */
  useEffect(() => {
    let cancelled = false;
    setIsLoadingAuth(true);
    initAudiotool()
      .then((result) => {
        if (cancelled) return;
        // Store the raw result for login/logout usage
        setAuthResult(result);

        if (result.status === "authenticated") {
          setAudiotoolInstance(result);   // the client itself
          setUserName(result.userName || result.user?.email || null);
          setAuthError(null);
        } else {
          setAudiotoolInstance(null);
          setUserName(null);
          setAuthError(result.error ? result.error.message : "Not authenticated");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setAudiotoolInstance(null);
        setUserName(null);
        setAuthResult(null);
        setAuthError(err.message || "Audiotool init failed");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAuth(false);
      });

    return () => { cancelled = true; };
  }, []);

  const logout = () => {
    // If we have a logged‑in Audiotool client instance, call its logout method first.
    if (audiotoolInstance && typeof audiotoolInstance.logout === "function") {
      try {
        audiotoolInstance.logout();
      } catch (_) {
        /* ignore errors – we still want to clear local state */
      }
    }

    // Clear context state
    setAudiotoolInstance(null);
    setUserName(null);
  };

  const login = () => {
    if (authResult && typeof authResult.login === "function") {
      try {
        authResult.login();
      } catch (_) {}
    }
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  // Context value exposed to the rest of the app
  const contextValue = {
    isAuthenticated,
    isLoadingAuth,
    authError,
    logout,
    login,
    navigateToLogin,
    machiniste,      // expose selected Machiniste ID
    setMachiniste,   // function to update the selected Machiniste
    audiotoolInstance, // expose the Audiotool client instance (authenticated only)
    setAudiotoolInstance, // function to store the instance (used by VocalPads)
    userName,
    authResult      // raw init result for login/logout usage
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
