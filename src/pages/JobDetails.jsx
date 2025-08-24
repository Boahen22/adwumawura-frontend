import { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";
import { applyToJob } from "../api/applications";

// Small inline "Verified" badge (shows only when employer is verified)
function VerifiedBadge({ verified, status }) {
  const isVerified =
    Boolean(verified) ||
    String(status || "").toLowerCase() === "passed verification";

  if (!isVerified) return null;

  return (
    <span
      style={{
        marginLeft: 8,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 600,
        background: "#E6F5F1",
        color: "#0B6B53",
        border: "1px solid #bfe7db",
        whiteSpace: "nowrap",
      }}
      aria-label="Verified employer"
      title="Verified employer"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
          stroke="#0B6B53"
          strokeWidth="1.5"
        />
        <path
          d="m8.5 12.5 2.5 2.5 4.5-5"
          stroke="#0B6B53"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Verified
    </span>
  );
}

const MIDNIGHT = "#031c26";
const PINE = "#247e6d";
const PINE_HOVER = "#2b8f7b";

export default function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Apply UI state
  const [showForm, setShowForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");
  const [applyErr, setApplyErr] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get(`/api/jobs/${id}`, {
          headers: { "X-Skip-Auth": "true" },
        });
        if (!active) return;
        setJob(data?.job || data);
      } catch (e) {
        if (!active) return;
        setErr(e?.response?.data?.message || "Failed to load job.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const handleApplyClick = () => {
    if (user && user?.role !== "jobseeker") {
      setApplyErr("Only jobseekers can apply for jobs.");
      return;
    }
    setApplyErr("");
    setApplyMsg("");
    setShowForm(true);
  };

  const submitApplication = async (e) => {
    e.preventDefault();

    // Require login as jobseeker to submit
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }
    if (user?.role !== "jobseeker") {
      setApplyErr("Only jobseekers can apply for jobs.");
      return;
    }

    if (cvFile && cvFile.size > 8 * 1024 * 1024) {
      setApplyErr("CV is too large (max 8MB).");
      return;
    }

    setSubmitting(true);
    setApplyErr("");
    setApplyMsg("");

    try {
      // Single canonical call to the correct route
      await applyToJob(id, { coverLetter: coverLetter.trim(), file: cvFile || null });

      setApplyMsg("Application submitted successfully.");
      setShowForm(false);
      setCoverLetter("");
      setCvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e2) {
      setApplyErr(e2?.response?.data?.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading job…</p>;
  if (err) return <p className="text-red-600">{err}</p>;
  if (!job) return <p>Job not found.</p>;

  const title = job.title || job.jobTitle || "Untitled";
  const company =
    job.company ||
    job.companyName ||
    job?.postedBy?.name ||
    job?.postedBy?.companyName ||
    "Company";
  const locationTxt = job.location || job.region || job.city || "Location";
  const salary =
    job.salary ||
    job.salaryRange ||
    (job.minSalary && job.maxSalary ? `${job.minSalary} – ${job.maxSalary}` : null);
  const skills = job.skills || job.requiredSkills || [];
  const desc = job.description || job.summary || "No description provided.";
  const created = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-accent2">{title}</h1>

        <Link
          to="/jobs"
          className="inline-flex items-center gap-1 text-sm rounded-md px-3 py-1.5 border"
          style={{ color: MIDNIGHT, borderColor: MIDNIGHT }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = MIDNIGHT;
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = MIDNIGHT;
          }}
          title="Back to jobs"
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
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to jobs
        </Link>
      </div>

      <p className="text-gray-700">
        {company} • {locationTxt}
        <VerifiedBadge
          verified={job?.postedBy?.isVerified}
          status={job?.postedBy?.verificationStatus}
        />
      </p>
      {created && <p className="text-sm text-gray-500">Posted on {created}</p>}

      {salary && (
        <p className="mt-2 inline-block rounded-md bg-gray-100 px-3 py-1 text-sm">
          Salary: {salary}
        </p>
      )}

      <div>
        <h2 className="text-lg font-semibold mt-4">Job Description</h2>
        <p className="whitespace-pre-line text-gray-800">{desc}</p>
      </div>

      {Array.isArray(skills) && skills.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mt-4">Required Skills</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={i} className="px-2 py-1 rounded-full bg-gray-100 text-sm">
                {typeof s === "string" ? s : s?.name || "Skill"}
              </span>
            ))}
          </div>
        </div>
      )}

      {applyMsg && (
        <div className="border border-green-300 bg-green-50 text-green-700 rounded p-2 text-sm">
          {applyMsg}
        </div>
      )}
      {applyErr && (
        <div className="border border-red-300 bg-red-50 text-red-700 rounded p-2 text-sm">
          {applyErr}
        </div>
      )}

      {!showForm ? (
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-md text-white"
            style={{ backgroundColor: PINE }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PINE_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PINE)}
            onClick={handleApplyClick}
          >
            Apply Now
          </button>

          {!user && (
            <button
              className="px-4 py-2 rounded-md border hover:bg-gray-50"
              onClick={() => navigate("/login", { state: { from: location } })}
            >
              Login to apply
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={submitApplication} className="space-y-4 max-w-xl">
          <div>
            <p className="text-sm text-gray-600 font-medium mb-1">
              Upload CV (optional) — PDF, DOC, DOCX, JPG/PNG — max 8MB
            </p>

            <div className="rounded-md border p-3">
              <div className="rounded-md border border-dashed p-6 text-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8 mx-auto mb-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>

                <p className="text-sm text-gray-600 mb-2">
                  Drag &amp; drop your document here, or
                </p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-3 py-1.5 rounded-md border hover:bg-gray-50 text-sm"
                >
                  Choose file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  className="hidden"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                />

                {cvFile && (
                  <p className="mt-2 text-sm text-gray-700">
                    Selected: <span className="font-medium">{cvFile.name}</span>{" "}
                    <span className="text-gray-500">
                      ({Math.round(cvFile.size / 1024)} KB)
                    </span>
                  </p>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCvFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <label className="block text-sm font-medium">
            Cover Letter (optional)
            <textarea
              className="mt-1 w-full border rounded-md p-2 min-h-[120px]"
              placeholder="Write a short cover letter…"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md text-white disabled:opacity-50"
              style={{ backgroundColor: PINE }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PINE_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PINE)}
            >
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setApplyErr("");
              }}
              className="px-4 py-2 rounded-md border hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
