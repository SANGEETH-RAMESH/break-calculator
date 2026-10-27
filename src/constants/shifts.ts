import type { Shift, ShiftRule } from '../types/shift';

export const REGULAR_SHIFT_RULES: ShiftRule = {
  shiftDurationMinutes: 570,     // 9 hours 30 minutes
  requiredWorkingMinutes: 510,   // 8 hours 30 minutes
  allowedBreakMinutes: 60,       // 1 hour
};

export const GBJ_SHIFT_RULES: ShiftRule = {
  shiftDurationMinutes: 420,     // 7 hours
  requiredWorkingMinutes: 360,   // 6 hours
  allowedBreakMinutes: 60,       // 1 hour
};

export const HALF_DAY_RULES: ShiftRule = {
  shiftDurationMinutes: 300,     // 5 hours
  requiredWorkingMinutes: 270,   // 4 hours 30 minutes
  allowedBreakMinutes: 30,       // 30 minutes
};

export const SHIFT_OPTIONS: Shift[] = [
  {
    id: 'shift-1',
    label: '9:00 AM – 6:00 PM',
    startTime: '09:00',
    endTime: '18:00',
    isGBJ: false,
  },
  {
    id: 'shift-2',
    label: '10:00 AM – 7:00 PM',
    startTime: '10:00',
    endTime: '19:00',
    isGBJ: false,
  },
  {
    id: 'shift-3',
    label: '12:30 PM – 10:00 PM',
    startTime: '12:30',
    endTime: '22:00',
    isGBJ: false,
  },
  {
    id: 'shift-4',
    label: '1:00 PM – 10:30 PM',
    startTime: '13:00',
    endTime: '22:30',
    isGBJ: false,
  },
  {
    id: 'shift-5',
    label: '4:30 PM – 2:00 AM',
    startTime: '16:30',
    endTime: '02:00',
    isGBJ: false,
  },
  {
    id: 'shift-6',
    label: '2:20 PM – 12:00 AM',
    startTime: '14:20',
    endTime: '00:00',
    isGBJ: false,
  },
  {
    id: 'shift-7',
    label: '11:00 AM – 6:00 PM (GBJ)',
    startTime: '11:00',
    endTime: '18:00',
    isGBJ: true,
  },
  {
    id: 'shift-8',
    label: '12:00 PM – 7:00 PM (GBJ)',
    startTime: '12:00',
    endTime: '19:00',
    isGBJ: true,
  },
  {
    id: 'shift-9',
    label: '10:30 AM – 7:30 PM',
    startTime: '10:30',
    endTime: '19:30',
    isGBJ: false,
  },
  {
    id: 'shift-10',
    label: '3:30 PM – 1:00 AM',
    startTime: '15:30',
    endTime: '01:00',
    isGBJ: false,
  },
];
