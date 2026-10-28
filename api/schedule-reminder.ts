import type { VercelRequest, VercelResponse } from './_types';
import { Client } from '@upstash/qstash';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { subscription, delaySeconds, duration, unit } = req.body || {};

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Missing push subscription object.' });
    }

    const qstashToken = process.env.QSTASH_TOKEN;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const destinationUrl = `${baseUrl.replace(/\/$/, '')}/api/send-push`;

    if (qstashToken) {
      const client = new Client({ token: qstashToken });
      const delay = Math.max(1, parseInt(String(delaySeconds), 10) || 60);

      const result = await client.publishJSON({
        url: destinationUrl,
        delay, // delay in seconds
        body: {
          subscription,
          duration,
          unit,
        },
      });

      return res.status(200).json({
        success: true,
        scheduled: true,
        messageId: result.messageId,
        delaySeconds: delay,
        message: `Reminder scheduled with QStash for ${delay}s.`,
      });
    } else {
      // QStash token not configured yet
      return res.status(200).json({
        success: true,
        scheduled: false,
        warning:
          'QSTASH_TOKEN not set in environment variables yet. Add QSTASH_TOKEN in Vercel to enable server-side background wakeups.',
      });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error scheduling reminder with QStash:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to schedule reminder',
    });
  }
}
