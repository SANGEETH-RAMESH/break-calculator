// Web Notification Utilities for Break Reminder

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
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<ServiceWorkerRegistration>((_, reject) =>
        setTimeout(() => reject(new Error('SW ready timeout')), 2500)
      ),
    ]);
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
