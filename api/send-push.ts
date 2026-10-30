import type { VercelRequest, VercelResponse } from './_types';
import webpush from 'web-push';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { subscription, duration, unit, title, body } = req.body || {};

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Missing push subscription object.' });
    }

    const vapidPublic = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@breakcalculator.app';

    if (!vapidPublic || !vapidPrivate) {
      return res.status(500).json({
        error: 'VAPID keys not configured in environment variables (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY).',
      });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const payload = JSON.stringify({
      title: title || 'Thambi... time aayiduchu! ⏰',
      body:
        body ||
        `Your ${duration || 25} ${(unit || 'Minutes').toLowerCase()} break is over.\nTime to get back to work! 💪`,
      icon: '/logo.png',
      badge: '/logo.png',
      sound: '/sounds/break-alert1.mp3',
      vibrate: [300, 150, 300, 150, 300],
      url: '/',
    });

    const response = await webpush.sendNotification(subscription, payload);

    return res.status(200).json({
      success: true,
      message: 'Push notification sent to device successfully!',
      statusCode: response.statusCode,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string; body?: string };
    console.error('Error sending push notification:', err);

    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Failed to dispatch push notification',
      details: err.body || null,
    });
  }
}
