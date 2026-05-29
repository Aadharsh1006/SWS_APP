import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import { startNotificationStream } from './services/sse';
import api from './services/api';
import NotificationPanel from './components/NotificationPanel';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch notifications from the backend
  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();

    const source = startNotificationStream(
      (notification) => {
        toast.success(notification.message || 'New notification received');
        // Prepend new notification to state
        setNotifications((prev) => [notification, ...prev]);
        setRefreshKey((prev) => prev + 1);
      },
      () => {
        console.warn('SSE disconnected');
      }
    );

    return () => source?.close();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-lg font-bold text-white">📋</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 font-sans">SWS AI Document Hub</h1>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600 font-sans">LIVE DEMO</span>
              </div>
            </div>

            {/* Bell Icon with badge & dropdown panel */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-gray-100 transition-colors"
                aria-label="View notifications"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white animate-in scale-in duration-300">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationPanel
                  notifications={notifications}
                  onClose={() => setShowNotifications(false)}
                  onMarkRead={handleMarkRead}
                  onMarkAllRead={handleMarkAllRead}
                />
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex gap-8">
              <button className="border-b-2 border-blue-600 py-3 text-sm font-semibold text-blue-600 hover:text-blue-700">
                <span className="mr-2">📤</span>Document Upload
              </button>
              <button className="border-b-2 border-transparent py-3 text-sm font-semibold text-slate-600 hover:border-gray-200 hover:text-slate-900">
                <span className="mr-2">🤖</span>AI Assistant
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Dashboard refreshKey={refreshKey} />
      </main>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;
