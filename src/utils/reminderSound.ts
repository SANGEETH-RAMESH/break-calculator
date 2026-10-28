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
