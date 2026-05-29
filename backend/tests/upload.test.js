import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock Mongoose models BEFORE importing app
vi.mock('../models/Document.js', () => {
  const mockCreate = vi.fn();
  return {
    default: {
      create: mockCreate,
      find: vi.fn().mockReturnValue({ sort: vi.fn().mockResolvedValue([]) })
    }
  };
});

vi.mock('../models/Notification.js', () => ({
  default: {
    create: vi.fn().mockResolvedValue({ _id: 'n1', message: 'test', type: 'success' }),
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
const { default: Document } = await import('../models/Document.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(__dirname, 'fixtures', 'sample.pdf');

// Create a tiny valid-looking PDF fixture for testing
import fs from 'fs';
const fixturesDir = path.join(__dirname, 'fixtures');
fs.mkdirSync(fixturesDir, { recursive: true });
// Write a minimal PDF-like file (enough for multer's mimetype check)
if (!fs.existsSync(fixturePath)) {
  fs.writeFileSync(fixturePath, '%PDF-1.4 minimal test file content');
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default Document.create mock — returns a realistic doc object
  Document.create.mockImplementation((data) =>
    Promise.resolve({
      _id: `doc_${Date.now()}`,
      ...data,
      uploadDate: new Date().toISOString()
    })
  );
});

describe('POST /api/upload', () => {
  it('should reject requests with no files', async () => {
    const res = await request(app).post('/api/upload');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No files uploaded');
  });

  it('should upload a single PDF file and return a document', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('files', fixturePath);

    expect(res.status).toBe(201);
    expect(res.body.documents).toHaveLength(1);
    expect(Document.create).toHaveBeenCalledTimes(1);
    expect(Document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'sample.pdf',
        fileType: 'application/pdf',
        status: 'completed'
      })
    );
  });

  it('should reject non-PDF files', async () => {
    // Create a .txt fixture
    const txtPath = path.join(fixturesDir, 'invalid.txt');
    fs.writeFileSync(txtPath, 'just plain text');

    try {
      const res = await request(app)
        .post('/api/upload')
        .attach('files', txtPath);

      // If we get a response, it should be a 400 rejection
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Only PDF files are allowed');
    } catch (err) {
      // multer may reset the connection before Express can respond —
      // this still confirms the file was rejected (not silently accepted)
      expect(err.code === 'ECONNRESET' || err.message.includes('ECONNRESET')).toBe(true);
    }
  });

  it('should upload multiple PDF files', async () => {
    // Create a second PDF fixture
    const pdf2Path = path.join(fixturesDir, 'sample2.pdf');
    fs.writeFileSync(pdf2Path, '%PDF-1.4 second test file');

    const res = await request(app)
      .post('/api/upload')
      .attach('files', fixturePath)
      .attach('files', pdf2Path);

    expect(res.status).toBe(201);
    expect(res.body.documents).toHaveLength(2);
    expect(Document.create).toHaveBeenCalledTimes(2);
  });

  it('should handle batchId and totalFiles fields', async () => {
    const res = await request(app)
      .post('/api/upload')
      .field('batchId', 'batch-123')
      .field('totalFiles', '1')
      .attach('files', fixturePath);

    expect(res.status).toBe(201);
    expect(res.body.documents).toHaveLength(1);
  });

  it('should handle Document.create failure gracefully', async () => {
    Document.create.mockRejectedValueOnce(new Error('DB write failed'));

    const res = await request(app)
      .post('/api/upload')
      .attach('files', fixturePath);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Upload failed');
  });
});
