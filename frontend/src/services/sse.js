const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export function startNotificationStream(onNotification, onDisconnect) {
  try {
    const source = new EventSource(`${API_BASE_URL.replace('/api', '')}/api/events`);

    source.addEventListener('notification', (event) => {
      try {
        const data = JSON.parse(event.data);
        onNotification?.(data);
      } catch (error) {
        console.error('Error parsing notification data:', error);
      }
    });

    source.addEventListener('error', (error) => {
      if (source.readyState === EventSource.CLOSED) {
        console.warn('SSE connection closed');
        onDisconnect?.();
      } else {
        console.error('SSE error:', error);
      }
    });

    return source;
  } catch (error) {
    console.error('Failed to start notification stream:', error);
    return null;
  }
}
