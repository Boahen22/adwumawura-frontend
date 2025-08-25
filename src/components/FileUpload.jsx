// src/components/FileUpload.jsx
import { useState } from "react";

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file); // backend expects 'file'

    setUploading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
      }
      const data = await res.json();
      setUrl(data.secure_url);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-semibold mb-2">Upload verification document</h3>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files[0] || null)}
        />
        <button
          type="submit"
          disabled={!file || uploading}
          className="px-4 py-2 rounded bg-emerald-700 text-white"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {url && (
        <div className="mt-3 text-sm">
          <div className="mb-1">Uploaded URL:</div>
          <a href={url} target="_blank" rel="noreferrer" className="underline text-blue-700">
            {url}
          </a>
          {/* quick preview if it’s an image */}
          {/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url) && (
            <img src={url} alt="Uploaded" className="mt-3 max-h-64 rounded" />
          )}
        </div>
      )}
    </div>
  );
}
