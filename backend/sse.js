const clients = new Map();

export function createSSEClient(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write('retry: 10000\n\n');

  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 15000);

  clients.set(clientId, { res, keepAlive });

  res.on('close', () => {
    const client = clients.get(clientId);
    if (client) {
      clearInterval(client.keepAlive);
      clients.delete(clientId);
    }
  });
}

export function broadcastNotification(notification) {
  const payload = JSON.stringify(notification);
  for (const { res } of clients.values()) {
    res.write('event: notification\n');
    res.write(`data: ${payload}\n\n`);
  }
}
