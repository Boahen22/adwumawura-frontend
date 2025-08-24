// src/pages/PostJob.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

// Brand colours
const PINE = "#247e6d";
const PINE_HOVER = "#2b8f7b";
const PINE_DISABLED = "#b9d9d3"; // lighter pine when inactive

// Ghana regions
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

export default function PostJob() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [region, setRegion] = useState("Greater Accra");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [skillsCsv, setSkillsCsv] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // essentials: title + region + description + at least one salary field
  const canSubmit = useMemo(() => {
    const haveSalary =
      (minSalary !== "" && Number(minSalary) > 0) ||
      (maxSalary !== "" && Number(maxSalary) > 0);
    return Boolean(title.trim() && region && description.trim() && haveSalary);
  }, [title, region, description, minSalary, maxSalary]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setErr("");
    setMsg("");
    setSubmitting(true);

    const skillsRequired = (skillsCsv || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // The backend requires "salary" (number). Use max, else min.
    const salaryNumber =
      maxSalary !== "" ? Number(maxSalary) : Number(minSalary || 0);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      location: region, // backend uses "location"
      salary: salaryNumber,
      skillsRequired, // controller normalizes to lowercase
      // Optional extras many backends accept:
      company: company.trim() || undefined,
      minSalary: minSalary !== "" ? Number(minSalary) : undefined,
      maxSalary: maxSalary !== "" ? Number(maxSalary) : undefined,
      salaryRange:
        minSalary && maxSalary ? `${minSalary} – ${maxSalary}` : undefined,
    };

    try {
      // Primary endpoint
      await api.post("/api/jobs", payload);

      setMsg("Job posted successfully.");
      // brief pause then go to employer jobs
      setTimeout(() => navigate("/employer/jobs"), 600);
    } catch (e1) {
      // Fallbacks if your API differs
      try {
        await api.post("/api/employer/jobs", payload);
        setMsg("Job posted successfully.");
        setTimeout(() => navigate("/employer/jobs"), 600);
      } catch (e2) {
        setErr(
          e2?.response?.data?.message ||
            e1?.response?.data?.message ||
            "Failed to post job."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Post a Job</h1>

      {msg && (
        <div className="mb-3 border border-green-300 bg-green-50 text-green-700 rounded p-2 text-sm">
          {msg}
        </div>
      )}
      {err && (
        <div className="mb-3 border border-red-300 bg-red-50 text-red-700 rounded p-2 text-sm">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm font-medium">
          Job Title
          <input
            className="mt-1 w-full border rounded-md p-2"
            placeholder="e.g., Mobile Money Agent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className="block text-sm font-medium">
          Company (optional)
          <input
            className="mt-1 w-full border rounded-md p-2"
            placeholder="e.g., Adwumawura Ltd."
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block text-sm font-medium md:col-span-1">
            Region
            <select
              className="mt-1 w-full border rounded-md p-2"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Min Salary (GHS)
            <input
              type="number"
              min="0"
              className="mt-1 w-full border rounded-md p-2"
              placeholder="e.g., 1200"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            Max Salary (GHS)
            <input
              type="number"
              min="0"
              className="mt-1 w-full border rounded-md p-2"
              placeholder="e.g., 2000"
              value={maxSalary}
              onChange={(e) => setMaxSalary(e.target.value)}
            />
          </label>
        </div>

        <label className="block text-sm font-medium">
          Skills (comma separated)
          <input
            className="mt-1 w-full border rounded-md p-2"
            placeholder="customer service, sales, Excel"
            value={skillsCsv}
            onChange={(e) => setSkillsCsv(e.target.value)}
          />
        </label>

        <label className="block text-sm font-medium">
          Description
          <textarea
            className="mt-1 w-full border rounded-md p-2 min-h-[140px]"
            placeholder="Describe the role, responsibilities, and requirements…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        {/* CTA row */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="px-4 py-2 rounded-md text-white disabled:cursor-not-allowed"
            style={{
              backgroundColor:
                !canSubmit || submitting ? PINE_DISABLED : PINE,
            }}
            onMouseEnter={(e) => {
              if (canSubmit && !submitting)
                e.currentTarget.style.backgroundColor = PINE_HOVER;
            }}
            onMouseLeave={(e) => {
              if (canSubmit && !submitting)
                e.currentTarget.style.backgroundColor = PINE;
            }}
          >
            {submitting ? "Posting…" : "Post Job"}
          </button>
        </div>
      </form>
    </section>
  );
}
