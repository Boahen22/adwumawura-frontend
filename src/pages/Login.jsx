import { useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";

const MIDNIGHT = "#031c26";
const PINE = "#247e6d";
const PINE_HOVER = "#2b8f7b";

function Eye({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.86 20.86 0 0 1 5.06-6.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.86 20.86 0 0 1-3.45 4.72" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const from = useMemo(() => location.state?.from?.pathname, [location.state]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);

    try {
      // Try a few common endpoints. Expect { user, token } or similar.
      const attempts = [
        () => api.post("/api/auth/login", { email, password: pw }),
        () => api.post("/api/login", { email, password: pw }),
        () => api.post("/api/users/login", { email, password: pw }),
      ];

      let res;
      for (const call of attempts) {
        try {
          res = await call();
          break;
        } catch {}
      }
      if (!res) throw new Error("Login failed.");

      const data = res.data?.data || res.data || {};
      // Try to extract token and user across shapes
      const token =
        data.token || data.accessToken || data.jwt || data.authToken || data?.session?.token || "";
      let user = data.user || data.account || data.profile || data.me || null;

      // If backend only returns minimal info, construct a minimal user with a role if you have it
      if (!user) user = { email };
      // IMPORTANT: ensure user.role is present, or your navbar can’t branch
      // If your backend returns 'role' differently, map it here:
      if (!user.role) {
        user.role = data.role || data.userRole || user.type || "jobseeker"; // default to jobseeker
      }

      // Persist and update context
      login(user, token);

      // Route: prefer "from" if present, else by role
      if (from) {
        navigate(from, { replace: true });
      } else if (String(user.role).toLowerCase() === "employer") {
        navigate("/employer/jobs", { replace: true });
      } else {
        navigate("/jobs", { replace: true });
      }
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: MIDNIGHT }}>
          Login
        </h1>
        <p className="text-sm text-gray-600">Welcome back.</p>
      </div>

      {err && <div className="border border-red-300 bg-red-50 text-red-700 rounded p-2 text-sm">{err}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border rounded-md p-2"
            placeholder="you@example.com"
          />
        </label>

        <label className="block text-sm font-medium">
          Password
          <div className="mt-1 relative">
            <input
              type={showPw ? "text" : "password"}
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full border rounded-md p-2 pr-10"
              placeholder="••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-2.5 text-gray-600"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              <Eye open={showPw} />
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md p-2 text-white disabled:opacity-50"
          style={{ backgroundColor: PINE }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PINE_HOVER)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PINE)}
        >
          {submitting ? "Signing in…" : "Login"}
        </button>

        <p className="text-sm text-gray-700">
          No account?{" "}
          <Link to="/register" className="underline" style={{ color: PINE }}>
            Register
          </Link>
        </p>
      </form>
    </section>
  );
}
