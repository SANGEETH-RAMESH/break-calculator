// Web Audio API Synthesizer & Web Notification Utilities for Break Reminder

export const playBreakAlertSound = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Play an uplifting, crisp melodic alarm sequence (D5 -> F#5 -> A5 -> D6)
    const notes = [587.33, 739.99, 880, 1174.66];

    const playChimeSequence = (delayOffset: number) => {
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delayOffset + idx * 0.16);

        // Envelope
        gain.gain.setValueAtTime(0, ctx.currentTime + delayOffset + idx * 0.16);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delayOffset + idx * 0.16 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delayOffset + idx * 0.16 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delayOffset + idx * 0.16);
        osc.stop(ctx.currentTime + delayOffset + idx * 0.16 + 0.55);
      });
    };

    // First ring
    playChimeSequence(0);
    // Second ring after 900ms
    playChimeSequence(0.9);
    // Third ring after 1.8s
    playChimeSequence(1.8);
  } catch (err) {
    console.warn('Audio alert could not play:', err);
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  return false;
};

export const triggerBreakNotification = async (durationText: string) => {
  const title = 'Thambi... time aayiduchu! ⏰';
  const body = `Your ${durationText} break is over.\nTime to get back to work! 💪`;

  // Try service worker notification first (better background support)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'break-reminder',
          ...({ vibrate: [300, 150, 300, 150, 300] } as Record<string, unknown>),
        } as NotificationOptions);
        return;
      }
    } catch (err) {
      console.warn('Service worker notification failed, trying fallback:', err);
    }
  }

  // Fallback to standard Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/logo.png',
      });
    } catch (err) {
      console.warn('Notification failed:', err);
    }
  }
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeAndSchedulePush = async (
  duration: number,
  unit: 'Minutes' | 'Seconds'
): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const vapidKey =
      (import.meta as { env?: { VITE_VAPID_PUBLIC_KEY?: string } }).env?.VITE_VAPID_PUBLIC_KEY ||
      'BGDxhWW11WBX2Vr9OXRgBJ68fmxWHJK8s49vtNlj7xHzBJqE6SUARupAJNhLExvOEYh3FcnX40k9w62ViwWRQZo';

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    const delaySeconds = unit === 'Minutes' ? duration * 60 : duration;

    const response = await fetch('/api/schedule-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        delaySeconds,
        duration,
        unit,
      }),
    });

    return response.ok;
  } catch (err) {
    console.warn('Could not schedule server push:', err);
    return false;
  }
};
