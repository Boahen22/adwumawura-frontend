import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyApplications } from "../api/applications";

// Small status pill to match existing style tokens
function StatusPill({ value }) {
  const v = String(value || "pending").toLowerCase();
  const cls =
    v === "accepted"
      ? "bg-green-100 text-green-800 ring-green-200"
      : v === "rejected"
      ? "bg-red-100 text-red-800 ring-red-200"
      : v === "reviewed"
      ? "bg-blue-100 text-blue-800 ring-blue-200"
      : "bg-yellow-100 text-yellow-800 ring-yellow-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${cls}`}>
      {v}
    </span>
  );
}

export default function Applications() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const list = await getMyApplications();
        if (!alive) return;
        setRows(list);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load your applications.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const hasAny = rows && rows.length > 0;

  const rowsSorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    });
  }, [rows]);

  return (
    <section className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">My Applications</h1>

      {err && (
        <div className="border border-red-300 bg-red-50 text-red-700 rounded p-2 text-sm">
          {err}
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : !hasAny ? (
        <p className="text-gray-700">You haven’t applied to any jobs yet.</p>
      ) : (
        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3 font-semibold">Job</th>
                <th className="text-left p-3 font-semibold">Location</th>
                <th className="text-left p-3 font-semibold">Applied</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rowsSorted.map((a) => {
                const job = a.job || {};
                const jobId = job._id || job.id;
                const title = job.title || "Untitled";
                const loc = job.location || "—";
                const when = a.createdAt ? new Date(a.createdAt).toLocaleString() : "—";
                return (
                  <tr key={a._id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{title}</div>
                    </td>
                    <td className="p-3">{loc}</td>
                    <td className="p-3">{when}</td>
                    <td className="p-3">
                      <StatusPill value={a.status} />
                    </td>
                    <td className="p-3">
                      {jobId ? (
                        <Link
                          to={`/jobs/${jobId}`}
                          className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
                          title="View job"
                        >
                          View job
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
