import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Notification fetch error', error);
    res.status(500).json({ message: 'Unable to load notifications' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    console.error('Notification update error', error);
    res.status(500).json({ message: 'Unable to update notification' });
  }
});

router.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Notification mark-all error', error);
    res.status(500).json({ message: 'Unable to mark all notifications as read' });
  }
});

export default router;
