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
 * Returns current period ('morning' | 'noon' | 'evening' | 'night')
 * based on 24-hour clock time or current Date.
 */
export function getCurrentTimePeriod(now: Date = new Date()): TimePeriod {
  const h = now.getHours();
  const m = now.getMinutes();
  const totalMinutes = h * 60 + m;

  // morning: 05:00 (300) to 11:00 (660)
  if (totalMinutes >= 300 && totalMinutes < 660) {
    return 'morning';
  }
  // noon: 11:00 (660) to 15:00 (900)
  if (totalMinutes >= 660 && totalMinutes < 900) {
    return 'noon';
  }
  // evening: 15:00 (900) to 19:00 (1140)
  if (totalMinutes >= 900 && totalMinutes < 1140) {
    return 'evening';
  }
  // night: 19:00 (1140) to 05:00 (300)
  return 'night';
}
