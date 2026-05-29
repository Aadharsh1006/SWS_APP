import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import multer from 'multer';
import Document from '../models/Document.js';
import Notification from '../models/Notification.js';
import { broadcastNotification } from '../sse.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

router.post('/', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const documents = await Promise.all(
      req.files.map((file) => {
        return Document.create({
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          filePath: `uploads/${file.filename}`,
          status: 'completed'
        });
      })
    );

    if (req.files.length > 3) {
      const message = `${req.files.length} files uploaded successfully`;
      const notification = await Notification.create({ message, type: 'success' });
      broadcastNotification(notification);
    }

    return res.status(201).json({ documents });
  } catch (error) {
    console.error('Upload error', error);
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

export default router;
