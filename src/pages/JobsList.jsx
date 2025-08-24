import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/axios";

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

// Ghana regions
const REGIONS = [
  "All Regions",
  "Greater Accra",
  "Ashanti",
  "Northern",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Savannah",
  "North East",
  "Western North",
  "Oti",
];

export default function JobsList() {
  const location = useLocation();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All Regions");
  const debouncedSearch = useDebounce(search, 400);

  // NEW: hydrate filters from URL (?search=&location= or ?region=)
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const q = params.get("search") || params.get("keyword") || "";
    const loc = params.get("location") || params.get("region") || "";

    if (q && q !== search) setSearch(q);

    // Match region against our list (case-insensitive); fall back to "All Regions"
    if (loc) {
      const match =
        REGIONS.find((r) => r.toLowerCase() === String(loc).toLowerCase()) ||
        loc;
      if (match !== region) setRegion(match);
    } else if (region !== "All Regions") {
      setRegion("All Regions");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]); // only respond to URL changes

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const params = {};
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (region !== "All Regions") params.region = region;
        // Only show open jobs to seekers
        params.status = "open";

        const { data } = await api.get("/api/jobs", {
          params,
          headers: { "X-Skip-Auth": "true" },
        });

        const listRaw = Array.isArray(data) ? data : data?.jobs || [];
        // Defensive filter if backend misses the param
        const list = listRaw.filter(
          (j) =>
            (j.status || j.state || "open").toString().toLowerCase() !==
            "closed"
        );

        if (alive) setJobs(list);
      } catch (e) {
        if (alive) setErr(e?.response?.data?.message || "Server error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [debouncedSearch, region]);

  if (loading) return <p>Loading jobs…</p>;
  if (err) return <p className="text-red-600">{err}</p>;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Jobs</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, company, or skill"
          className="flex-1 border rounded-md p-2"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full sm:w-56 border rounded-md p-2"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {jobs.length === 0 ? (
        <p>No jobs found.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => {
            const id = job._id || job.id;
            const title = job.title || job.jobTitle || "Untitled";
            const company =
              job.company ||
              job.companyName ||
              job?.postedBy?.name ||
              job?.postedBy?.companyName ||
              "Company";
            const location = job.location || job.region || job.city || "Location";

            return (
              <li key={id}>
                {/* Bigger, tappable card */}
                <Link
                  to={`/jobs/${id}`}
                  className="group block border rounded-xl p-7 md:p-6 min-h-[112px] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#247e6d]/60 transition"
                  aria-label={`${title} at ${company} in ${location}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Spacebar")
                      e.preventDefault();
                  }}
                  onKeyUp={(e) => {
                    if (e.key === " " || e.key === "Spacebar") {
                      e.preventDefault();
                      e.currentTarget.click();
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-accent2 group-hover:underline decoration-[--tw-ring-color] decoration-2 underline-offset-4 truncate">
                        {title}
                      </h2>
                      <p className="text-sm text-gray-700 mt-1 truncate">
                        {company} • {location}
                        <VerifiedBadge
                          verified={job?.postedBy?.isVerified}
                          status={job?.postedBy?.verificationStatus}
                        />
                      </p>
                    </div>

                    {/* hint */}
                    <span
                      className="shrink-0 inline-flex items-center px-3 py-1 rounded-md text-white text-xs font-medium"
                      style={{ backgroundColor: "#247e6d" }}
                    >
                      View / Apply
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function useDebounce(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
