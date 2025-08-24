// src/pages/EmployerVerification.jsx
import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';

function normalizeStatus(payload) {
  const s =
    payload?.status ||
    payload?.verificationStatus ||
    (payload?.isVerified ? 'approved' : undefined) ||
    (payload?.approved ? 'approved' : undefined) ||
    (payload?.pending ? 'pending' : undefined) ||
    'unverified';

  return {
    status: String(s).toLowerCase(),
    note:
      payload?.note ||
      payload?.adminNote ||
      payload?.reason ||
      payload?.message ||
      '',
    submittedAt: payload?.submittedAt || payload?.createdAt || null,
    updatedAt: payload?.updatedAt || null,
  };
}

export default function EmployerVerification() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState({ status: 'unverified', note: '' });

  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const { data } = await api.get('/api/verification/me');
      const payload = data?.verification || data?.data || data || { status: 'unverified' };
      setInfo(normalizeStatus(payload));
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to load verification status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErr('Please choose a document to upload.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErr('File too large (max 8MB).');
      return;
    }

    setErr('');
    setMsg('');
    setSending(true);
    try {
      const fd = new FormData();
      // Canonical field name expected by the backend
      fd.append('document', file);

      const res = await api.post('/api/verification/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMsg(res?.data?.message || 'Document uploaded. Your verification is now pending review.');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || 'Upload failed.');
    } finally {
      setSending(false);
    }
  };

  const Badge = ({ status }) => {
    const map = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      unverified: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${map[status] || map.unverified}`}>
        {status}
      </span>
    );
  };

  if (loading) return <p>Loading verification…</p>;

  const { status, note, submittedAt, updatedAt } = info || { status: 'unverified' };
  const canUpload = status === 'unverified' || status === 'rejected';

  const onInputChange = (e) => {
    const f = e.target.files?.[0] || null;
    setErr('');
    setMsg('');
    setFile(f);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0] || null;
    setErr('');
    setMsg('');
    setFile(f);
  };

  return (
    <section className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employer Verification</h1>
        <Badge status={status} />
      </div>

      {msg && (
        <div className="border border-green-300 bg-green-50 text-green-700 rounded p-2 text-sm">
          {msg}
        </div>
      )}
      {err && (
        <div className="border border-red-300 bg-red-50 text-red-700 rounded p-2 text-sm">
          {err}
        </div>
      )}

      {submittedAt && (
        <p className="text-sm text-gray-600">
          Submitted: {new Date(submittedAt).toLocaleString()}
          {updatedAt ? ` • Updated: ${new Date(updatedAt).toLocaleString()}` : ''}
        </p>
      )}

      {status === 'approved' && (
        <div className="rounded-md border p-4 bg-green-50 border-green-200">
          <p className="text-green-800">
            Your account is verified. You can post jobs and reach candidates with a verified badge.
          </p>
        </div>
      )}

      {status === 'pending' && (
        <div className="rounded-md border p-4 bg-yellow-50 border-yellow-200">
          <p className="text-yellow-800">
            Your documents are under review. We’ll notify you when a decision is made.
          </p>
        </div>
      )}

      {status === 'rejected' && (
        <div className="rounded-md border p-4 bg-red-50 border-red-200">
          <p className="text-red-800 font-medium">Verification rejected.</p>
          {note && <p className="text-red-700 mt-1 text-sm">Reason: {note}</p>}
          <p className="text-sm mt-2">You can upload again with corrected documents.</p>
        </div>
      )}

      {status === 'unverified' && (
        <div className="rounded-md border p-4 bg-gray-50 border-gray-200">
          <p>Upload a business registration or any required document to get verified.</p>
        </div>
      )}

      {canUpload && (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium">
            Upload document (PDF, JPG, PNG — max 8MB)
          </label>

          <div className="rounded-xl border bg-white shadow-sm">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`m-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition
                ${dragOver ? 'border-[#247e6d] bg-[#247e6d]/5' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" d="M7 16a4 4 0 1 1 0-8 5 5 0 1 1 9.9 1.5A3.5 3.5 0 1 1 17 16H7Z" />
                <path strokeWidth="1.5" d="M12 14v6m0 0-2-2m2 2 2-2" />
              </svg>

              <p className="text-sm text-gray-700">Drag &amp; drop your document here, or</p>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-3 inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#247e6d]/40"
              >
                Choose file
              </button>

              <input
                ref={inputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={onInputChange}
                className="sr-only"
              />

              {file && (
                <p className="mt-3 text-sm text-gray-700">
                  Selected: <span className="font-medium">{file.name}</span>{' '}
                  <span className="text-gray-500">({Math.round(file.size / 1024)} KB)</span>
                </p>
              )}
            </div>

            <div className="m-4 mt-0 flex gap-2 justify-center">
              <button
                type="submit"
                disabled={!file || sending}
                className="px-4 py-2 rounded-md text-white shadow-sm
                           bg-[#247e6d] hover:bg-[#1f6a5c] focus:outline-none focus:ring-2 focus:ring-[#247e6d]/40
                           disabled:opacity-50 disabled:cursor-not-allowed"
                title={!file ? 'Choose a file first' : 'Upload now'}
              >
                {sending ? 'Uploading…' : 'Upload now'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setErr('');
                  setMsg('');
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Clear
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
