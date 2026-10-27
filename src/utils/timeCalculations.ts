import type { Shift, CalculationResult, ParseResult, TimeCalculationMode, DayType, ShiftHalf } from '../types/shift';
import { REGULAR_SHIFT_RULES, GBJ_SHIFT_RULES, HALF_DAY_RULES } from '../constants/shifts';

/**
 * Format total integer minutes into HH:MM duration string (e.g. 48 -> "00:48", 90 -> "01:30").
 */
export function formatMinutesToHHMM(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Format integer minutes into "XXh YYm" format (e.g. 48 -> "00h 48m", 12 -> "00h 12m", 507 -> "08h 27m").
 */
export function formatMinutesToHhMm(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

/**
 * Format minutes from midnight into 12-hour clock format (e.g. 780 -> "1:00 PM", 1335 -> "10:15 PM").
 */
export function formatMinutesToClockTime12h(minutesFromMidnight: number): string {
  const normalized = ((minutesFromMidnight % 1440) + 1440) % 1440;
  const rawHours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const ampm = rawHours >= 12 ? 'PM' : 'AM';
  const hours = rawHours % 12 === 0 ? 12 : rawHours % 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

/**
 * Add or subtract minutes to a 24-hour HH:MM time string, correctly wrapping 24 hours.
 */
export function addMinutesToClock24(clock24: string, minutesToAdd: number): string {
  const [h, m] = clock24.split(':').map(Number);
  const total = (((h * 60 + m + minutesToAdd) % 1440) + 1440) % 1440;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/**
 * Returns the effective start time, end time, and label for half-day shifts.
 * Half day rule: 5 hours total (4h 30m work required + 30m break).
 * - First Half: starts at shift.startTime and runs for 5 hours (300 mins).
 * - Second Half: ends at shift.endTime and starts 5 hours (300 mins) prior to shift.endTime.
 */
export function getHalfDayShiftTimes(
  shift: Shift,
  half: ShiftHalf
): { startTime: string; endTime: string; label: string } {
  if (half === 'first_half') {
    const startTime = shift.startTime;
    const endTime = addMinutesToClock24(shift.startTime, 300);
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const start12 = formatMinutesToClockTime12h(sH * 60 + sM);
    const end12 = formatMinutesToClockTime12h(eH * 60 + eM);
    return {
      startTime,
      endTime,
      label: `${start12} – ${end12} (1st Half)`,
    };
  } else {
    const endTime = shift.endTime;
    const startTime = addMinutesToClock24(shift.endTime, -300);
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const start12 = formatMinutesToClockTime12h(sH * 60 + sM);
    const end12 = formatMinutesToClockTime12h(eH * 60 + eM);
    return {
      startTime,
      endTime,
      label: `${start12} – ${end12} (2nd Half)`,
    };
  }
}

/**
 * Parses duration or time string into minutes.
 * Accepts "HH:MM", "HH:MM:SS", "H:MM", or "HH:MM AM/PM".
 */
export function parseTimeToMinutes(timeStr: string): ParseResult & { seconds?: number } {
  const trimmed = timeStr.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Please enter your worked time.',
    };
  }

  // Check 3-part HH:MM:SS format (e.g. "08:27:30")
  const hmsMatch = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (hmsMatch) {
    const hours = parseInt(hmsMatch[1], 10);
    const minutes = parseInt(hmsMatch[2], 10);
    const seconds = parseInt(hmsMatch[3], 10);
    if (hours < 0 || hours > 24) return { isValid: false, error: 'Hours must be between 00 and 24.' };
    if (minutes < 0 || minutes > 59) return { isValid: false, error: 'Minutes must be between 00 and 59.' };
    if (seconds < 0 || seconds > 59) return { isValid: false, error: 'Seconds must be between 00 and 59.' };
    return { isValid: true, minutes: hours * 60 + minutes + seconds / 60, seconds };
  }

  // Check 12-hour AM/PM format (e.g. "7:30 PM" or "10:30 AM")
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      return { isValid: false, error: 'Invalid time value entered.' };
    }
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return { isValid: true, minutes: hours * 60 + minutes, seconds: 0 };
  }

  // Check 24-hour / standard duration format (e.g. "08:27", "8:27")
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return {
      isValid: false,
      error: 'Please enter time in HH:MM or HH:MM:SS format (e.g., 08:27 or 08:27:30).',
    };
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    return { isValid: false, error: 'Invalid numbers detected in time input.' };
  }
  if (minutes < 0 || minutes > 59) {
    return { isValid: false, error: 'Minutes must be between 00 and 59.' };
  }
  if (hours < 0 || hours > 24) {
    return { isValid: false, error: 'Hours must be between 00 and 24.' };
  }

  return { isValid: true, minutes: hours * 60 + minutes, seconds: 0 };
}

