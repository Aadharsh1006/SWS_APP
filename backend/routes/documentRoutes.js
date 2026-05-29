import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({ message: 'Documents endpoint not implemented yet' });
});

export default router;
