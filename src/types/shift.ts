export interface Shift {
  id: string;
  label: string;
  startTime: string; // HH:MM 24-hour format (e.g. "13:00")
  endTime: string;   // HH:MM 24-hour format (e.g. "22:30")
  isGBJ: boolean;
}

export interface ShiftRule {
  shiftDurationMinutes: number;
  requiredWorkingMinutes: number;
  allowedBreakMinutes: number;
}

export type TimeCalculationMode = 'current_time' | 'logout_time';
export type InputMode = 'break_taken' | 'worked_time';
export type DayType = 'full_day' | 'half_day';
export type ShiftHalf = 'first_half' | 'second_half';

export interface CalculationResult {
  breakTakenMinutes: number;
  breakLeftMinutes: number;
  breakTakenFormatted: string; // e.g. "00:10"
  breakLeftFormatted: string;  // e.g. "00:50"
  breakTakenHhMm: string;      // e.g. "00h 10m"
  breakLeftHhMm: string;       // e.g. "00h 50m"
  breakTakenDisplay: string;   // e.g. "10 mins"
  breakLeftDisplay: string;    // e.g. "50 mins"
  workedHhMm: string;          // e.g. "00h 06m"
  totalAllowedHhMm: string;    // e.g. "01h 00m" or "00h 30m"
  totalAllowedBreakMinutes: number;
  totalAllowedBreakFormatted: string;
  percentageUsed: number;
  shift: Shift;
  workedTimeFormatted: string;
  workedMinutes: number;
  elapsedMinutes: number;
  elapsedFormatted: string;
  elapsedHhMm: string;
  workLeftMinutes: number;
  workLeftHhMm: string;
  currentTimeFormatted: string;
  excessBreakMinutes?: number;
  excessBreakHhMm?: string;
  excessBreakDisplay?: string;
  calculationMode?: TimeCalculationMode;
  inputMode?: InputMode;
  workedSeconds?: number;
  dayType?: DayType;
  shiftHalf?: ShiftHalf;
  effectiveStartTime?: string;
  effectiveEndTime?: string;
  effectiveShiftLabel?: string;
}

export interface ParseResult {
  isValid: boolean;
  minutes?: number;
  error?: string;
}

