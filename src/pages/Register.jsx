// src/pages/Register.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

// Brand colors
const PINE = "#247e6d";
const PINE_HOVER = "#2b8f7b";
const MIDNIGHT = "#031c26";

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

export default function Register() {
  const navigate = useNavigate();

  // form state
  const [name, setName] = useState("");        // NEW
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("jobseeker"); // default
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  // UI state
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // live password rules
  const rules = useMemo(() => {
    const upper = /[A-Z]/.test(pw);
    const lower = /[a-z]/.test(pw);
    const special = /[^A-Za-z0-9]/.test(pw);
    const len = pw.length >= 6;
    return { upper, lower, special, len, ok: upper && lower && special && len };
  }, [pw]);

  const match = pw && pw2 && pw === pw2;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!rules.ok) {
      setErr("Password does not meet the required rules.");
      return;
    }
    if (!match) {
      setErr("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      // include role, name and a couple of common aliases for compatibility
      const body = {
        name: name.trim(),          // NEW
        email: email.trim(),
        password: pw.trim(),
        role,                       // 'jobseeker' | 'employer'
        accountType: role,          // alias some APIs expect
        userType: role,             // another common alias
      };

      const tries = [
        () => api.post("/api/auth/register", body),
        () => api.post("/api/users/register", body),
        () => api.post("/api/register", body),
      ];

      let ok = false;
      let lastError = null;
      for (const call of tries) {
        try {
          await call();
          ok = true;
          break;
        } catch (e2) {
          lastError = e2;
        }
      }
      if (!ok) throw lastError || new Error("Registration failed.");

      setMsg("Account created! You can now log in.");
      setTimeout(() => navigate("/login"), 800);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const Rule = ({ ok, children }) => (
    <li className={`flex items-center gap-2 text-sm ${ok ? "text-green-700" : "text-gray-600"}`}>
      <span className={`inline-block w-4 h-4 rounded-full border ${ok ? "bg-green-600 border-green-600" : "border-gray-400"}`} />
      {children}
    </li>
  );

  const namePlaceholder = role === "employer" ? "Company or organisation name" : "Your full name";

  return (
    <section className="max-w-md mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold" style={{ color: MIDNIGHT }}>
          Create an Account
        </h1>
        <p className="text-sm text-gray-600">Register with your email and a strong password.</p>
      </div>

      {msg && <div className="border border-green-300 bg-green-50 text-green-700 rounded p-2 text-sm">{msg}</div>}
      {err && <div className="border border-red-300 bg-red-50 text-red-700 rounded p-2 text-sm">{err}</div>}

      <form onSubmit={submit} className="space-y-4">
        {/* Account type selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium">I’m registering as</p>
          <div role="tablist" aria-label="Account type" className="grid grid-cols-2 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              role="tab"
              aria-selected={role === "jobseeker"}
              onClick={() => setRole("jobseeker")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                role === "jobseeker" ? "bg-white shadow border" : "text-gray-700"
              }`}
            >
              Jobseeker
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === "employer"}
              onClick={() => setRole("employer")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                role === "employer" ? "bg-white shadow border" : "text-gray-700"
              }`}
            >
              Employer
            </button>
          </div>
        </div>

        {/* NEW: Name field */}
        <label className="block text-sm font-medium">
          Name
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border rounded-md p-2"
            placeholder={namePlaceholder}
          />
        </label>

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

        <label className="block text-sm font-medium">
          Confirm Password
          <div className="mt-1 relative">
            <input
              type={showPw2 ? "text" : "password"}
              required
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="w-full border rounded-md p-2 pr-10"
              placeholder="••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw2((v) => !v)}
              className="absolute right-2 top-2.5 text-gray-600"
              aria-label={showPw2 ? "Hide password" : "Show password"}
            >
              <Eye open={showPw2} />
            </button>
          </div>
        </label>

        {/* Rules */}
        <div className="rounded-md border p-3">
          <p className="text-sm font-medium mb-2">Password must contain:</p>
          <ul className="grid gap-1">
            <Rule ok={rules.upper}>At least one UPPERCASE letter</Rule>
            <Rule ok={rules.lower}>At least one lowercase letter</Rule>
            <Rule ok={rules.special}>At least one special character</Rule>
            <Rule ok={rules.len}>At least 6 characters</Rule>
          </ul>
        </div>

        <button
          type="submit"
          disabled={submitting || !rules.ok || !match}
          className="w-full rounded-md p-2 text-white disabled:opacity-50"
          style={{ backgroundColor: PINE }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PINE_HOVER)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PINE)}
        >
          {submitting ? "Creating account…" : "Register"}
        </button>

        <p className="text-sm text-gray-700">
          Already have an account?{" "}
          <Link to="/login" className="underline" style={{ color: PINE }}>
            Log in
          </Link>
        </p>
      </form>
    </section>
  );
}
