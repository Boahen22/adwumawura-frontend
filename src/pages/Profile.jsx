import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";

const PINE = "#01796F";
const PINE_HOVER = "#2b8f7b";
const TAB_BASE =
  "px-4 py-2 rounded-md border text-sm font-medium transition-colors";
const TAB_INACTIVE =
  "bg-white text-gray-800 hover:bg-gray-50 border-gray-300";
const TAB_ACTIVE =
  "text-white border-transparent shadow";

// Ghana regions
const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
];

function InfoRow({ label, value }) {
  return (
    <div className="text-sm">
      <span className="font-semibold">{label}:</span>{" "}
      {/* Make value readable in dark mode */}
      <span className="text-gray-800 dark:text-white">{value ?? "—"}</span>
    </div>
  );
}

/* Small inline icon used for the password eye toggle */
function EyeIcon({ open }) {
  return open ? (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a20.78 20.78 0 0 1 5.15-5.66" />
      <path d="M9.9 4.24A10.87 10.87 0 0 1 12 4c6.5 0 10 7 10 7a20.82 20.82 0 0 1-3.22 3.88" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function Profile() {
  const { user: authUser, login } = useAuth();

  // Tabs
  const [tab, setTab] = useState("overview");

  // Load
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  // Editable fields (persisted)
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");

  // Additional fields (now persisted)
  const [headline, setHeadline] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  // Save feedback
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");

  // Eye toggle state
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Overview data
  const summary = useMemo(() => {
    const u = authUser || {};
    return {
      name: name || u.name || "—",
      email: u.email || "—",
      role:
        (typeof u.role === "string" && u.role) ||
        (Array.isArray(u.roles) && u.roles[0]) ||
        "—",
      verification:
        u.isVerified || u.verified
          ? "Verified"
          : u.verificationStatus || "—",
      skills:
        Array.isArray(u.skills) && u.skills.length
          ? u.skills.join(", ")
          : skills || "—",
    };
  }, [authUser, name, skills]);

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setLoadErr("");
      try {
        const { data } = await api.get("/api/users/profile");
        const u = data?.user || data;

        if (!mounted) return;

        setName(u?.name || authUser?.name || "");
        setSkills(
          Array.isArray(u?.skills)
            ? u.skills.join(", ")
            : Array.isArray(authUser?.skills)
            ? authUser.skills.join(", ")
            : ""
        );

        // Hydrate optional fields
        if (u?.headline) setHeadline(u.headline);
        if (u?.phone) setPhone(u.phone);
        if (u?.region) setRegion(u.region);
        else if (u?.location) setRegion(u.location);
        if (u?.city) setCity(u.city);
        if (u?.bio) setBio(u.bio);
      } catch (e) {
        if (!mounted) return;
        const msg =
          e?.response?.data?.message || e?.message || "Route not found";
        setLoadErr(msg);

        // Fallback from auth
        setName(authUser?.name || "");
        setSkills(
          Array.isArray(authUser?.skills) ? authUser.skills.join(", ") : ""
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authUser]);

  // Save profile — persists ALL edit fields
  async function onSaveProfile(e) {
    e.preventDefault();
    setSaveBusy(true);
    setSaveMsg("");
    setSaveErr("");

    const skillsArray = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      skills: skillsArray,
      headline: headline?.trim() || "",
      phone: phone?.trim() || "",
      region: region || "",
      location: region || "", // alias for backwards compatibility
      city: city?.trim() || "",
      bio: bio?.trim() || "",
    };

    try {
      const { data } = await api.put("/api/users/profile", payload);

      // Prefer server user if returned; otherwise merge payload locally
      const updatedUser = data?.user || { ...(authUser || {}), ...payload };

      // Keep existing token when refreshing auth context
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("accessToken") ||
        "";
      login(updatedUser, token);

      setSaveMsg(data?.message || "Profile updated.");
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Route not found";
      setSaveErr(msg);
    } finally {
      setSaveBusy(false);
    }
  }

  // Change password
  async function onChangePassword(e) {
    e.preventDefault();
    setPwdBusy(true);
    setPwdMsg("");
    setPwdErr("");

    if (!newPassword || newPassword !== confirmPassword) {
      setPwdErr("New passwords do not match.");
      setPwdBusy(false);
      return;
    }

    try {
      const { data } = await api.put("/api/users/password", {
        currentPassword,
        newPassword,
      });
      setPwdMsg(data?.message || "Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Route not found";
      setPwdErr(msg);
    } finally {
      setPwdBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Your Profile</h1>
        {loading ? (
          <p className="text-sm text-gray-600 mt-1">Loading…</p>
        ) : loadErr ? (
          <p className="text-sm text-red-600 mt-1">{loadErr}</p>
        ) : null}
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("overview")}
          className={`${TAB_BASE} ${
            tab === "overview" ? TAB_ACTIVE : TAB_INACTIVE
          }`}
          style={tab === "overview" ? { backgroundColor: PINE } : {}}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setTab("edit")}
          className={`${TAB_BASE} ${
            tab === "edit" ? TAB_ACTIVE : TAB_INACTIVE
          }`}
          style={tab === "edit" ? { backgroundColor: PINE } : {}}
        >
          Edit Profile
        </button>
        <button
          type="button"
          onClick={() => setTab("password")}
          className={`${TAB_BASE} ${
            tab === "password" ? TAB_ACTIVE : TAB_INACTIVE
          }`}
          style={tab === "password" ? { backgroundColor: PINE } : {}}
        >
          Password
        </button>
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Make card text white only in dark mode */}
          <div className="rounded-lg border p-4 dark:text-white">
            <h2 className="font-semibold mb-2">Account</h2>
            <div className="space-y-1">
              <InfoRow label="Name" value={summary.name} />
              <InfoRow label="Email" value={summary.email} />
              <InfoRow label="Role" value={summary.role} />
              <InfoRow label="Verification" value={summary.verification} />
            </div>
          </div>

          {/* Make card text white only in dark mode */}
          <div className="rounded-lg border p-4 dark:text-white">
            <h2 className="font-semibold mb-2">Profile</h2>
            <div className="space-y-1">
              <InfoRow label="Headline" value={headline || "—"} />
              <InfoRow label="Phone" value={phone || "—"} />
              <InfoRow
                label="Location"
                value={region ? `${region}${city ? ` • ${city}` : ""}` : "—"}
              />
              <InfoRow label="Bio" value={bio || "—"} />
              <InfoRow label="Skills" value={summary.skills} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile */}
      {tab === "edit" && (
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Edit profile</h2>

          {saveMsg && (
            <div className="mb-3 rounded border border-green-300 bg-green-50 text-green-800 px-3 py-2 text-sm">
              {saveMsg}
            </div>
          )}
          {saveErr && (
            <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {saveErr}
            </div>
          )}

          <form onSubmit={onSaveProfile} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Basic */}
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Basic</h3>

                <label className="block mb-3">
                  <span className="text-sm font-medium">Name</span>
                  <input
                    className="mt-1 w-full border rounded-md p-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </label>

                <label className="block mb-1">
                  <span className="text-sm font-medium">Headline</span>
                  <input
                    className="mt-1 w-full border rounded-md p-2"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Short title such as 'Mason', 'Driver', 'Electrician'."
                  />
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Short title such as 'Mason', 'Driver', 'Electrician'.
                </p>

                <label className="block">
                  <span className="text-sm font-medium">Phone</span>
                  <input
                    className="mt-1 w-full border rounded-md p-2"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., 024 xxxx xxx"
                  />
                </label>
              </div>

              {/* Right: Location & About */}
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Location &amp; About</h3>

                <label className="block mb-3">
                  <span className="text-sm font-medium">Region</span>
                  <select
                    className="mt-1 w-full border rounded-md p-2"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    <option value="">Select region</option>
                    {GHANA_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block mb-3">
                  <span className="text-sm font-medium">City/Town</span>
                  <input
                    className="mt-1 w-full border rounded-md p-2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Kumasi"
                  />
                </label>

                <label className="block mb-3">
                  <span className="text-sm font-medium">Bio</span>
                  <textarea
                    className="mt-1 w-full border rounded-md p-2 min-h-[110px]"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell employers about your experience and availability."
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">
                    Skills (comma-separated)
                  </span>
                  <input
                    className="mt-1 w-full border rounded-md p-2"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Comma separated, e.g., mason, tiler, painter"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saveBusy}
              className="px-4 py-2 rounded-md text-white disabled:opacity-50"
              style={{ backgroundColor: PINE }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = PINE_HOVER)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = PINE)
              }
            >
              {saveBusy ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      )}

      {/* Password */}
      {tab === "password" && (
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Change password</h2>

          {pwdMsg && (
            <div className="mb-3 rounded border border-green-300 bg-green-50 text-green-800 px-3 py-2 text-sm">
              {pwdMsg}
            </div>
          )}
          {pwdErr && (
            <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {pwdErr}
            </div>
          )}

          <form onSubmit={onChangePassword} className="space-y-4">
            {/* Current password with eye toggle */}
            <label className="block">
              <span className="text-sm font-medium">Current password</span>
              <div className="relative mt-1">
                <input
                  type={showCurrent ? "text" : "password"}
                  className="w-full border rounded-md p-2 pr-10"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-900"
                >
                  <EyeIcon open={showCurrent} />
                </button>
              </div>
            </label>

            <div className="grid md:grid-cols-2 gap-3">
              {/* New password with eye toggle */}
              <label className="block">
                <span className="text-sm font-medium">New password</span>
                <div className="relative mt-1">
                  <input
                    type={showNew ? "text" : "password"}
                    className="w-full border rounded-md p-2 pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showNew ? "Hide password" : "Show password"}
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-900"
                  >
                    <EyeIcon open={showNew} />
                  </button>
                </div>
              </label>

              {/* Confirm new password with eye toggle */}
              <label className="block">
                <span className="text-sm font-medium">Confirm new password</span>
                <div className="relative mt-1">
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="w-full border rounded-md p-2 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-900"
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={pwdBusy}
              className="px-4 py-2 rounded-md text-white disabled:opacity-50"
              style={{ backgroundColor: PINE }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = PINE_HOVER)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = PINE)
              }
            >
              {pwdBusy ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
