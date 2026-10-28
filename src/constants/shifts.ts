import type { Shift, ShiftRule, DayType } from '../types/shift';

export const REGULAR_SHIFT_RULES: ShiftRule = {
  shiftDurationMinutes: 570,     // 9 hours 30 minutes
  requiredWorkingMinutes: 510,   // 8 hours 30 minutes
  allowedBreakMinutes: 60,       // 1 hour
};

export const NINE_HOUR_SHIFT_RULES: ShiftRule = {
  shiftDurationMinutes: 540,     // 9 hours
  requiredWorkingMinutes: 510,   // 8 hours 30 minutes (8.5 hours)
  allowedBreakMinutes: 30,       // 30 minutes
};

// Great Break Job (GBJ): 6.5 hours work (390 min) + 30 min break = 7 hours total (420 min)
export const GBJ_SHIFT_RULES: ShiftRule = {
  shiftDurationMinutes: 420,     // 7 hours
  requiredWorkingMinutes: 390,   // 6 hours 30 minutes (6.5 hours)
  allowedBreakMinutes: 30,       // 30 minutes
};

export const HALF_DAY_RULES: ShiftRule = {
  shiftDurationMinutes: 300,     // 5 hours
  requiredWorkingMinutes: 270,   // 4 hours 30 minutes
  allowedBreakMinutes: 30,       // 30 minutes
};

// Great Break Job (GBJ) Half Day: 4 hours total (3.5 hours work + 0.5 hours break). If no break then 3.5 hours.
export const GBJ_HALF_DAY_RULES: ShiftRule = {
  shiftDurationMinutes: 240,     // 4 hours
  requiredWorkingMinutes: 210,   // 3 hours 30 minutes (3.5 hours)
  allowedBreakMinutes: 30,       // 30 minutes (0.5 hours)
};

export const SHIFT_OPTIONS: Shift[] = [
  {
    id: 'shift-1',
    label: '9:00 AM – 6:00 PM',
    startTime: '09:00',
    endTime: '18:00',
    isGBJ: false,
    allowedBreakMinutes: 30,
    requiredWorkingMinutes: 510,
    shiftDurationMinutes: 540,
  },
  {
    id: 'shift-2',
    label: '10:00 AM – 7:00 PM',
    startTime: '10:00',
    endTime: '19:00',
    isGBJ: false,
    allowedBreakMinutes: 30,
    requiredWorkingMinutes: 510,
    shiftDurationMinutes: 540,
  },
  {
    id: 'shift-3',
    label: '12:30 PM – 10:00 PM',
    startTime: '12:30',
    endTime: '22:00',
    isGBJ: false,
    allowedBreakMinutes: 60,
    requiredWorkingMinutes: 510,
    shiftDurationMinutes: 570,
  },
  {
    id: 'shift-4',
    label: '1:00 PM – 10:30 PM',
    startTime: '13:00',
    endTime: '22:30',
    isGBJ: false,
    allowedBreakMinutes: 60,
    requiredWorkingMinutes: 510,
    shiftDurationMinutes: 570,
  },
  {
    id: 'shift-5',
    label: '4:30 PM – 2:00 AM',
    startTime: '16:30',
    endTime: '02:00',
    isGBJ: false,
    allowedBreakMinutes: 60,
    requiredWorkingMinutes: 510,
    shiftDurationMinutes: 570,
  },
  {
    id: 'shift-6',
    label: '2:20 PM – 12:00 AM',
    startTime: '14:20',
    endTime: '00:00',
    isGBJ: false,
    allowedBreakMinutes: 60,
    requiredWorkingMinutes: 510,
    shiftDurationMinutes: 580,
  },
  {
    id: 'shift-7',
    label: '11:00 AM – 6:00 PM (GBJ)',
    startTime: '11:00',
    endTime: '18:00',
    isGBJ: true,
    allowedBreakMinutes: 30,
    requiredWorkingMinutes: 390,
    shiftDurationMinutes: 420,
  },
  {
    id: 'shift-8',
    label: '12:00 PM – 7:00 PM (GBJ)',
    startTime: '12:00',
    endTime: '19:00',
    isGBJ: true,
    allowedBreakMinutes: 30,
    requiredWorkingMinutes: 390,
    shiftDurationMinutes: 420,
  },
  {
    id: 'shift-9',
    label: '10:30 AM – 7:30 PM',
    startTime: '10:30',
    endTime: '19:30',
    isGBJ: false,
    allowedBreakMinutes: 30,
    requiredWorkingMinutes: 510,
    shiftDurationMinutes: 540,
  },
  {
    id: 'shift-10',
    label: '3:30 PM – 1:00 AM',
    startTime: '15:30',
    endTime: '01:00',
    isGBJ: false,
    allowedBreakMinutes: 60,
    requiredWorkingMinutes: 510,
    shiftDurationMinutes: 570,
  },
];

/**
 * Returns the exact ShiftRule for a given shift and dayType.
 */
export function getShiftRules(shift: Shift, dayType: DayType = 'full_day'): ShiftRule {
  if (dayType === 'half_day') {
    return shift.isGBJ ? GBJ_HALF_DAY_RULES : HALF_DAY_RULES;
  }
  if (shift.isGBJ) {
    return GBJ_SHIFT_RULES;
  }
  if (
    shift.allowedBreakMinutes === 30 ||
    shift.id === 'shift-1' ||
    shift.id === 'shift-2' ||
    shift.id === 'shift-9'
  ) {
    return NINE_HOUR_SHIFT_RULES;
  }
  return REGULAR_SHIFT_RULES;
}
