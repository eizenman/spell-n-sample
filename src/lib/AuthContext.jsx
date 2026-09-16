import { createContext, useState, useEffect, useContext } from "react";
import { audiotool } from "@/api/audiotoolClient";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Token state – persisted in localStorage
  const [token, setToken] = useState(() =>
    localStorage.getItem("audiotool_access_token")
  );

  // Authentication status derived from token presence
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  // Loading flag for async auth checks
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Any error that occurs during authentication
  const [authError, setAuthError] = useState(null);

  // Selected Machiniste – the ID of the machiniste chosen by the user
  const [machiniste, setMachiniste] = useState(null);

  // Update authentication state when the token changes
  useEffect(() => {
    setIsAuthenticated(!!token);
  }, [token]);

  const logout = () => {
    localStorage.removeItem("audiotool_access_token");
    setToken(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  // Context value exposed to the rest of the app
  const contextValue = {
    token,
    isAuthenticated,
    isLoadingAuth,
    authError,
    logout,
    navigateToLogin,
    machiniste,      // expose selected Machiniste ID
    setMachiniste   // function to update the selected Machiniste
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