/**
 * Calculates elapsed minutes between two clock times, correctly handling shifts crossing midnight.
 */
export function calculateElapsedMinutesBetween(startClock24: string, endClock24: string): number {
  const parse24 = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const startMin = parse24(startClock24);
  const endMin = parse24(endClock24);

  if (endMin < startMin) {
    return 1440 - startMin + endMin;
  }
  return endMin - startMin;
}

/**
 * Get current local time in HH:MM 24-hour format.
 */
export function getCurrentClockTime24(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatMinutesToBadge(totalMinutes: number): string {
  const safe = Math.max(0, Math.floor(totalMinutes));
  return `${safe} mins`;
}

/**
 * Primary Real-Time Shift Break Calculation (Break Taken Mode):
 * In the reference design, user inputs total break time taken (e.g. 00:10).
 * Break Left = Allowed Break - Break Taken
 * Elapsed Time = (Current Clock or Logout Time) - Shift Start
 * Work Left = Required Working Time - Worked Time
 */
export function calculateBreakFromBreakTaken(
  shift: Shift,
  breakTakenMinutes: number,
  refClock24?: string,
  mode: TimeCalculationMode = 'current_time',
  dayType: DayType = 'full_day',
  shiftHalf: ShiftHalf = 'first_half'
): CalculationResult {
  const clock24 = refClock24 || getCurrentClockTime24();
  const isHalfDay = dayType === 'half_day';
  const rules = isHalfDay
    ? HALF_DAY_RULES
    : (shift.isGBJ ? GBJ_SHIFT_RULES : REGULAR_SHIFT_RULES);

  const halfTimes = isHalfDay ? getHalfDayShiftTimes(shift, shiftHalf) : null;
  const effectiveStartTime = halfTimes ? halfTimes.startTime : shift.startTime;
  const effectiveEndTime = halfTimes ? halfTimes.endTime : shift.endTime;
  const effectiveShiftLabel = halfTimes ? halfTimes.label : shift.label;

  const totalAllowedBreak = rules.allowedBreakMinutes; // 30m or 60m
  const requiredWorkingMinutes = rules.requiredWorkingMinutes; // 270m or 510m / 360m

  const elapsedMinutes = calculateElapsedMinutesBetween(effectiveStartTime, clock24);
  const breakTaken = Math.max(0, breakTakenMinutes);
  const breakLeft = Math.max(0, totalAllowedBreak - breakTaken);
  const excessBreak = Math.max(0, breakTaken - totalAllowedBreak);

  // Real-time worked minutes: elapsed time up to current clock
  const workedMinutes = Math.max(0, elapsedMinutes);
  const workLeftMinutes = Math.max(0, requiredWorkingMinutes - workedMinutes);

  const percentageUsed = totalAllowedBreak > 0
    ? Math.min(100, Math.round((Math.min(breakTaken, totalAllowedBreak) / totalAllowedBreak) * 100))
    : 0;

  const [refH, refM] = clock24.split(':').map(Number);
  const clock12h = formatMinutesToClockTime12h(refH * 60 + refM);

  return {
    breakTakenMinutes: breakTaken,
    breakLeftMinutes: breakLeft,
    breakTakenFormatted: formatMinutesToHHMM(breakTaken),
    breakLeftFormatted: formatMinutesToHHMM(breakLeft),
    breakTakenHhMm: formatMinutesToHhMm(breakTaken),
    breakLeftHhMm: formatMinutesToHhMm(breakLeft),
    breakTakenDisplay: formatMinutesToBadge(breakTaken),
    breakLeftDisplay: formatMinutesToBadge(breakLeft),
    workedHhMm: formatMinutesToHhMm(workedMinutes),
    totalAllowedHhMm: formatMinutesToHhMm(totalAllowedBreak),
    totalAllowedBreakMinutes: totalAllowedBreak,
    totalAllowedBreakFormatted: formatMinutesToHHMM(totalAllowedBreak),
    percentageUsed,
    shift,
    workedMinutes,
    workedTimeFormatted: formatMinutesToHHMM(workedMinutes),
    elapsedMinutes,
    elapsedFormatted: formatMinutesToHHMM(elapsedMinutes),
    elapsedHhMm: formatMinutesToHhMm(elapsedMinutes),
    workLeftMinutes,
    workLeftHhMm: formatMinutesToHhMm(workLeftMinutes),
    currentTimeFormatted: clock12h,
    excessBreakMinutes: excessBreak,
    excessBreakHhMm: formatMinutesToHhMm(excessBreak),
    excessBreakDisplay: formatMinutesToBadge(excessBreak),
    calculationMode: mode,
    inputMode: 'break_taken',
    dayType,
    shiftHalf,
    effectiveStartTime,
    effectiveEndTime,
    effectiveShiftLabel,
  };
}

/**
 * Real-Time Shift Break Calculation (Worked Time Mode):
 * Elapsed Time = (Current Clock Time or Logout Time) - Shift Start Time
 * Break Taken = Elapsed Time - Worked Time
 * Break Left = Allowed Break (60m or 30m) - Break Taken
 * Over Break = Break Taken - Allowed Break (if Break Taken > Allowed Break)
 */
export function calculateLiveShiftBreak(
  shift: Shift,
  workedMinutes: number,
  refClock24?: string,
  mode: TimeCalculationMode = 'current_time',
  rawSeconds: number = 0,
  dayType: DayType = 'full_day',
  shiftHalf: ShiftHalf = 'first_half'
): CalculationResult {
  const clock24 = refClock24 || getCurrentClockTime24();
  const isHalfDay = dayType === 'half_day';
  const rules = isHalfDay
    ? HALF_DAY_RULES
    : (shift.isGBJ ? GBJ_SHIFT_RULES : REGULAR_SHIFT_RULES);

  const halfTimes = isHalfDay ? getHalfDayShiftTimes(shift, shiftHalf) : null;
  const effectiveStartTime = halfTimes ? halfTimes.startTime : shift.startTime;
  const effectiveEndTime = halfTimes ? halfTimes.endTime : shift.endTime;
  const effectiveShiftLabel = halfTimes ? halfTimes.label : shift.label;

  const totalAllowedBreak = rules.allowedBreakMinutes; // 60 mins (Full Day) or 30 mins (Half Day)
  const requiredWorkingMinutes = rules.requiredWorkingMinutes; // 510 or 360 (Full Day) or 270 (Half Day)

  const elapsedMinutes = calculateElapsedMinutesBetween(effectiveStartTime, clock24);

  // In custom logout mode or during live shift where elapsed >= worked
  let breakTaken: number;
  if (mode === 'logout_time' || elapsedMinutes >= workedMinutes) {
    breakTaken = Math.max(0, elapsedMinutes - workedMinutes);
  } else {
    // When workedMinutes > elapsedMinutes (e.g. testing full shift duration ahead of current clock)
    breakTaken = Math.max(0, workedMinutes - requiredWorkingMinutes);
  }

  const breakLeft = Math.max(0, totalAllowedBreak - breakTaken);
  const excessBreak = Math.max(0, breakTaken - totalAllowedBreak);
  const workLeftMinutes = Math.max(0, requiredWorkingMinutes - workedMinutes);

  const percentageUsed = totalAllowedBreak > 0
    ? Math.min(100, Math.max(0, Math.round((Math.min(breakTaken, totalAllowedBreak) / totalAllowedBreak) * 100)))
    : 0;

  const [refH, refM] = clock24.split(':').map(Number);
  const clock12h = formatMinutesToClockTime12h(refH * 60 + refM);

  const workedHours = Math.floor(workedMinutes / 60);
  const workedMins = Math.floor(workedMinutes % 60);
  const workedHhMm = rawSeconds > 0
    ? `${String(workedHours).padStart(2, '0')}h ${String(workedMins).padStart(2, '0')}m ${String(rawSeconds).padStart(2, '0')}s`
    : `${String(workedHours).padStart(2, '0')}h ${String(workedMins).padStart(2, '0')}m`;

  const workLeftHours = Math.floor(workLeftMinutes / 60);
  const workLeftMins = Math.floor(workLeftMinutes % 60);
  const workLeftHhMm = `${String(workLeftHours).padStart(2, '0')}h ${String(workLeftMins).padStart(2, '0')}m`;

  return {
    breakTakenMinutes: breakTaken,
    breakLeftMinutes: breakLeft,
    breakTakenFormatted: formatMinutesToHHMM(breakTaken),
    breakLeftFormatted: formatMinutesToHHMM(breakLeft),
    breakTakenHhMm: formatMinutesToHhMm(breakTaken),
    breakLeftHhMm: formatMinutesToHhMm(breakLeft),
    breakTakenDisplay: formatMinutesToBadge(breakTaken),
    breakLeftDisplay: formatMinutesToBadge(breakLeft),
    workedHhMm,
    totalAllowedHhMm: formatMinutesToHhMm(totalAllowedBreak),
    totalAllowedBreakMinutes: totalAllowedBreak,
    totalAllowedBreakFormatted: formatMinutesToHHMM(totalAllowedBreak),
    percentageUsed,
    shift,
    workedMinutes,
    workedTimeFormatted: formatMinutesToHHMM(workedMinutes),
    elapsedMinutes,
    elapsedFormatted: formatMinutesToHHMM(elapsedMinutes),
    elapsedHhMm: formatMinutesToHhMm(elapsedMinutes),
    workLeftMinutes,
    workLeftHhMm,
    currentTimeFormatted: clock12h,
    excessBreakMinutes: excessBreak,
    excessBreakHhMm: formatMinutesToHhMm(excessBreak),
    excessBreakDisplay: formatMinutesToBadge(excessBreak),
    calculationMode: mode,
    inputMode: 'worked_time',
    workedSeconds: rawSeconds,
    dayType,
    shiftHalf,
    effectiveStartTime,
    effectiveEndTime,
    effectiveShiftLabel,
  };
}

/**
 * Validates worked minutes against shift limits for automated testing and manual entry.
 */
export function validateWorkedMinutesForShift(
  workedMinutes: number,
  shift: Shift,
  dayType: DayType = 'full_day'
): { isValid: boolean; error?: string } {
  if (workedMinutes < 0) {
    return { isValid: false, error: 'Worked time cannot be negative.' };
  }
  const rules = dayType === 'half_day'
    ? HALF_DAY_RULES
    : (shift.isGBJ ? GBJ_SHIFT_RULES : REGULAR_SHIFT_RULES);
  if (workedMinutes > rules.shiftDurationMinutes) {
    return {
      isValid: false,
      error: `Worked time cannot exceed total shift length (${formatMinutesToHhMm(rules.shiftDurationMinutes)}).`,
    };
  }
  return { isValid: true };
}

/**
 * Standard specification formula for test cases:
 */
export function calculateBreak(
  shift: Shift,
  workedMinutes: number,
  dayType: DayType = 'full_day',
  shiftHalf: ShiftHalf = 'first_half'
): CalculationResult {
  const isHalfDay = dayType === 'half_day';
  const rules = isHalfDay
    ? HALF_DAY_RULES
    : (shift.isGBJ ? GBJ_SHIFT_RULES : REGULAR_SHIFT_RULES);

  const halfTimes = isHalfDay ? getHalfDayShiftTimes(shift, shiftHalf) : null;
  const effectiveStartTime = halfTimes ? halfTimes.startTime : shift.startTime;
  const effectiveEndTime = halfTimes ? halfTimes.endTime : shift.endTime;
  const effectiveShiftLabel = halfTimes ? halfTimes.label : shift.label;

  const requiredWorkingTime = rules.requiredWorkingMinutes;
  const totalAllowedBreak = rules.allowedBreakMinutes;

  let breakTaken = Math.max(0, workedMinutes - requiredWorkingTime);
  const excessBreak = Math.max(0, breakTaken - totalAllowedBreak);
  const breakLeft = Math.max(0, totalAllowedBreak - breakTaken);
  const workLeftMinutes = Math.max(0, requiredWorkingTime - workedMinutes);

  const percentageUsed = totalAllowedBreak > 0
    ? Math.min(100, Math.max(0, Math.round((Math.min(breakTaken, totalAllowedBreak) / totalAllowedBreak) * 100)))
    : 0;

  return {
    breakTakenMinutes: breakTaken,
    breakLeftMinutes: breakLeft,
    breakTakenFormatted: formatMinutesToHHMM(breakTaken),
    breakLeftFormatted: formatMinutesToHHMM(breakLeft),
    breakTakenHhMm: formatMinutesToHhMm(breakTaken),
    breakLeftHhMm: formatMinutesToHhMm(breakLeft),
    breakTakenDisplay: formatMinutesToBadge(breakTaken),
    breakLeftDisplay: formatMinutesToBadge(breakLeft),
    workedHhMm: formatMinutesToHhMm(workedMinutes),
    totalAllowedHhMm: formatMinutesToHhMm(totalAllowedBreak),
    totalAllowedBreakMinutes: totalAllowedBreak,
    totalAllowedBreakFormatted: formatMinutesToHHMM(totalAllowedBreak),
    percentageUsed,
    shift,
    workedMinutes,
    workedTimeFormatted: formatMinutesToHHMM(workedMinutes),
    elapsedMinutes: workedMinutes,
    elapsedFormatted: formatMinutesToHHMM(workedMinutes),
    elapsedHhMm: formatMinutesToHhMm(workedMinutes),
    workLeftMinutes,
    workLeftHhMm: formatMinutesToHhMm(workLeftMinutes),
    currentTimeFormatted: '',
    excessBreakMinutes: excessBreak,
    excessBreakHhMm: formatMinutesToHhMm(excessBreak),
    excessBreakDisplay: formatMinutesToBadge(excessBreak),
    inputMode: 'worked_time',
    dayType,
    shiftHalf,
    effectiveStartTime,
    effectiveEndTime,
    effectiveShiftLabel,
  };
}
