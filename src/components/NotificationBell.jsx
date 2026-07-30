import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead } from "../api/notifications";

export default function NotificationBell() {
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await getNotifications();
      setNotes(res.data);
    } catch {
      // fail silently — notifications aren't critical path
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notes.filter((n) => !n.is_read).length;

  const handleOpen = async () => {
    setOpen(!open);
    if (!open) {
      const unread = notes.filter((n) => !n.is_read);
      for (const n of unread) {
        await markNotificationRead(n.id);
      }
      load();
    }
  };

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative text-zinc-100">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-zinc-900 rounded-lg shadow-lg p-3 z-10">
          {loading ? (
            <p className="text-zinc-400 text-sm">Loading notifications\u2026</p>
          ) : notes.length === 0 ? (
            <p className="text-zinc-400 text-sm">No notifications yet.</p>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                className="text-sm text-zinc-200 border-b border-zinc-800 py-2"
              >
                {n.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
