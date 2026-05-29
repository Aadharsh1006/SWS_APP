import express from 'express';
const router = express.Router();

router.post('/', (req, res) => {
  res.status(501).json({ message: 'Upload endpoint not implemented yet' });
});

export default router;
