import type { Shift, CalculationResult, ParseResult, TimeCalculationMode, DayType, ShiftHalf, AttendanceStatus } from '../types/shift';
import { getShiftRules } from '../constants/shifts';

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
 * Format minutes (including fractional seconds) into "XXh YYm ZZs" format.
 */
export function formatMinutesToHhMm(totalMinutes: number): string {
  const totalSeconds = Math.max(0, Math.round(totalMinutes * 60));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
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
 * - Regular shifts: 5 hours total (4h 30m work required + 30m break).
 * - Great Break Job (GBJ): 4 hours total (3h 30m work required + 30m break).
 */
export function getHalfDayShiftTimes(
  shift: Shift,
  half: ShiftHalf
): { startTime: string; endTime: string; label: string } {
  const duration = shift.isGBJ ? 240 : 300;
  if (half === 'first_half') {
    const startTime = shift.startTime;
    const endTime = addMinutesToClock24(shift.startTime, duration);
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
    const startTime = addMinutesToClock24(shift.endTime, -duration);
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
  const totalSeconds = Math.max(0, Math.round(totalMinutes * 60));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
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
  const rules = getShiftRules(shift, dayType);

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
 * Converts a duration or time string into a 24-hour "HH:MM" string.
 * Supports "1:10 PM", "13:10", "1:10", "01:10", etc.
 */
export function parseTimeTo24h(timeStr: string): string | null {
  const parsed = parseTimeToMinutes(timeStr);
  if (!parsed.isValid || parsed.minutes === undefined) return null;
  const total = Math.round(parsed.minutes);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Real-Time Shift Break Calculation (Worked Time Mode):
 * Elapsed Time = (Current Clock Time) - Actual Login Time
 * Break Taken = Elapsed Time - Worked Time
 * Break Left = Allowed Break (30m or 60m) - Break Taken
 * Expected Logout = Actual Login Time + Shift Duration
 * Over Break = Break Taken - Allowed Break (if Break Taken > Allowed Break)
 */
export function calculateLiveShiftBreak(
  shift: Shift,
  workedMinutes: number,
  refClock24?: string,
  mode: TimeCalculationMode = 'current_time',
  rawSeconds: number = 0,
  dayType: DayType = 'full_day',
  shiftHalf: ShiftHalf = 'first_half',
  customLoginTime?: string
): CalculationResult {
  const clock24 = refClock24 || getCurrentClockTime24();
  const isHalfDay = dayType === 'half_day';
  const rules = getShiftRules(shift, dayType);

  const halfTimes = isHalfDay ? getHalfDayShiftTimes(shift, shiftHalf) : null;
  const effectiveStartTime = halfTimes ? halfTimes.startTime : shift.startTime;
  const effectiveEndTime = halfTimes ? halfTimes.endTime : shift.endTime;
  const effectiveShiftLabel = halfTimes ? halfTimes.label : shift.label;

  // Custom / Late Login Handling
  let actualStartTime = effectiveStartTime;
  let lateMinutes = 0;
  if (customLoginTime && customLoginTime.trim()) {
    const parsedCustom = parseTimeTo24h(customLoginTime.trim());
    if (parsedCustom) {
      actualStartTime = parsedCustom;
      const diff = calculateElapsedMinutesBetween(effectiveStartTime, actualStartTime);
      if (diff > 0 && diff < 720) {
        lateMinutes = diff;
      }
    }
  }

  // Attendance classification:
  // - 0 to 2 minutes: On Time (Grace period, logout at scheduled shift end)
  // - 3 to 15 minutes: Late Reporting (work extra minutes, logout = scheduledEnd + lateMinutes)
  // - > 15 minutes: Late Login (considered late login, logout = actualLogin + shiftDuration)
  let attendanceStatus: AttendanceStatus = 'on_time';
  let attendanceStatusLabel = 'On Time';

  if (lateMinutes > 15) {
    attendanceStatus = 'late_login';
    attendanceStatusLabel = 'Late Login';
  } else if (lateMinutes >= 3) {
    attendanceStatus = 'late_reporting';
    attendanceStatusLabel = 'Late Reporting';
  } else if (lateMinutes > 0) {
    attendanceStatus = 'on_time';
    attendanceStatusLabel = 'On Time (Grace Period)';
  } else {
    attendanceStatus = 'on_time';
    attendanceStatusLabel = 'On Time';
  }

  const [aH, aM] = actualStartTime.split(':').map(Number);
  const actualLoginTimeFormatted = formatMinutesToClockTime12h(aH * 60 + aM);

  // If late <= 2 min: logout time is scheduled end time (no extra work needed).
  // If late 3-15 min (late reporting): logout is shifted by late minutes (e.g. 1:03 PM -> 10:33 PM).
  // If late > 15 min (late login): logout is actualLogin + shiftDuration.
  const expectedLogout24 = (attendanceStatus === 'on_time')
    ? effectiveEndTime
    : addMinutesToClock24(actualStartTime, rules.shiftDurationMinutes);

  const [eH, eM] = expectedLogout24.split(':').map(Number);
  const expectedLogoutTime = formatMinutesToClockTime12h(eH * 60 + eM);

  const [sH, sM] = effectiveStartTime.split(':').map(Number);
  const scheduledStartTimeFormatted = formatMinutesToClockTime12h(sH * 60 + sM);
  const [seH, seM] = effectiveEndTime.split(':').map(Number);
  const scheduledEndTimeFormatted = formatMinutesToClockTime12h(seH * 60 + seM);

  const totalAllowedBreak = rules.allowedBreakMinutes; // 30 mins or 60 mins
  const requiredWorkingMinutes = rules.requiredWorkingMinutes; // 510, 390 (GBJ), 270, or 210 (GBJ Half Day)

  // Exact second precision calculations
  const totalAllowedBreakSeconds = totalAllowedBreak * 60;
  const requiredWorkingSeconds = requiredWorkingMinutes * 60;
  const workedTotalSeconds = Math.max(0, Math.round(workedMinutes * 60));

  // Elapsed minutes from actual login time to current clock
  const elapsedMinutes = calculateElapsedMinutesBetween(actualStartTime, clock24);
  const elapsedTotalSeconds = elapsedMinutes * 60;

  let breakTakenTotalSeconds: number;
  if (elapsedTotalSeconds >= workedTotalSeconds) {
    breakTakenTotalSeconds = Math.max(0, elapsedTotalSeconds - workedTotalSeconds);
  } else {
    // When workedTotalSeconds > elapsedTotalSeconds (e.g. testing full shift duration ahead of current clock)
    breakTakenTotalSeconds = Math.max(0, workedTotalSeconds - requiredWorkingSeconds);
  }

  const breakLeftTotalSeconds = Math.max(0, totalAllowedBreakSeconds - breakTakenTotalSeconds);
  const excessBreakTotalSeconds = Math.max(0, breakTakenTotalSeconds - totalAllowedBreakSeconds);
  const workLeftTotalSeconds = Math.max(0, requiredWorkingSeconds - workedTotalSeconds);

  const breakTakenMinutes = breakTakenTotalSeconds / 60;
  const breakLeftMinutes = breakLeftTotalSeconds / 60;
  const excessBreakMinutes = excessBreakTotalSeconds / 60;
  const workLeftMinutes = workLeftTotalSeconds / 60;

  const percentageUsed = totalAllowedBreakSeconds > 0
    ? Math.min(100, Math.max(0, Math.round((Math.min(breakTakenTotalSeconds, totalAllowedBreakSeconds) / totalAllowedBreakSeconds) * 100)))
    : 0;

  const [refH, refM] = clock24.split(':').map(Number);
  const clock12h = formatMinutesToClockTime12h(refH * 60 + refM);

  const workedHours = Math.floor(workedTotalSeconds / 3600);
  const workedMins = Math.floor((workedTotalSeconds % 3600) / 60);
  const workedSecs = workedTotalSeconds % 60;
  const workedHhMm = `${String(workedHours).padStart(2, '0')}h ${String(workedMins).padStart(2, '0')}m ${String(workedSecs).padStart(2, '0')}s`;

  const workLeftHours = Math.floor(workLeftTotalSeconds / 3600);
  const workLeftMins = Math.floor((workLeftTotalSeconds % 3600) / 60);
  const workLeftSecs = workLeftTotalSeconds % 60;
  const workLeftHhMm = `${String(workLeftHours).padStart(2, '0')}h ${String(workLeftMins).padStart(2, '0')}m ${String(workLeftSecs).padStart(2, '0')}s`;

  const breakTakenHours = Math.floor(breakTakenTotalSeconds / 3600);
  const breakTakenMins = Math.floor((breakTakenTotalSeconds % 3600) / 60);
  const breakTakenSecs = breakTakenTotalSeconds % 60;
  const breakTakenDisplay = breakTakenHours > 0
    ? `${breakTakenHours}h ${String(breakTakenMins).padStart(2, '0')}m ${String(breakTakenSecs).padStart(2, '0')}s`
    : `${breakTakenMins}m ${String(breakTakenSecs).padStart(2, '0')}s`;
  const breakTakenHhMm = `${String(breakTakenHours).padStart(2, '0')}h ${String(breakTakenMins).padStart(2, '0')}m ${String(breakTakenSecs).padStart(2, '0')}s`;

  const breakLeftHours = Math.floor(breakLeftTotalSeconds / 3600);
  const breakLeftMins = Math.floor((breakLeftTotalSeconds % 3600) / 60);
  const breakLeftSecs = breakLeftTotalSeconds % 60;
  const breakLeftDisplay = breakLeftHours > 0
    ? `${breakLeftHours}h ${String(breakLeftMins).padStart(2, '0')}m ${String(breakLeftSecs).padStart(2, '0')}s`
    : `${breakLeftMins}m ${String(breakLeftSecs).padStart(2, '0')}s`;
  const breakLeftHhMm = `${String(breakLeftHours).padStart(2, '0')}h ${String(breakLeftMins).padStart(2, '0')}m ${String(breakLeftSecs).padStart(2, '0')}s`;

  const elapsedHours = Math.floor(elapsedTotalSeconds / 3600);
  const elapsedMins = Math.floor((elapsedTotalSeconds % 3600) / 60);
  const elapsedSecs = elapsedTotalSeconds % 60;
  const elapsedHhMm = `${String(elapsedHours).padStart(2, '0')}h ${String(elapsedMins).padStart(2, '0')}m ${String(elapsedSecs).padStart(2, '0')}s`;

  const excessHours = Math.floor(excessBreakTotalSeconds / 3600);
  const excessMins = Math.floor((excessBreakTotalSeconds % 3600) / 60);
  const excessSecs = excessBreakTotalSeconds % 60;
  const excessBreakDisplay = excessHours > 0
    ? `${excessHours}h ${String(excessMins).padStart(2, '0')}m ${String(excessSecs).padStart(2, '0')}s`
    : `${excessMins}m ${String(excessSecs).padStart(2, '0')}s`;
  const excessBreakHhMm = `${String(excessHours).padStart(2, '0')}h ${String(excessMins).padStart(2, '0')}m ${String(excessSecs).padStart(2, '0')}s`;

  return {
    breakTakenMinutes,
    breakLeftMinutes,
    breakTakenFormatted: formatMinutesToHHMM(breakTakenMinutes),
    breakLeftFormatted: formatMinutesToHHMM(breakLeftMinutes),
    breakTakenHhMm,
    breakLeftHhMm,
    breakTakenDisplay,
    breakLeftDisplay,
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
    elapsedHhMm,
    workLeftMinutes,
    workLeftHhMm,
    currentTimeFormatted: clock12h,
    excessBreakMinutes,
    excessBreakHhMm,
    excessBreakDisplay,
    calculationMode: mode,
    inputMode: 'worked_time',
    workedSeconds: rawSeconds,
    dayType,
    shiftHalf,
    effectiveStartTime,
    effectiveEndTime,
    effectiveShiftLabel,
    actualLoginTime: actualStartTime,
    actualLoginTimeFormatted,
    expectedLogoutTime,
    lateMinutes,
    attendanceStatus,
    attendanceStatusLabel,
    scheduledStartTime: scheduledStartTimeFormatted,
    scheduledEndTime: scheduledEndTimeFormatted,
    breakTakenTotalSeconds,
    breakLeftTotalSeconds,
    workedTotalSeconds,
    workLeftTotalSeconds,
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
  const rules = getShiftRules(shift, dayType);
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
  const rules = getShiftRules(shift, dayType);

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
