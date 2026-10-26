import { SHIFT_OPTIONS } from '../constants/shifts';
import { parseTimeToMinutes, calculateBreak, validateWorkedMinutesForShift } from './timeCalculations';

interface TestCase {
  shiftLabel: string;
  isGBJ: boolean;
  workedTime: string;
  expectedBreakTaken: string;
  expectedBreakLeft: string;
}

const testCases: TestCase[] = [
  { shiftLabel: 'Regular', isGBJ: false, workedTime: '08:00', expectedBreakTaken: '00:00', expectedBreakLeft: '01:00' },
  { shiftLabel: 'Regular', isGBJ: false, workedTime: '08:30', expectedBreakTaken: '00:00', expectedBreakLeft: '01:00' },
  { shiftLabel: 'Regular', isGBJ: false, workedTime: '08:50', expectedBreakTaken: '00:20', expectedBreakLeft: '00:40' },
  { shiftLabel: 'Regular', isGBJ: false, workedTime: '09:00', expectedBreakTaken: '00:30', expectedBreakLeft: '00:30' },
  { shiftLabel: 'Regular', isGBJ: false, workedTime: '09:30', expectedBreakTaken: '01:00', expectedBreakLeft: '00:00' },
  { shiftLabel: 'GBJ', isGBJ: true, workedTime: '05:00', expectedBreakTaken: '00:00', expectedBreakLeft: '01:00' },
  { shiftLabel: 'GBJ', isGBJ: true, workedTime: '06:00', expectedBreakTaken: '00:00', expectedBreakLeft: '01:00' },
  { shiftLabel: 'GBJ', isGBJ: true, workedTime: '06:20', expectedBreakTaken: '00:20', expectedBreakLeft: '00:40' },
  { shiftLabel: 'GBJ', isGBJ: true, workedTime: '06:30', expectedBreakTaken: '00:30', expectedBreakLeft: '00:30' },
  { shiftLabel: 'GBJ', isGBJ: true, workedTime: '07:00', expectedBreakTaken: '01:00', expectedBreakLeft: '00:00' },
];

export function runAllTestCases() {
  const regularShift = SHIFT_OPTIONS.find(s => !s.isGBJ)!;
  const gbjShift = SHIFT_OPTIONS.find(s => s.isGBJ)!;

  let allPassed = true;
  console.log('Running Break Calculator Validation Suite:');

  for (const tc of testCases) {
    const shift = tc.isGBJ ? gbjShift : regularShift;
    const parsed = parseTimeToMinutes(tc.workedTime);
    if (!parsed.isValid || parsed.minutes === undefined) {
      console.error(`FAIL: Could not parse ${tc.workedTime}`);
      allPassed = false;
      continue;
    }

    const val = validateWorkedMinutesForShift(parsed.minutes, shift);
    if (!val.isValid) {
      console.error(`FAIL: Validation rejected valid time ${tc.workedTime}`);
      allPassed = false;
      continue;
    }

    const result = calculateBreak(shift, parsed.minutes);
    const passed =
      result.breakTakenFormatted === tc.expectedBreakTaken &&
      result.breakLeftFormatted === tc.expectedBreakLeft;

    if (!passed) {
      console.error(
        `FAIL [${tc.shiftLabel} ${tc.workedTime}]: Expected Taken=${tc.expectedBreakTaken}, Left=${tc.expectedBreakLeft}. Got Taken=${result.breakTakenFormatted}, Left=${result.breakLeftFormatted}`
      );
      allPassed = false;
    } else {
      console.log(
        `PASS: [${tc.shiftLabel.padEnd(7)}] ${tc.workedTime} -> Taken: ${result.breakTakenFormatted}, Left: ${result.breakLeftFormatted}, Usage: ${result.percentageUsed}%`
      );
    }
  }

  // Edge cases
  const regularOvertime = parseTimeToMinutes('09:40');
  const regOverVal = validateWorkedMinutesForShift(regularOvertime.minutes!, regularShift);
  if (!regOverVal.isValid) {
    console.log('PASS: Regular overtime rejected correctly:', regOverVal.error);
  } else {
    console.error('FAIL: Regular overtime not rejected!');
    allPassed = false;
  }

  const gbjOvertime = parseTimeToMinutes('07:15');
  const gbjOverVal = validateWorkedMinutesForShift(gbjOvertime.minutes!, gbjShift);
  if (!gbjOverVal.isValid) {
    console.log('PASS: GBJ overtime rejected correctly:', gbjOverVal.error);
  } else {
    console.error('FAIL: GBJ overtime not rejected!');
    allPassed = false;
  }

  return allPassed;
}

runAllTestCases();
