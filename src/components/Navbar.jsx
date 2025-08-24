import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import api from "../api/axios";

const MIDNIGHT = "#031c26";
const MIDNIGHT_HOVER = "#083847";
const BRAND_GOLD = "#f6c453";
const PINE = "#01796F";

function BellIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 8a5.5 5.5 0 0 1 11 0c0 6 2 7 2 7H4.5s2-1 2-7" />
      <path d="M10 21h4" />
    </svg>
  );
}
function UserIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function SunIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
function MoonIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function readStoredUser() {
  try {
    const keys = ["user", "authUser", "currentUser"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return null;
}
function normalizeRole(role) {
  let r = role;
  if (Array.isArray(r)) r = r[0];
  if (r && typeof r === "object") r = r.name ?? r.role ?? r.type;
  return (r || "").toString().toLowerCase();
}
function isEmployer(u) {
  if (!u) return false;
  const r = normalizeRole(u.role);
  if (r === "employer") return true;
  if (u?.type?.toString().toLowerCase() === "employer") return true;
  if (Array.isArray(u?.roles) && u.roles.map(normalizeRole).includes("employer")) return true;
  return false;
}
function isJobseeker(u) {
  if (!u) return false;
  const r = normalizeRole(u.role);
  if (r === "jobseeker") return true;
  if (u?.type?.toString().toLowerCase() === "jobseeker") return true;
  if (Array.isArray(u?.roles) && u.roles.map(normalizeRole).includes("jobseeker")) return true;
  return false;
}
function isAdmin(u) {
  if (!u) return false;
  if (u?.isAdmin) return true;
  const r = normalizeRole(u.role);
  if (r === "admin") return true;
  if (Array.isArray(u?.roles) && u.roles.map(normalizeRole).includes("admin")) return true;
  return false;
}
function isEmployerVerified(u) {
  if (!u) return false;
  const status = (u?.verificationStatus || "").toString().toLowerCase();
  return Boolean(u?.isVerified || u?.verified || u?.is_verified || status === "approved");
}

const linkBase =
  "inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-white/90 hover:text-[#01796F] transition text-sm md:text-base";
const linkActiveClass = `${linkBase} underline decoration-4 underline-offset-8`;
const linkActiveStyle = ({ isActive }) =>
  isActive ? { textDecorationColor: PINE } : undefined;
const linkClass = ({ isActive }) => (isActive ? linkActiveClass : linkBase);

export default function Navbar() {
  const auth = useAuth() || {};
  const { isDark, toggleTheme } = useTheme(); // keep your context
  const ctxUser = auth.user;
  const [storedUser, setStoredUser] = useState(() => readStoredUser());
  const sessionUser = useMemo(() => ctxUser || storedUser, [ctxUser, storedUser]);

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Ensure light is default on first load if no preference exists
  useEffect(() => {
    try {
      const hasPreference = !!localStorage.getItem("theme");
      if (!hasPreference) document.documentElement.classList.remove("dark");
    } catch {}
  }, []);

  // Track the ACTUAL dark mode based on <html> class so the icon is always correct
  const [darkNow, setDarkNow] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setDarkNow(root.classList.contains("dark"));
    update();
    const mo = new MutationObserver(update);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("storage", update);
    return () => {
      mo.disconnect();
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      if (!sessionUser) {
        if (mounted) setUnread(0);
        return;
      }
      try {
        const { data } = await api.get("/api/notifications/unread-count");
        const n = Number(data?.unread ?? data?.count ?? 0);
        if (mounted) setUnread(isFinite(n) ? n : 0);
      } catch {
        if (mounted) setUnread(0);
      }
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    const onChanged = () => fetchCount();
    window.addEventListener("notifications-changed", onChanged);
    return () => {
      mounted = false;
      clearInterval(id);
      window.removeEventListener("notifications-changed", onChanged);
    };
  }, [sessionUser]);

  useEffect(() => {
    const onStorage = () => setStoredUser(readStoredUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    setStoredUser(readStoredUser());
  }, [ctxUser]);

  const authed = !!sessionUser;
  const employer = isEmployer(sessionUser);
  const jobseeker = isJobseeker(sessionUser);
  const admin = isAdmin(sessionUser);

  const handleNavClick = () => setOpen(false);
  const handleLogout = () => {
    try {
      ["user", "authUser", "currentUser", "token", "authToken", "accessToken"].forEach((k) =>
        localStorage.removeItem(k)
      );
      auth.logout?.();
    } finally {
      navigate("/login", { replace: true });
      setOpen(false);
    }
  };

  const displayName = (sessionUser?.name || "Profile").split(" ")[0];

  return (
    <nav style={{ backgroundColor: MIDNIGHT }}>
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="h-20 md:h-20 flex items-center justify-between">
          <NavLink
            to="/"
            onClick={handleNavClick}
            className="font-extrabold tracking-tight text-2xl md:text-3xl"
            style={{ color: "#ffffff" }}
          >
            Adwuma<span style={{ color: BRAND_GOLD }}>Wura</span>
          </NavLink>

          <div className="hidden md:flex items-center gap-3 ml-auto">
            <NavLink to="/" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
              Home
            </NavLink>

            {authed && (
              <NavLink to="/jobs" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
                Jobs
              </NavLink>
            )}

            {jobseeker && (
              <NavLink
                to="/applications"
                className={linkClass}
                style={linkActiveStyle}
                onClick={handleNavClick}
              >
                Applications
              </NavLink>
            )}

            {employer && (
              <>
                {!isEmployerVerified(sessionUser) && (
                  <NavLink
                    to="/employer/verify"
                    className={linkClass}
                    style={linkActiveStyle}
                    onClick={handleNavClick}
                  >
                    Verify
                  </NavLink>
                )}
                <NavLink
                  to="/employer/post-job"
                  className={linkClass}
                  style={linkActiveStyle}
                  onClick={handleNavClick}
                >
                  Post Job
                </NavLink>
                <NavLink
                  to="/employer/jobs"
                  className={linkClass}
                  style={linkActiveStyle}
                  onClick={handleNavClick}
                >
                  My Jobs
                </NavLink>
              </>
            )}

            {admin && (
              <NavLink
                to="/admin/verifications"
                className={linkClass}
                style={linkActiveStyle}
                onClick={handleNavClick}
              >
                Admin
              </NavLink>
            )}

            {authed && (
              <NavLink
                to="/notifications"
                className={`${linkClass({ isActive: false })} relative`}
                style={linkActiveStyle}
                onClick={handleNavClick}
              >
                <BellIcon />
                <span className="hidden lg:inline">Notifications</span>
                {unread > 0 && (
                  <span
                    className="absolute -top-1 -right-1 rounded-full bg-red-600 text-white text-[11px] leading-none px-1.5 py-0.5"
                    aria-label={`${unread} unread notifications`}
                  >
                    {unread}
                  </span>
                )}
              </NavLink>
            )}

            {authed && (
              <NavLink
                to="/profile"
                onClick={handleNavClick}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/20 text-white hover:bg-white/10"
                title="Profile"
              >
                <UserIcon />
                <span className="hidden xl:inline">{displayName}</span>
              </NavLink>
            )}

            {!authed && (
              <>
                <NavLink to="/register" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
                  Register
                </NavLink>
                <NavLink to="/login" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
                  Login
                </NavLink>
              </>
            )}

            {authed && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-md font-medium text-white text-sm md:text-base"
                style={{ backgroundColor: MIDNIGHT_HOVER }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0b4a5d")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = MIDNIGHT_HOVER)}
                title="Logout"
              >
                Logout
              </button>
            )}

            {/* Icon-only theme toggle: moon in light, sun in dark */}
            <button
              type="button"
              onClick={() => {
                toggleTheme();
                // MutationObserver above will update darkNow immediately after the class changes
              }}
              className="p-2 rounded-md border border-white/20 text-white hover:bg-white/10"
              title={darkNow ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={darkNow ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkNow ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-3 rounded-md border border-white/20 text-white hover:bg-white/10"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <div className="relative w-6 h-6">
              <span className={`absolute left-0 right-0 h-0.5 bg-white transition-transform duration-200 ${open ? "top-3 rotate-45" : "top-1.5"}`} />
              <span className={`absolute left-0 right-0 h-0.5 bg-white transition-opacity duration-200 ${open ? "top-3 opacity-0" : "top-3 opacity-100"}`} />
              <span className={`absolute left-0 right-0 h-0.5 bg-white transition-transform duration-200 ${open ? "top-3 -rotate-45" : "top-4.5"}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-3 border-t border-white/10">
            <div className="flex flex-col gap-1 pt-3">
              <NavLink to="/" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
                Home
              </NavLink>

              {authed && (
                <NavLink to="/jobs" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
                  Jobs
                </NavLink>
              )}

              {isJobseeker(sessionUser) && (
                <NavLink to="/applications" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
                  Applications
                </NavLink>
              )}

              {isEmployer(sessionUser) && (
                <>
                  {!isEmployerVerified(sessionUser) && (
                    <NavLink to="/employer/verify" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
                      Verify
                    </NavLink>
                  )}
                  <NavLink to="/employer/post-job" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
                    Post Job
                  </NavLink>
                  <NavLink to="/employer/jobs" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
                    My Jobs
                  </NavLink>
                </>
              )}

              {admin && (
                <NavLink
                  to="/admin/verifications"
                  className={linkClass}
                  style={linkActiveStyle}
                  onClick={handleNavClick}
                >
                  Admin
                </NavLink>
              )}

              {authed && (
                <NavLink to="/notifications" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
                  <BellIcon />
                  <span>Notifications</span>
                  {unread > 0 && (
                    <span className="ml-2 rounded-full bg-red-600 text-white text-[11px] leading-none px-1.5 py-0.5">
                      {unread}
                    </span>
                  )}
                </NavLink>
              )}

              {authed && (
                <NavLink to="/profile" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
                  <UserIcon />
                  <span>Profile</span>
                </NavLink>
              )}

              {!authed && (
                <>
                  <NavLink to="/register" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
                    Register
                  </NavLink>
                  <NavLink to="/login" className={linkClass} style={linkActiveStyle} onClick={handleNavClick}>
                    Login
                  </NavLink>
                </>
              )}

              {authed && (
                <button
                  onClick={handleLogout}
                  className="mt-1 px-3 py-1.5 text-left rounded-md font-medium text-white text-sm"
                  style={{ backgroundColor: MIDNIGHT_HOVER }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0b4a5d")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = MIDNIGHT_HOVER)}
                  title="Logout"
                >
                  Logout
                </button>
              )}

              {/* Icon-only theme toggle in mobile menu (uses actual DOM state too) */}
              <button
                type="button"
                onClick={() => { toggleTheme(); setOpen(false); }}
                className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/20 text-white hover:bg-white/10 w-max"
                title={darkNow ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={darkNow ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkNow ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
