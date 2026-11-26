import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  clearAuthToken,
  getApiErrorMessage,
  getAuthToken,
  onUnauthorized,
  setAuthToken,
} from "../api.js";

export const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(getAuthToken()));
  const [authError, setAuthError] = useState("");
  const [sessionNotice, setSessionNotice] = useState("");

  useEffect(() => {
    return onUnauthorized(() => {
      setToken("");
      setUser(null);
      setSessionNotice("Your session expired or required sign-in. Please log in.");
    });
  }, []);

  useEffect(() => {
    const existingToken = getAuthToken();
    if (!existingToken) {
      setAuthLoading(false);
      return undefined;
    }

    let cancelled = false;
    setAuthToken(existingToken);

    async function restoreSession() {
      try {
        const response = await api.get("/auth/me");
        if (!cancelled) {
          setUser(response.data.user);
          setToken(existingToken);
          setSessionNotice("");
        }
      } catch {
        if (!cancelled) {
          clearAuthToken();
          setToken("");
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthError("");
    setSessionNotice("");
    try {
      const response = await api.post("/auth/login", { email, password });
      const nextToken = response.data.token;
      const nextUser = response.data.user;
      setAuthToken(nextToken);
      setToken(nextToken);
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not sign in.");
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    setAuthError("");
    setSessionNotice("");
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      const nextToken = response.data.token;
      const nextUser = response.data.user;
      setAuthToken(nextToken);
      setToken(nextToken);
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not create account.");
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setToken("");
    setUser(null);
    setAuthError("");
    setSessionNotice("");
  }, []);

  const clearError = useCallback(() => {
    setAuthError("");
    setSessionNotice("");
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      authLoading,
      authError,
      sessionNotice,
      login,
      register,
      logout,
      clearError,
    }),
    [
      authError,
      authLoading,
      clearError,
      login,
      logout,
      register,
      sessionNotice,
      token,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
