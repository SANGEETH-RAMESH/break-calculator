export const timePeriods = {
  morning: {
    from: '05:00',
    to: '11:00',
  },
  noon: {
    from: '11:00',
    to: '15:00',
  },
  evening: {
    from: '15:00',
    to: '19:00',
  },
  night: {
    from: '19:00',
    to: '05:00',
  },
} as const;

export type TimePeriod = keyof typeof timePeriods;

export const PERIOD_IMAGES: Record<TimePeriod, { desktop: string; mobile: string }> = {
  morning: {
    desktop: '/morning.png',
    mobile: '/mobile_morning.png',
  },
  noon: {
    desktop: '/noon.png',
    mobile: '/mobile_noon.png',
  },
  evening: {
    desktop: '/evening.png',
    mobile: '/mobile_evening.png',
  },
  night: {
    desktop: '/night.png',
    mobile: '/mobile_night.png',
  },
};

/**
 * Helper to convert "HH:MM" string to minutes from 00:00
 */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Returns current period ('morning' | 'noon' | 'evening' | 'night')
 * dynamically calculated from the timePeriods config.
 */
export function getCurrentTimePeriod(now: Date = new Date()): TimePeriod {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const morningStart = toMinutes(timePeriods.morning.from);
  const morningEnd = toMinutes(timePeriods.morning.to);
  const noonStart = toMinutes(timePeriods.noon.from);
  const noonEnd = toMinutes(timePeriods.noon.to);
  const eveningStart = toMinutes(timePeriods.evening.from);
  const eveningEnd = toMinutes(timePeriods.evening.to);

  if (currentMinutes >= morningStart && currentMinutes < morningEnd) {
    return 'morning';
  }
  if (currentMinutes >= noonStart && currentMinutes < noonEnd) {
    return 'noon';
  }
  if (currentMinutes >= eveningStart && currentMinutes < eveningEnd) {
    return 'evening';
  }
  return 'night';
}
