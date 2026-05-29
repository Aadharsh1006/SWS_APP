import { useEffect } from 'react';

export default function NotificationPanel({
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
}) {
  // Close on pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50/50">
        <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
        <div className="flex gap-2">
          {notifications.some((n) => !n.read) && (
            <button
              onClick={onMarkAllRead}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <span className="text-2xl mb-2">🔔</span>
            <p className="text-xs font-medium text-slate-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`flex items-start gap-3 p-4 transition-colors ${
                notification.read ? 'bg-white opacity-85' : 'bg-blue-50/30'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs ${notification.read ? 'text-slate-600' : 'text-slate-950 font-medium'}`}>
                    {notification.message}
                  </p>
                  {!notification.read && (
                    <button
                      onClick={() => onMarkRead(notification._id)}
                      className="shrink-0 text-[10px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full px-2 py-0.5 transition-colors"
                      title="Mark as read"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                    notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <span>{new Date(notification.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
