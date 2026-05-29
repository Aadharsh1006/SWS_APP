import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock models before importing app
vi.mock('../models/Document.js', () => {
  const mockSort = vi.fn();
  const mockFind = vi.fn().mockReturnValue({ sort: mockSort });
  return {
    default: {
      find: mockFind,
      create: vi.fn()
    },
    __mockFind: mockFind,
    __mockSort: mockSort
  };
});

vi.mock('../models/Notification.js', () => ({
  default: {
    create: vi.fn(),
    find: vi.fn().mockReturnValue({ sort: vi.fn().mockResolvedValue([]) }),
    findByIdAndUpdate: vi.fn(),
    updateMany: vi.fn()
  }
}));

vi.mock('../sse.js', () => ({
  broadcastNotification: vi.fn(),
  createSSEClient: vi.fn()
}));

const { default: app } = await import('../app.js');
const { __mockFind: mockFind, __mockSort: mockSort } = await import('../models/Document.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/documents', () => {
  it('should return a list of documents sorted by uploadDate descending', async () => {
    const mockDocs = [
      { _id: 'd1', fileName: 'a.pdf', fileSize: 100, uploadDate: '2026-01-02' },
      { _id: 'd2', fileName: 'b.pdf', fileSize: 200, uploadDate: '2026-01-01' }
    ];
    mockSort.mockResolvedValueOnce(mockDocs);

    const res = await request(app).get('/api/documents');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockDocs);
    expect(mockFind).toHaveBeenCalled();
    expect(mockSort).toHaveBeenCalledWith({ uploadDate: -1 });
  });

  it('should return an empty array when no documents exist', async () => {
    mockSort.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/documents');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return 500 when DB query fails', async () => {
    mockSort.mockRejectedValueOnce(new Error('DB read failure'));

    const res = await request(app).get('/api/documents');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Unable to fetch documents');
  });
});
