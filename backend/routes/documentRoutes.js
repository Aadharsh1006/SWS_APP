import express from 'express';
import Document from '../models/Document.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const documents = await Document.find().sort({ uploadDate: -1 });
    res.json(documents);
  } catch (error) {
    console.error('Document fetch error', error);
    res.status(500).json({ message: 'Unable to fetch documents' });
  }
});

export default router;
