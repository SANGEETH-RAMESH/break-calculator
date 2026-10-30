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

// Web Audio Context & pre-decoded AudioBuffer for low-latency SFX (no media player controls)
let audioCtx: AudioContext | null = null;
let notificationAudioBuffer: AudioBuffer | null = null;
let isPreloading = false;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioConstructor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioConstructor) {
      audioCtx = new AudioConstructor();
    }
  }
  return audioCtx;
};

// Fetch and decode the MP3 into memory so it plays instantly like a system sound effect
const preloadSoundBuffer = async () => {
  if (typeof window === 'undefined' || notificationAudioBuffer || isPreloading) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  isPreloading = true;
  try {
    const urls = ['/sounds/break-alert1.mp3', '/sound/break-alert1.mp3', '/sounds/break-alert.mp3'];
    let arrayBuffer: ArrayBuffer | null = null;

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          arrayBuffer = await res.arrayBuffer();
          break;
        }
      } catch {
        // try next url
      }
    }

    if (arrayBuffer) {
      notificationAudioBuffer = await ctx.decodeAudioData(arrayBuffer);
    }
  } catch (err) {
    console.warn('Could not decode notification sound buffer:', err);
  } finally {
    isPreloading = false;
  }
};

export const unlockAudio = () => {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    preloadSoundBuffer();
  } catch (err) {
    console.warn('Unlock audio error:', err);
  }
};

// Automatically unlock and preload on the very first user interaction
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

/**
 * Plays the alert as a punchy, native-feeling notification sound effect (SFX):
 * - Does NOT trigger browser media player widgets or hijack background music
 * - Automatically limits duration to ~2.5s with a smooth fade-out so it doesn't drone on like a song
 */
export const playBreakAlertSound = (maxDurationSeconds = 2.5) => {
  if (typeof window === 'undefined') return;

  const ctx = getAudioContext();
  if (ctx && notificationAudioBuffer) {
    try {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();

      source.buffer = notificationAudioBuffer;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;
      const duration = Math.min(notificationAudioBuffer.duration, maxDurationSeconds);

      // Volume envelope: full volume, then quick smooth fade-out at the end
      gainNode.gain.setValueAtTime(1.0, now);
      if (duration > 0.4) {
        gainNode.gain.setValueAtTime(1.0, now + duration - 0.4);
        gainNode.gain.linearRampToValueAtTime(0.001, now + duration);
      }

      source.start(now);
      source.stop(now + duration);
      return;
    } catch (err) {
      console.warn('Buffer playback error, trying audio element fallback:', err);
    }
  }

  // Fallback to HTML5 audio if buffer not yet decoded, but cut it short like a notification
  fallbackShortAudio(maxDurationSeconds);
};

function fallbackShortAudio(durationSeconds: number) {
  try {
    const audio = new Audio('/sounds/break-alert1.mp3');
    audio.volume = 1.0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Stop playback after duration so it doesn't linger like a long song
          setTimeout(() => {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch {
              // ignore
            }
          }, durationSeconds * 1000);
        })
        .catch(() => {
          playSynthesizedBeep();
        });
    }
  } catch {
    playSynthesizedBeep();
  }
}

function playSynthesizedBeep() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
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
            sound: '/sounds/break-alert1.mp3',
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
        ...({ sound: '/sounds/break-alert1.mp3' } as Record<string, unknown>),
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
