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

// Cached audio instance pre-unlocked during user interactions
let sharedAudio: HTMLAudioElement | null = null;

export const unlockAudio = () => {
  if (typeof window === 'undefined') return;
  try {
    if (!sharedAudio) {
      sharedAudio = new Audio('/sounds/break-alert.mp3');
      sharedAudio.preload = 'auto';
    }
    // Briefly play and pause with tiny volume during a user interaction to satisfy autoplay policy
    sharedAudio.volume = 0.01;
    const playPromise = sharedAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          sharedAudio?.pause();
          if (sharedAudio) {
            sharedAudio.currentTime = 0;
            sharedAudio.volume = 1.0;
          }
        })
        .catch(() => {
          // Ignore - will reattempt on actual play
        });
    }
  } catch (err) {
    console.warn('Unlock audio error:', err);
  }
};

// Automatically attempt to unlock audio on the very first user tap/click on the document
if (typeof window !== 'undefined') {
  const onFirstInteraction = () => {
    unlockAudio();
    window.removeEventListener('click', onFirstInteraction);
    window.removeEventListener('touchstart', onFirstInteraction);
    window.removeEventListener('keydown', onFirstInteraction);
  };
  window.addEventListener('click', onFirstInteraction, { once: true, passive: true });
  window.addEventListener('touchstart', onFirstInteraction, { once: true, passive: true });
  window.addEventListener('keydown', onFirstInteraction, { once: true, passive: true });
}

export const playBreakAlertSound = () => {
  if (typeof window === 'undefined') return;
  try {
    if (sharedAudio) {
      sharedAudio.currentTime = 0;
      sharedAudio.volume = 1.0;
      const promise = sharedAudio.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn('Playback of pre-unlocked audio failed, trying fallback:', err);
          fallbackPlay();
        });
        return;
      }
    }
    fallbackPlay();
  } catch (err) {
    console.warn('Audio play error:', err);
    fallbackPlay();
  }
};

function fallbackPlay() {
  try {
    const audio = new Audio('/sounds/break-alert.mp3');
    audio.volume = 1.0;
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => {
        const alt = new Audio('/sound/break-alert.mp3');
        alt.volume = 1.0;
        alt.play().catch(() => {
          // If browser completely blocks mp3, synthesize a tone via AudioContext
          playSynthesizedBeep();
        });
      });
    }
  } catch {
    playSynthesizedBeep();
  }
}

function playSynthesizedBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (err) {
    console.warn('Synthesized beep failed:', err);
  }
}

export const triggerBreakNotification = async (durationText: string) => {
  const title = 'Thambi... time aayiduchu! ⏰';
  const body = `Your ${durationText} break is over.\nTime to get back to work! 💪`;

  // Always play the custom alert sound immediately
  playBreakAlertSound();

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
          ...({
            vibrate: [300, 150, 300, 150, 300],
            sound: '/sounds/break-alert.mp3',
          } as Record<string, unknown>),
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
        ...({ sound: '/sounds/break-alert.mp3' } as Record<string, unknown>),
      } as NotificationOptions);
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
