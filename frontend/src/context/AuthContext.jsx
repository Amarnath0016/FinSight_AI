import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContextCore";
import {
  loginUser,
  registerUser,
  getMe,
  getStoredToken,
  clearStoredToken,
} from "../services/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("finsight_auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => getStoredToken());
  const [authLoading, setAuthLoading] = useState(true);

  // Validate session with backend on initial app load
  useEffect(() => {
    async function verifySession() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setAuthLoading(false);
        return;
      }

      try {
        const userData = await getMe();
        setUser(userData);
        setToken(storedToken);
      } catch (err) {
        console.warn("Session check failed:", err.message);
        clearStoredToken();
        setUser(null);
        setToken(null);
      } finally {
        setAuthLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await loginUser({ email, password });
    setUser(result.user);
    setToken(result.token);
    return result.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const result = await registerUser({ name, email, password });
    setUser(result.user);
    setToken(result.token);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    authLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
