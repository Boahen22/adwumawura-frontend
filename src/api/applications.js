// src/api/applications.js
// Helpers for job application APIs.

import api from "./axios";

/**
 * Apply to a job with optional CV upload.
 * Sends multipart/form-data with "cv" as the file field.
 */
export async function applyToJob(jobId, { coverLetter = "", file = null } = {}) {
  const fd = new FormData();
  if (coverLetter) fd.append("coverLetter", coverLetter);
  if (file) fd.append("cv", file);

  const { data } = await api.post(`/api/applications/${jobId}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * Get the current user's applications.
 * Canonical backend route: GET /api/applications/my
 * Returns an array of Application docs populated with { job: { _id, title, location } }.
 */
export async function getMyApplications() {
  // Primary route
  try {
    const { data } = await api.get("/api/applications/my");
    return Array.isArray(data) ? data : [];
  } catch (e) {
    // Optional fallbacks in case other builds used different paths
    const fallbacks = ["/api/applications/me", "/api/my-applications"];
    for (const p of fallbacks) {
      try {
        const { data } = await api.get(p);
        return Array.isArray(data) ? data : [];
      } catch {}
    }
    throw e;
  }
}
