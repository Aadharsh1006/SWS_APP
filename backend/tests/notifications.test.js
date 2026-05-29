import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock models before importing app
vi.mock('../models/Document.js', () => ({
  default: {
    create: vi.fn(),
    find: vi.fn().mockReturnValue({ sort: vi.fn().mockResolvedValue([]) })
  }
}));

vi.mock('../models/Notification.js', () => {
  const mockSort = vi.fn();
  const mockFind = vi.fn().mockReturnValue({ sort: mockSort });
  const mockFindByIdAndUpdate = vi.fn();
  const mockUpdateMany = vi.fn();
  return {
    default: {
      create: vi.fn(),
      find: mockFind,
      findByIdAndUpdate: mockFindByIdAndUpdate,
      updateMany: mockUpdateMany
    },
    __mockFind: mockFind,
    __mockSort: mockSort,
    __mockFindByIdAndUpdate: mockFindByIdAndUpdate,
    __mockUpdateMany: mockUpdateMany
  };
});

vi.mock('../sse.js', () => ({
  broadcastNotification: vi.fn(),
  createSSEClient: vi.fn()
}));

const { default: app } = await import('../app.js');
const {
  __mockFind: mockFind,
  __mockSort: mockSort,
  __mockFindByIdAndUpdate: mockFindByIdAndUpdate,
  __mockUpdateMany: mockUpdateMany
} = await import('../models/Notification.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/notifications', () => {
  it('should return notifications sorted by createdAt descending', async () => {
    const mockNotifs = [
      { _id: 'n1', message: '5 files uploaded', type: 'success', read: false },
      { _id: 'n2', message: '4 files uploaded', type: 'success', read: true }
    ];
    mockSort.mockResolvedValueOnce(mockNotifs);

    const res = await request(app).get('/api/notifications');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockNotifs);
    expect(mockFind).toHaveBeenCalled();
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('should return 500 when DB query fails', async () => {
    mockSort.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/notifications');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Unable to load notifications');
  });
});

describe('PATCH /api/notifications/:id/read', () => {
  it('should mark a notification as read', async () => {
    const updated = { _id: 'n1', message: 'test', type: 'info', read: true };
    mockFindByIdAndUpdate.mockResolvedValueOnce(updated);

    const res = await request(app).patch('/api/notifications/n1/read');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('n1', { read: true }, { new: true });
  });

  it('should return 404 when notification is not found', async () => {
    mockFindByIdAndUpdate.mockResolvedValueOnce(null);

    const res = await request(app).patch('/api/notifications/nonexistent/read');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Notification not found');
  });

  it('should return 500 on DB error', async () => {
    mockFindByIdAndUpdate.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).patch('/api/notifications/n1/read');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Unable to update notification');
  });
});

describe('PATCH /api/notifications/read-all', () => {
  it('should mark all unread notifications as read', async () => {
    mockUpdateMany.mockResolvedValueOnce({ modifiedCount: 3 });

    const res = await request(app).patch('/api/notifications/read-all');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('All notifications marked as read');
    expect(mockUpdateMany).toHaveBeenCalledWith({ read: false }, { read: true });
  });

  it('should return 500 on DB error', async () => {
    mockUpdateMany.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).patch('/api/notifications/read-all');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Unable to mark all notifications as read');
  });
});
