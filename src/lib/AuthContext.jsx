import { createContext, useState, useEffect, useContext } from "react";
import { audiotool } from "@/api/audiotoolClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() =>
    localStorage.getItem("audiotool_access_token")
  );
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState(null);

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

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        isLoadingAuth,
        authError,
        logout,
        navigateToLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
