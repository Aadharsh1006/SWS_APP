import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import { startNotificationStream } from './services/sse';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const source = startNotificationStream(
      (notification) => {
        toast.success(notification.message || 'New notification received');
        setRefreshKey((prev) => prev + 1);
      },
      () => {
        console.warn('SSE disconnected');
      }
    );

    return () => source?.close();
  }, []);

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
                <h1 className="text-xl font-bold text-slate-900">SWS AI Document Hub</h1>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">LIVE DEMO</span>
              </div>
            </div>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-gray-100">
              <span className="text-xl">🔔</span>
            </button>
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
