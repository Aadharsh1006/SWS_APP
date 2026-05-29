import express from 'express';
import { createSSEClient } from '../sse.js';

const router = express.Router();

router.get('/', (req, res) => {
  createSSEClient(res);
});

export default router;
