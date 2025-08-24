import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";

const STATUS_COLORS = {
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
};

const MIDNIGHT = "#031c26";
const MIDNIGHT_HOVER = "#083847";

/** Build an absolute public URL for CVs if the value is a relative/server path. */
function toAbsoluteUrl(maybePath) {
  if (!maybePath) return null;
  const v = String(maybePath).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(v)) return v;

  // Try to cut from "uploads/..."
  let rel = v;
  const i = v.toLowerCase().lastIndexOf("/uploads/");
  if (i !== -1) rel = v.slice(i + 1); // "uploads/…"
  if (!rel.startsWith("uploads/")) rel = `uploads/cv/${rel}`; // last resort

  const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
  return `${base}/${rel}`;
}

export default function ManageApplicants() {
  const { id: jobId } = useParams();
  const [job, setJob] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      try {
        const j = await api.get(`/api/jobs/${jobId}`, { headers: { "X-Skip-Auth": "true" } });
        setJob(j.data?.job || j.data || null);
      } catch {
        setJob(null);
      }

      // Prefer our canonical endpoint; fallbacks kept for compatibility
      const candidates = [
        `/api/applications/job/${jobId}`,
        `/api/jobs/${jobId}/applications`,
        `/api/applications?jobId=${jobId}`,
      ];
      let data = null;
      for (const url of candidates) {
        try {
          const res = await api.get(url);
          data = res.data;
          break;
        } catch {}
      }

      const list = Array.isArray(data) ? data : data?.applications || [];
      const normalized = list.map((a) => {
        const user = a.applicant || a.user || a.userId || {};
        const cvRaw = a.cvUrl || a.cv_url || a.resumeUrl || a.resume_url || a.cv || null;

        return {
          id: a._id || a.id,
          status: (a.status || "pending").toLowerCase(),
          coverLetter: a.coverLetter || a.message || "",
          createdAt: a.createdAt || a.timestamp || null,
          user,
          job: a.job || a.jobId || {},
          cvUrl: toAbsoluteUrl(cvRaw),
        };
      });

      setApps(normalized);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load applicants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [jobId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter((a) => {
      const statusOk = filter === "all" ? true : a.status === filter;
      const name = (a.user?.name || a.user?.fullName || a.user?.username || "").toLowerCase();
      const email = (a.user?.email || "").toLowerCase();
      const phone = (a.user?.phone || "").toLowerCase();
      const hit = !q || name.includes(q) || email.includes(q) || phone.includes(q);
      return statusOk && hit;
    });
  }, [apps, query, filter]);

  const updateStatus = async (appId, status) => {
    const normalizedStatus = String(status).toLowerCase();
    setBusy(appId);
    try {
      const attempts = [
        { method: "put", url: `/api/applications/${appId}/status`, body: { status: normalizedStatus } },
        { method: "patch", url: `/api/applications/${appId}`, body: { status: normalizedStatus } },
        { method: "patch", url: `/api/jobs/${jobId}/applications/${appId}`, body: { status: normalizedStatus } },
      ];
      let ok = false;
      for (const a of attempts) {
        try {
          await api[a.method](a.url, a.body);
          ok = true;
          break;
        } catch {}
      }
      if (!ok) throw new Error("Could not update status.");
      setApps((arr) => arr.map((x) => (x.id === appId ? { ...x, status: normalizedStatus } : x)));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update status.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <p>Loading applicants…</p>;
  if (err) return <p className="text-red-600">{err}</p>;

  const jobTitle = job?.title || job?.jobTitle || "Job";
  const company =
    job?.company || job?.companyName || job?.postedBy?.companyName || job?.postedBy?.name || "";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Applicants</h1>
          <p className="text-sm text-gray-600">
            {jobTitle} {company ? `• ${company}` : ""}
          </p>
        </div>

        <Link
          to="/employer/jobs"
          className="inline-flex items-center gap-1 text-sm rounded-md px-3 py-1.5"
          style={{ color: "#fff", backgroundColor: MIDNIGHT }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = MIDNIGHT_HOVER)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = MIDNIGHT)}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ color: "#fff" }}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to My Jobs
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or phone"
          className="flex-1 border rounded-md p-2"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-56 border rounded-md p-2"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p>No applications match your filters.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => {
            const name = a.user?.name || a.user?.fullName || a.user?.username || "Unnamed";
            const email = a.user?.email || "";
            const phone = a.user?.phone || "";
            const skills = Array.isArray(a.user?.skills) ? a.user.skills : [];
            const when = a.createdAt ? new Date(a.createdAt).toLocaleString() : "";
            const badge = STATUS_COLORS[a.status] || STATUS_COLORS.pending;

            return (
              <li key={a.id} className="border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-accent2 truncate">{name}</h2>
                    {email && <p className="text-sm text-gray-700">{email}</p>}
                    {phone && <p className="text-sm text-gray-700">📞 {phone}</p>}
                    {when && <p className="text-xs text-gray-500 mt-1">Applied {when}</p>}

                    {/* Details + skills */}
                    {(skills.length > 0 || a.coverLetter) && (
                      <details className="mt-2">
                        <summary className="text-sm underline cursor-pointer">Details</summary>
                        {skills.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {skills.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800 ring-1 ring-gray-200"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {a.coverLetter && (
                          <p className="text-sm text-gray-800 mt-3 whitespace-pre-line">{a.coverLetter}</p>
                        )}
                      </details>
                    )}

                    {a.cvUrl && (
                      <a
                        href={a.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2 text-sm underline hover:text-primary"
                      >
                        View CV / Resume
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs ${badge}`}>{a.status}</span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(a.id, "accepted")}
                        disabled={busy === a.id || a.status === "accepted"}
                        className="px-3 py-2 rounded-md bg-green-600 text-white text-sm hover:opacity-90 disabled:opacity-50"
                      >
                        {busy === a.id && a.status !== "accepted" ? "Updating…" : "Accept"}
                      </button>
                      <button
                        onClick={() => updateStatus(a.id, "rejected")}
                        disabled={busy === a.id || a.status === "rejected"}
                        className="px-3 py-2 rounded-md bg-red-600 text-white text-sm hover:opacity-90 disabled:opacity-50"
                      >
                        {busy === a.id && a.status !== "rejected" ? "Updating…" : "Reject"}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
