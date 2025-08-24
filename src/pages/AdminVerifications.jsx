import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const STATUSES = ["pending", "approved", "rejected"];

// Brand colors
const PINE_GREEN = "#247e6d";
const MIDNIGHT_GREEN = "#0b2a2f";

function useDebounce(v, ms = 350) {
  const [x, setX] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setX(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return x;
}

function StatusPill({ value }) {
  const tone =
    value === "approved"
      ? "bg-green-100 text-green-800 ring-green-200"
      : value === "rejected"
      ? "bg-red-100 text-red-800 ring-red-200"
      : "bg-yellow-100 text-yellow-800 ring-yellow-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${tone}`}>
      {value}
    </span>
  );
}

export default function AdminVerifications() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [detail, setDetail] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState("pending");
  const [submitting, setSubmitting] = useState(false);

  const pages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize) || 1),
    [total, pageSize]
  );

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/api/admin/verification/list", {
        params: {
          status: status || undefined,
          search: debouncedSearch || undefined,
          page,
          pageSize,
        },
      });
      setRows(Array.isArray(data?.data) ? data.data : []);
      setTotal(Number(data?.total || 0));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load verifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, debouncedSearch, page]);

  async function openReview(v) {
    try {
      const { data } = await api.get(`/api/admin/verification/${v.id}`);
      const full = {
        id: data.id,
        status: data.status,
        note: data.note || "",
        submittedAt: data.submittedAt,
        updatedAt: data.updatedAt,
        employer: data.employer,
        file: data.file,
      };
      setDetail(full);
      setNewStatus(full.status);
      setNote(full.note || "");
      setReviewOpen(true);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to load record.");
    }
  }

  async function applyStatus(v) {
    if (!detail?.id) return;
    setSubmitting(true);
    try {
      await api.patch(`/api/admin/verification/${detail.id}/status`, {
        status: v,
        note: note || "",
      });
      setReviewOpen(false);
      setRows((arr) =>
        arr.map((r) => (r.id === detail.id ? { ...r, status: v, note } : r))
      );
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update status.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- NEW: secure file open with Authorization header ----------
  async function viewFileSecure(verificationId, filename = "document") {
    // open a blank tab synchronously to avoid popup blockers
    const popup = window.open("", "_blank");

    try {
      const res = await api.get(
        `/api/admin/verification/${verificationId}/file`,
        { responseType: "blob" }
      );

      const type = res.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([res.data], { type });
      const url = URL.createObjectURL(blob);

      if (popup) {
        popup.location = url;
      } else {
        // fallback if popup blocked
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      // free memory a bit later
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      if (popup) popup.close();
      alert(e?.response?.data?.message || "Failed to open file.");
    }
  }
  // --------------------------------------------------------------------

  const fileUrl = (id) =>
    `${api.defaults.baseURL ? api.defaults.baseURL.replace(/\/+$/, "") : ""}/api/admin/verification/${id}/file`;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employer Verifications</h1>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-3 py-2 rounded-md border hover:bg-gray-50 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-48 border rounded-md p-2"
          aria-label="Filter by status"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="">all</option>
        </select>

        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search employer by name or email"
          className="flex-1 border rounded-md p-2"
        />
      </div>

      {/* Results */}
      {loading ? (
        <p>Loading…</p>
      ) : err ? (
        <p className="text-red-600">{err}</p>
      ) : rows.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3 font-semibold">Employer</th>
                <th className="text-left p-3 font-semibold">Submitted</th>
                <th className="text-left p-3 font-semibold">File</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{r.employer?.name || "—"}</div>
                    <div className="text-gray-500">{r.employer?.email || ""}</div>
                  </td>
                  <td className="p-3">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-3">
                    {r.file?.name ? (
                      // keep the link look; intercept click to add Authorization
                      <a
                        href={fileUrl(r.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          viewFileSecure(r.id, r.file.name);
                        }}
                      >
                        {r.file.name}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">
                    <StatusPill value={r.status} />
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => openReview(r)}
                      className="px-3 py-1.5 rounded-md text-white"
                      style={{ backgroundColor: PINE_GREEN }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span>
          Page {page} of {pages} • {total} total
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-md border hover:bg-gray-50 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="px-3 py-1.5 rounded-md border hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Review modal */}
      {reviewOpen && detail && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Review Submission</h2>
              <button
                onClick={() => setReviewOpen(false)}
                className="px-3 py-1.5 rounded-md text-white"
                style={{ backgroundColor: MIDNIGHT_GREEN }}
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Employer</div>
                <div className="font-medium">
                  {detail.employer?.name} <span className="text-gray-500">• {detail.employer?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">Current status:</div>
                <StatusPill value={detail.status} />
              </div>

              <div>
                <div className="text-sm text-gray-500">Document</div>
                {detail.file?.name ? (
                  // same link look; secure open on click
                  <a
                    className="text-blue-700 hover:underline"
                    href={fileUrl(detail.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      viewFileSecure(detail.id, detail.file.name);
                    }}
                  >
                    View “{detail.file.name}”
                  </a>
                ) : (
                  <div className="text-gray-600">—</div>
                )}
              </div>

              <label className="block">
                <span className="text-sm text-gray-600">Set status</span>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="mt-1 w-full border rounded-md p-2"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Note (optional)</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full border rounded-md p-2 min-h-[100px]"
                  placeholder="Explain approval or reasons for rejection…"
                />
              </label>

              <div className="flex items-center gap-2 pt-1">
                <button
                  disabled={submitting}
                  onClick={() => applyStatus("approved")}
                  className="px-4 py-2 rounded-md text-white disabled:opacity-50"
                  style={{ backgroundColor: PINE_GREEN }}
                >
                  {submitting ? "Updating…" : "Approve"}
                </button>

                <button
                  disabled={submitting}
                  onClick={() => applyStatus("rejected")}
                  className="px-4 py-2 rounded-md text-white disabled:opacity-50"
                  style={{ backgroundColor: "#dc2626" }}
                >
                  Reject
                </button>

                <button
                  disabled={submitting}
                  onClick={() => applyStatus("pending")}
                  className="px-4 py-2 rounded-md disabled:opacity-50 bg-yellow-100 text-yellow-800"
                >
                  Mark pending
                </button>

                <div className="ml-auto">
                  <button
                    disabled={submitting}
                    onClick={() => applyStatus(newStatus)}
                    className="px-4 py-2 rounded-md border disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
