import { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Audiotool client instance (returned from audiotool() call)
  const [audiotoolInstance, setAudiotoolInstance] = useState(null);

  // Authentication status derived from the presence of a client instance
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Loading flag for async auth checks
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Any error that occurs during authentication
  const [authError, setAuthError] = useState(null);

  // Selected Machiniste – the ID of the machiniste chosen by the user
  const [machiniste, setMachiniste] = useState(null);

  // Update authentication state when the client instance changes
  useEffect(() => {
    setIsAuthenticated(!!audiotoolInstance);
  }, [audiotoolInstance]);

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
    navigateToLogin,
    machiniste,      // expose selected Machiniste ID
    setMachiniste,   // function to update the selected Machiniste
    audiotoolInstance, // expose the Audiotool client instance
    setAudiotoolInstance // function to store the instance
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
