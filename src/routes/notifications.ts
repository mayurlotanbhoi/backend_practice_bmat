import { Router, Request, Response } from 'express';
import { saveToken, sendNotification } from '../firebase/admin.js';

const router = Router();

router.post('/save-token', (req: Request, res: Response)  => {
  const { token } = req.body;
  if (!token){
      res.status(400).json({ error: 'Token is required' });
      return
    }

  saveToken(token);
  res.json({ success: true });
});

router.post('/send-notification', async (req: Request, res: Response) : Promise<void> => {
  const { title, body, imageUrl, url } = req.body;

  if (!title || !body) {
     res.status(400).json({ error: 'Missing title or body' });
     return
  }

  try {
    const result = await sendNotification({ title, body, imageUrl, url });
    res.json({ success: true, results: result });
  } catch (error: any) {
    console.error('Error sending notifications:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
