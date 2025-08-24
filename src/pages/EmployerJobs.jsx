import { useEffect, useState, useRef, useEffect as ReactUseEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

/* ---- Brand colors ---- */
const PINE = "#247e6d";
const PINE_HOVER = "#2b8f7b";

/* ---- Ghana regions ---- */
const REGIONS = [
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

function getStatus(job) {
  const s = (job.status || job.state || "").toString().toLowerCase();
  if (s === "open" || s === "closed") return s;
  if (job.isOpen === true || job.active === true || job.open === true) return "open";
  if (job.isOpen === false || job.active === false || job.closed === true) return "closed";
  return "open";
}

const BADGE = {
  open: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

const toCsv = (arr) =>
  Array.isArray(arr)
    ? arr.map((s) => (typeof s === "string" ? s : s?.name || "")).filter(Boolean).join(", ")
    : "";

/** Build inline-edit form state from a job (normalized) */
function jobToForm(job) {
  return {
    title: job.title || job.jobTitle || "",
    region: job.region || job.location || job.city || "",
    minSalary: job.minSalary ?? "",
    maxSalary: job.maxSalary ?? "",
    description: job.description || job.summary || "",
    skillsCsv: toCsv(job.skills || job.requiredSkills || job.skillsRequired || job.tags || []),
  };
}

/** Small, accessible confirm dialog */
function ConfirmDialog({ open, title = "Are you sure?", body, confirmText = "Delete", cancelText = "Cancel", onConfirm, onCancel }) {
  const confirmBtnRef = useRef(null);

  ReactUseEffect(() => {
    if (!open) return;
    const t = setTimeout(() => confirmBtnRef.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter") onConfirm?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-xl bg-white shadow-lg border">
          <div className="p-4">
            <h3 className="text-base font-semibold text-accent2">{title}</h3>
            {body && <p className="mt-2 text-sm text-gray-700">{body}</p>}
          </div>
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
            <button onClick={onCancel} className="px-3 py-2 rounded-md border hover:bg-gray-50 text-sm">
              {cancelText}
            </button>
            <button
              ref={confirmBtnRef}
              onClick={onConfirm}
              className="px-3 py-2 rounded-md bg-red-600 text-white hover:opacity-90 text-sm"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmployerJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Per-item UI state
  const [busy, setBusy] = useState({});         // { [id]: 'delete' | 'toggle' | 'save' }
  const [editing, setEditing] = useState({});   // { [id]: true }
  const [forms, setForms] = useState({});       // { [id]: {title,...} }
  const [baseForms, setBaseForms] = useState({}); // snapshot used to detect "dirty"
  const [formErr, setFormErr] = useState({});   // { [id]: 'error text' }
  const [formMsg, setFormMsg] = useState({});   // { [id]: 'ok text' }

  // App-level confirm state
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, title }

  const setBusyFor = (id, key) => setBusy((b) => ({ ...b, [id]: key }));
  const clearBusyFor = (id) =>
    setBusy((b) => {
      const c = { ...b };
      delete c[id];
      return c;
    });

  const setFormFor = (id, data) =>
    setForms((f) => ({ ...f, [id]: { ...(f[id] || {}), ...data } }));

  const isDirty = (id) => {
    const a = forms[id];
    const b = baseForms[id];
    if (!a || !b) return false;
    // shallow compare for fields we care about
    return (
      a.title !== b.title ||
      a.region !== b.region ||
      String(a.minSalary ?? "") !== String(b.minSalary ?? "") ||
      String(a.maxSalary ?? "") !== String(b.maxSalary ?? "") ||
      a.description !== b.description ||
      a.skillsCsv !== b.skillsCsv
    );
  };

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const candidates = [
        "/api/jobs/mine",
        "/api/employer/jobs",
        "/api/jobs?mine=true",
        "/api/jobs?postedBy=me",
      ];
      let data = null;
      for (const url of candidates) {
        try {
          const res = await api.get(url);
          data = res.data;
          break;
        } catch {}
      }
      const list = Array.isArray(data) ? data : data?.jobs || [];
      setJobs(list);

      const nextForms = {};
      const nextBase = {};
      list.forEach((j) => {
        const id = j._id || j.id;
        const f = jobToForm(j);
        nextForms[id] = f;
        nextBase[id] = { ...f };
      });
      setForms(nextForms);
      setBaseForms(nextBase);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load your jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // delete without browser confirm; this is called after our in-app confirm
  const removeJobDirect = async (id) => {
    setBusyFor(id, "delete");
    try {
      const tries = [`/api/jobs/${id}`, `/api/employer/jobs/${id}`];
      let ok = false;
      for (const url of tries) {
        try {
          await api.delete(url);
          ok = true;
          break;
        } catch {}
      }
      if (!ok) throw new Error("Could not delete job");
      setJobs((arr) => arr.filter((j) => (j._id || j.id) !== id));
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed.");
    } finally {
      clearBusyFor(id);
    }
  };

  const toggleOpen = async (job) => {
    const id = job._id || job.id;
    const current = getStatus(job);
    const target = current === "open" ? "closed" : "open";

    setBusyFor(id, "toggle");
    const prev = job;

    // Optimistic UI
    setJobs((arr) =>
      arr.map((j) => ((j._id || j.id) === id ? { ...j, status: target } : j))
    );

    try {
      const body = { status: target };
      const attempts = [
        () => api.put(`/api/jobs/${id}`, body),
        () => api.patch(`/api/jobs/${id}`, body),
        () => api.patch(`/api/employer/jobs/${id}`, body),
      ];

      let res = null;
      let ok = false;
      for (const call of attempts) {
        try {
          res = await call();
          ok = true;
          break;
        } catch {}
      }
      if (!ok) throw new Error("Could not update status.");

      const updated = res?.data?.job || res?.data;
      if (updated && typeof updated === "object") {
        setJobs((arr) =>
          arr.map((j) => ((j._id || j.id) === id ? { ...j, ...updated } : j))
        );
      }
    } catch (e) {
      setJobs((arr) =>
        arr.map((j) => ((j._id || j.id) === (prev._id || prev.id) ? prev : j))
      );
      alert(e?.response?.data?.message || e?.message || "Failed to update status.");
    } finally {
      clearBusyFor(id);
    }
  };

  const saveEdit = async (id) => {
    const form = forms[id] || {};
    setBusyFor(id, "save");
    setFormErr((s) => ({ ...s, [id]: "" }));
    setFormMsg((s) => ({ ...s, [id]: "" }));

    const skills = (form.skillsCsv || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: form.title,
      jobTitle: form.title,
      // keep region/location in sync
      region: form.region,
      location: form.region,
      city: form.region,
      description: form.description,
      summary: form.description,
      ...(form.maxSalary !== ""
        ? { salary: Number(form.maxSalary) }
        : form.minSalary !== ""
        ? { salary: Number(form.minSalary) }
        : {}),
      minSalary: form.minSalary !== "" ? Number(form.minSalary) : undefined,
      maxSalary: form.maxSalary !== "" ? Number(form.maxSalary) : undefined,
      salaryRange:
        form.minSalary && form.maxSalary
          ? `${form.minSalary} – ${form.maxSalary}`
          : undefined,
      skills,
      requiredSkills: skills,
      skillsRequired: skills,
      tags: skills,
    };

    try {
      const attempts = [
        () => api.put(`/api/jobs/${id}`, payload),
        () => api.patch(`/api/jobs/${id}`, payload),
        () => api.patch(`/api/employer/jobs/${id}`, payload),
      ];
      let res = null;
      let ok = false;
      for (const call of attempts) {
        try {
          res = await call();
          ok = true;
          break;
        } catch {}
      }
      if (!ok) throw new Error("Update failed.");

      const updated = res?.data?.job || res?.data;

      setJobs((arr) =>
        arr.map((j) => {
          if ((j._id || j.id) !== id) return j;
          if (updated && typeof updated === "object") return { ...j, ...updated };
          return {
            ...j,
            title: form.title,
            jobTitle: form.title,
            region: form.region,
            location: form.region,
            city: form.region,
            description: form.description,
            summary: form.description,
            ...(form.maxSalary !== ""
              ? { salary: Number(form.maxSalary) }
              : form.minSalary !== ""
              ? { salary: Number(form.minSalary) }
              : {}),
            minSalary: form.minSalary !== "" ? Number(form.minSalary) : j.minSalary,
            maxSalary: form.maxSalary !== "" ? Number(form.maxSalary) : j.maxSalary,
            skills,
            requiredSkills: skills,
            skillsRequired: skills,
            tags: skills,
          };
        })
      );

      // refresh baseline so Save returns to faint/disabled state
      setBaseForms((b) => ({ ...b, [id]: { ...form } }));
      setFormMsg((s) => ({ ...s, [id]: "Saved." }));
      setTimeout(() => setFormMsg((s) => ({ ...s, [id]: "" })), 1000);
    } catch (e) {
      setFormErr((s) => ({
        ...s,
        [id]: e?.response?.data?.message || "Failed to save changes.",
      }));
    } finally {
      clearBusyFor(id);
    }
  };

  const startEdit = (job) => {
    const id = job._id || job.id;
    const snap = jobToForm(job);
    setEditing((e) => ({ ...e, [id]: !e[id] }));
    setForms((f) => ({ ...f, [id]: f[id] || snap }));
    setBaseForms((b) => ({ ...b, [id]: b[id] || { ...snap } }));
    setFormErr((s) => ({ ...s, [id]: "" }));
    setFormMsg((s) => ({ ...s, [id]: "" }));
  };

  if (loading) return <p>Loading your jobs…</p>;
  if (err) return <p className="text-red-600">{err}</p>;
  if (!jobs.length) return <p>You haven’t posted any jobs yet.</p>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Jobs</h1>
        <Link
          to="/employer/post-job"
          className="px-3 py-2 rounded-md bg-primary text-white hover:opacity-90 text-sm"
        >
          + Post Job
        </Link>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {jobs.map((job) => {
          const id = job._id || job.id;
          const title = job.title || job.jobTitle || "Untitled";
          const location = job.region || job.location || job.city || "Location";
          const created = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "";
          const applicants =
            (Array.isArray(job.applications) ? job.applications.length : null) ??
            job.applicantCount ?? job.applicationCount ?? job.applicationsCount ?? null;
          const status = getStatus(job);
          const isBusy = busy[id];
          const form = forms[id] || {};
          const isEditing = !!editing[id];
          const dirty = isDirty(id);

          return (
            <li key={id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-accent2 truncate">{title}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${BADGE[status]}`}>{status}</span>
                  </div>
                  <p className="text-sm text-gray-700">{location}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {created ? `Posted ${created}` : ""}
                    {applicants != null ? ` • ${applicants} applicant${applicants === 1 ? "" : "s"}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link to={`/jobs/${id}`} className="px-3 py-2 rounded-md border hover:bg-gray-50 text-sm">
                    View
                  </Link>

                  <Link
                    to={`/employer/jobs/${id}/applicants`}
                    className="px-3 py-2 rounded-md border hover:bg-gray-50 text-sm inline-flex items-center gap-2"
                  >
                    Applicants
                    {applicants != null && (
                      <span className="inline-flex items-center justify-center min-w-6 h-5 px-1 rounded-full bg-gray-100 text-xs">
                        {applicants}
                      </span>
                    )}
                  </Link>

                  <button
                    onClick={() => startEdit(job)}
                    className="px-3 py-2 rounded-md border hover:bg-gray-50 text-sm"
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>

                  <button
                    onClick={() => toggleOpen(job)}
                    disabled={isBusy === "toggle"}
                    className="px-3 py-2 rounded-md bg-gray-800 text-white hover:opacity-90 disabled:opacity-50 text-sm"
                  >
                    {isBusy === "toggle" ? "Updating…" : status === "open" ? "Close" : "Open"}
                  </button>

                  <button
                    onClick={() => setConfirmDelete({ id, title })}
                    disabled={isBusy === "delete"}
                    className="px-3 py-2 rounded-md bg-red-600 text-white hover:opacity-90 disabled:opacity-50 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Inline editor */}
              {isEditing && (
                <div className="mt-4 border-t pt-4">
                  {formMsg[id] && (
                    <div className="mb-2 border border-green-300 bg-green-50 text-green-700 rounded p-2 text-sm">
                      {formMsg[id]}
                    </div>
                  )}
                  {formErr[id] && (
                    <div className="mb-2 border border-red-300 bg-red-50 text-red-700 rounded p-2 text-sm">
                      {formErr[id]}
                    </div>
                  )}

                  <div className="grid gap-3">
                    <label className="block">
                      <span className="text-sm font-medium">Title</span>
                      <input
                        className="mt-1 w-full border rounded-md p-2"
                        value={form.title || ""}
                        onChange={(e) => setFormFor(id, { title: e.target.value })}
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium">Region</span>
                      <select
                        className="mt-1 w-full border rounded-md p-2"
                        value={form.region || ""}
                        onChange={(e) => setFormFor(id, { region: e.target.value })}
                      >
                        <option value="" disabled>
                          Select region…
                        </option>
                        {REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-sm font-medium">Min Salary</span>
                        <input
                          type="number"
                          min="0"
                          className="mt-1 w-full border rounded-md p-2"
                          value={form.minSalary}
                          onChange={(e) => setFormFor(id, { minSalary: e.target.value })}
                          placeholder="1200"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium">Max Salary</span>
                        <input
                          type="number"
                          min="0"
                          className="mt-1 w-full border rounded-md p-2"
                          value={form.maxSalary}
                          onChange={(e) => setFormFor(id, { maxSalary: e.target.value })}
                          placeholder="1800"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-sm font-medium">Skills (comma-separated)</span>
                      <input
                        className="mt-1 w-full border rounded-md p-2"
                        value={form.skillsCsv || ""}
                        onChange={(e) => setFormFor(id, { skillsCsv: e.target.value })}
                        placeholder="sales, customer service, mobile money"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium">Description</span>
                      <textarea
                        className="mt-1 w-full border rounded-md p-2 min-h-[120px]"
                        value={form.description || ""}
                        onChange={(e) => setFormFor(id, { description: e.target.value })}
                        placeholder="Describe responsibilities, requirements, benefits…"
                      />
                    </label>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => saveEdit(id)}
                      disabled={busy[id] === "save" || !dirty}
                      className="px-4 py-2 rounded-md text-white disabled:opacity-50"
                      style={{ backgroundColor: PINE }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PINE_HOVER)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PINE)}
                    >
                      {busy[id] === "save" ? "Saving…" : "Save Changes"}
                    </button>

                    <button
                      onClick={() => setEditing((e) => ({ ...e, [id]: false }))}
                      className="px-4 py-2 rounded-md border hover:bg-gray-50"
                    >
                      Close Editor
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Global delete confirmation dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this job?"
        body="Applicants will no longer see it."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          const id = confirmDelete?.id;
          setConfirmDelete(null);
          if (id) removeJobDirect(id);
        }}
      />
    </section>
  );
}
