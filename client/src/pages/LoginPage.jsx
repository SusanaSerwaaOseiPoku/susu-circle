import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function LoginPage({ initialMode = "login" }) {
  const { login, register, clearError, isAuthenticated, sessionNotice } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/my-groups";

  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    clearError();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (mode === "register") {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
      setPassword("");
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-layout" aria-label="Account sign in">
      <div className="card auth-card">
        <p className="eyebrow">ACCOUNT ACCESS</p>
        <h1>
          {mode === "login" ? "Sign in to Susu Circle" : "Create your account"}
        </h1>
        <p className="muted">
          {mode === "login"
            ? "Log in to view My Groups, create circles, add members, and record contributions."
            : "Register with your email and password. Passwords are stored securely as bcrypt hashes."}
        </p>

        {sessionNotice && (
          <p className="notice error-notice" role="status">
            {sessionNotice}
          </p>
        )}

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => switchMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={mode === "register" ? "auth-tab active" : "auth-tab"}
            onClick={() => switchMode("register")}
          >
            Register
          </button>
        </div>

        <form className="stacked-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              Full name
              <input
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ama Mensah"
                required
              />
            </label>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="demo@susu.test"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              placeholder="At least 6 characters"
              required
            />
          </label>

          {error && (
            <p className="notice error-notice" role="alert">
              {error}
            </p>
          )}

          <div className="auth-actions">
            <button type="submit" disabled={submitting}>
              {submitting
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>
            <Link className="button-secondary button-link" to="/">
              Browse public circles
            </Link>
          </div>
        </form>

        <div className="demo-accounts">
          <strong>Test login (after running <code>npm run seed</code> in <code>server/</code>)</strong>
          <p className="muted">
            <code>demo@susu.test</code> / <code>susu1234</code> (owns Market
            Women Circle) · <code>kojo@susu.test</code> / <code>susu1234</code>
          </p>
        </div>
      </div>
    </section>
  );
}
