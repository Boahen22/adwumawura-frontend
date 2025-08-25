// src/api/upload.js
// Helper for uploading files to backend, which pushes them to Cloudinary

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Upload failed");
  }

  return res.json(); // returns { public_id, secure_url, ... }
}
