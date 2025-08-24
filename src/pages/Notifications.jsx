// src/pages/Notifications.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";

const PINE = "#247e6d";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyIds, setBusyIds] = useState(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/api/notifications");
      const payload = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const list = payload.map((n) => ({
        id: n._id || n.id,
        title: n.title || "Notification",
        message: n.message || "",
        createdAt: n.createdAt || null,
        read: Boolean(n.isRead || n.read),
        type: n.type || "info",
      }));
      setItems(list);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markOneRead = async (id) => {
    setBusyIds((s) => new Set([...s, id]));
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setItems((arr) => arr.map((n) => (n.id === id ? { ...n, read: true } : n)));
      window.dispatchEvent(new Event("notifications-changed"));
    } catch (e) {
      // optional: display a toast
    } finally {
      setBusyIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch("/api/notifications/read-all");
      setItems((arr) => arr.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new Event("notifications-changed"));
    } catch (e) {
      // optional: display a toast
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = items.filter((n) => !n.read).length;

  if (loading) return <p>Loading notifications…</p>;
  if (err) return <p className="text-red-600">{err}</p>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Notifications {unreadCount ? `(${unreadCount} unread)` : ""}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-2 rounded-md border hover:bg-gray-50 text-sm"
          >
            Refresh
          </button>
          <button
            disabled={!unreadCount || markingAll}
            onClick={markAllRead}
            className="px-3 py-2 rounded-md text-white text-sm disabled:opacity-50"
            style={{ backgroundColor: PINE }}
          >
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const when = n.createdAt ? new Date(n.createdAt).toLocaleString() : "";
            const tone =
              n.type === "success"
                ? "border-green-200 bg-green-50"
                : n.type === "warning"
                ? "border-yellow-200 bg-yellow-50"
                : n.type === "error"
                ? "border-red-200 bg-red-50"
                : "border-gray-200 bg-white";

            return (
              <li key={n.id}>
                <div
                  className={`border rounded-xl p-4 ${tone} ${
                    !n.read ? "ring-1 ring-[rgba(36,126,109,0.35)]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-accent2">
                        {n.title}
                      </h2>
                      {when && <p className="text-xs text-gray-500 mt-0.5">{when}</p>}
                      {n.message && (
                        <p className="text-sm text-gray-800 mt-2 whitespace-pre-line break-words">
                          {n.message}
                        </p>
                      )}
                    </div>

                    {!n.read ? (
                      <button
                        onClick={() => markOneRead(n.id)}
                        disabled={busyIds.has(n.id)}
                        className="px-3 py-1 rounded-md text-white text-xs hover:opacity-90 disabled:opacity-50 h-8"
                        style={{ backgroundColor: PINE }}
                        title="Mark as read"
                      >
                        {busyIds.has(n.id) ? "Marking…" : "Mark read"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
