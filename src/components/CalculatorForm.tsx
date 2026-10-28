import React, { useRef, useState } from 'react';
import { Calendar, Clock, ArrowRight, X, AlertCircle, ChevronDown, Coffee, Sun, Sunset, LogIn, Timer } from 'lucide-react';
import { SHIFT_OPTIONS, getShiftRules } from '../constants/shifts';
import type { DayType, ShiftHalf } from '../types/shift';
import {
  formatMinutesToClockTime12h,
  getHalfDayShiftTimes,
  addMinutesToClock24,
  parseTimeTo24h,
  calculateElapsedMinutesBetween,
} from '../utils/timeCalculations';

interface CalculatorFormProps {
  selectedShiftId: string;
  onSelectShift: (shiftId: string) => void;
  dayType: DayType;
  onChangeDayType: (val: DayType) => void;
  shiftHalf: ShiftHalf;
  onChangeShiftHalf: (val: ShiftHalf) => void;
  customLoginTime: string;
  onChangeCustomLoginTime: (val: string) => void;
  workedHours: string;
  onChangeWorkedHours: (val: string) => void;
  workedMinutes: string;
  onChangeWorkedMinutes: (val: string) => void;
  workedSeconds: string;
  onChangeWorkedSeconds: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  errorMessage: string | null;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  selectedShiftId,
  onSelectShift,
  dayType,
  onChangeDayType,
  shiftHalf,
  onChangeShiftHalf,
  customLoginTime,
  onChangeCustomLoginTime,
  workedHours,
  onChangeWorkedHours,
  workedMinutes,
  onChangeWorkedMinutes,
  workedSeconds,
  onChangeWorkedSeconds,
  onSubmit,
  errorMessage,
}) => {
  const [isBtnClicked, setIsBtnClicked] = useState(false);

  // Input refs for seamless auto-advance and backspace navigation
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const secondsInputRef = useRef<HTMLInputElement>(null);

  const selectedShift = SHIFT_OPTIONS.find((s) => s.id === selectedShiftId);

  const firstHalfTimes = selectedShift ? getHalfDayShiftTimes(selectedShift, 'first_half') : null;
  const secondHalfTimes = selectedShift ? getHalfDayShiftTimes(selectedShift, 'second_half') : null;

  // Scheduled Shift Start & Duration
  const scheduledStart24 = (dayType === 'half_day' && (shiftHalf === 'first_half' ? firstHalfTimes : secondHalfTimes))
    ? (shiftHalf === 'first_half' ? firstHalfTimes!.startTime : secondHalfTimes!.startTime)
    : (selectedShift?.startTime || '09:00');

  const currentRules = selectedShift ? getShiftRules(selectedShift, dayType) : null;
  const shiftDuration = currentRules?.shiftDurationMinutes || 540;

  // Actual login 24h & formatted
  const actualLogin24 = customLoginTime.trim()
    ? (parseTimeTo24h(customLoginTime.trim()) || scheduledStart24)
    : scheduledStart24;

  const [aH, aM] = actualLogin24.split(':').map(Number);
  const actualLogin12 = formatMinutesToClockTime12h(aH * 60 + aM);

  const [sH, sM] = scheduledStart24.split(':').map(Number);
  const scheduledStart12 = formatMinutesToClockTime12h(sH * 60 + sM);

  const scheduledEnd24 = (dayType === 'half_day' && (shiftHalf === 'first_half' ? firstHalfTimes : secondHalfTimes))
    ? (shiftHalf === 'first_half' ? firstHalfTimes!.endTime : secondHalfTimes!.endTime)
    : (selectedShift?.endTime || '18:00');

  const lateMinutesDiff = calculateElapsedMinutesBetween(scheduledStart24, actualLogin24);
  const isLate = lateMinutesDiff > 0 && lateMinutesDiff < 720;

  let attendanceStatus: 'on_time' | 'late_reporting' | 'late_login' = 'on_time';
  if (isLate && lateMinutesDiff > 15) {
    attendanceStatus = 'late_login';
  } else if (isLate && lateMinutesDiff >= 3) {
    attendanceStatus = 'late_reporting';
  } else {
    attendanceStatus = 'on_time';
  }

  // If late <= 2 min (on time / grace period): logout at scheduled end (e.g. 1:02 PM -> 10:30 PM)
  // If late 3-15 min (late reporting): logout shifted by late minutes (e.g. 1:03 PM -> 10:33 PM)
  // If late > 15 min (late login): logout is actual login + shift duration
  const expectedLogout24 = (attendanceStatus === 'on_time')
    ? scheduledEnd24
    : addMinutesToClock24(actualLogin24, shiftDuration);

  const [eH, eM] = expectedLogout24.split(':').map(Number);
  const expectedLogout12 = formatMinutesToClockTime12h(eH * 60 + eM);

  const handleFormSubmit = (e: React.FormEvent) => {
    setIsBtnClicked(true);
    setTimeout(() => setIsBtnClicked(false), 300);
    onSubmit(e);
  };

  // Smart segmented input handlers
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    onChangeWorkedHours(raw);
    if (raw.length === 2 && minutesInputRef.current) {
      minutesInputRef.current.focus();
      minutesInputRef.current.select();
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    onChangeWorkedMinutes(raw);
    if (raw.length === 2 && secondsInputRef.current) {
      secondsInputRef.current.focus();
      secondsInputRef.current.select();
    }
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    onChangeWorkedSeconds(raw);
  };

  // Keyboard navigation: Space or Enter in Hours advances to Minutes
  const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') && minutesInputRef.current) {
      e.preventDefault();
      minutesInputRef.current.focus();
      minutesInputRef.current.select();
    }
  };

  const handleMinutesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !workedMinutes && hoursInputRef.current) {
      hoursInputRef.current.focus();
    } else if (e.key === 'ArrowLeft' && hoursInputRef.current) {
      hoursInputRef.current.focus();
    } else if ((e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') && secondsInputRef.current) {
      e.preventDefault();
      secondsInputRef.current.focus();
      secondsInputRef.current.select();
    }
  };

  const handleSecondsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !workedSeconds && minutesInputRef.current) {
      minutesInputRef.current.focus();
    } else if (e.key === 'ArrowLeft' && minutesInputRef.current) {
      minutesInputRef.current.focus();
    }
  };

  // Smart paste handler (e.g. "08:27" or "08:27:30")
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    const parts = pasted.split(':').map((p) => p.replace(/\D/g, '').slice(0, 2));

    if (parts.length >= 1 && parts[0]) onChangeWorkedHours(parts[0]);
    if (parts.length >= 2 && parts[1]) onChangeWorkedMinutes(parts[1]);
    if (parts.length >= 3 && parts[2]) onChangeWorkedSeconds(parts[2]);

    if (parts.length >= 2 && secondsInputRef.current) {
      secondsInputRef.current.focus();
    } else if (minutesInputRef.current) {
      minutesInputRef.current.focus();
    }
  };

  const handleClearTime = () => {
    onChangeWorkedHours('');
    onChangeWorkedMinutes('');
    onChangeWorkedSeconds('');
    if (hoursInputRef.current) hoursInputRef.current.focus();
  };

  const hasAnyTimeInput = Boolean(workedHours || workedMinutes || workedSeconds);

  return (
    <form onSubmit={handleFormSubmit} className="h-full flex-1 flex flex-col justify-between gap-3.5" noValidate>
      <div className="space-y-3">
        {/* Step 1: Select Shift & Shift Duration */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#00e599] text-slate-950 font-extrabold text-[11px] flex items-center justify-center flex-shrink-0 shadow-sm">
              1
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight">Select Shift & Duration</h3>
          </div>

          <div className="space-y-2 pt-0.5">
            {/* Shift Select Dropdown */}
            <div className="relative flex items-center bg-[#11202b] border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-inner hover:border-slate-600 focus-within:ring-2 focus-within:ring-[#00e599]/30 focus-within:border-[#00e599] transition-all">
              <Calendar className="w-4 h-4 text-[#00e599] mr-2.5 flex-shrink-0" />
              <select
                id="shift-select"
                value={selectedShiftId}
                onChange={(e) => onSelectShift(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-white placeholder-slate-400 focus:outline-none appearance-none pr-7 cursor-pointer"
              >
                <option value="" disabled className="bg-[#0e1a24] text-slate-400">
                  Select your shift
                </option>
                {SHIFT_OPTIONS.map((shift) => (
                  <option key={shift.id} value={shift.id} className="bg-[#0e1a24] text-slate-100 py-1">
                    {shift.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Day Type Selector: Full Day vs Half Day */}
            <div className="grid grid-cols-2 gap-2 bg-[#0c1822] p-1 rounded-xl border border-slate-700/80">
              <button
                type="button"
                id="daytype-full-btn"
                onClick={() => onChangeDayType('full_day')}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  dayType === 'full_day'
                    ? 'bg-[#00e599] text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Full Day</span>
              </button>
              <button
                type="button"
                id="daytype-half-btn"
                onClick={() => onChangeDayType('half_day')}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  dayType === 'half_day'
                    ? 'bg-[#00e599] text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Sunset className="w-3.5 h-3.5" />
                <span>Half Day</span>
              </button>
            </div>

            {/* If Half Day: Ask First Half vs Second Half */}
            {dayType === 'half_day' && (
              <div className="space-y-1.5 pt-1 animate-smooth-in">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-300">
                    Which Half?
                  </span>
                  <span className="text-[10px] text-[#00e599] font-semibold">
                    {selectedShift?.isGBJ ? '3:30 work + 30m break' : '4:30 work + 30m break'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-[#0c1822] p-1 rounded-xl border border-slate-700/80">
                  <button
                    type="button"
                    id="shifthalf-first-btn"
                    onClick={() => onChangeShiftHalf('first_half')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                      shiftHalf === 'first_half'
                        ? 'bg-[#00e599] text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="font-extrabold text-xs">First Half</span>
                    {firstHalfTimes && (
                      <span className={`text-[10px] mt-0.5 leading-tight ${shiftHalf === 'first_half' ? 'text-slate-950 font-semibold' : 'text-slate-500'}`}>
                        {firstHalfTimes.label.replace(' (1st Half)', '')}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    id="shifthalf-second-btn"
                    onClick={() => onChangeShiftHalf('second_half')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                      shiftHalf === 'second_half'
                        ? 'bg-[#00e599] text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="font-extrabold text-xs">Second Half</span>
                    {secondHalfTimes && (
                      <span className={`text-[10px] mt-0.5 leading-tight ${shiftHalf === 'second_half' ? 'text-slate-950 font-semibold' : 'text-slate-500'}`}>
                        {secondHalfTimes.label.replace(' (2nd Half)', '')}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Custom Login Time Input (Only custom entering, no preset buttons) */}
            {selectedShift && (
              <div className="bg-[#0c1822] border border-slate-700/80 rounded-xl p-3 space-y-2 animate-smooth-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
                    <LogIn className="w-4 h-4 text-[#00e599]" />
                    <span>Actual Login Time</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Scheduled: <strong className="text-white">{scheduledStart12}</strong>
                  </span>
                </div>

                {/* Direct Custom Time Input */}
                <div className="relative flex items-center bg-[#11202b] border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-inner focus-within:ring-2 focus-within:ring-[#00e599]/30 focus-within:border-[#00e599] transition-all">
                  <Timer className="w-4 h-4 text-[#00e599] mr-2 flex-shrink-0" />
                  <input
                    id="custom-login-input"
                    type="text"
                    value={customLoginTime}
                    onChange={(e) => onChangeCustomLoginTime(e.target.value)}
                    placeholder={`e.g. ${scheduledStart12} or 1:03 PM`}
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-white placeholder-slate-500 focus:outline-none font-mono"
                    autoComplete="off"
                  />
                  {customLoginTime && (
                    <button
                      type="button"
                      onClick={() => onChangeCustomLoginTime('')}
                      className="text-slate-400 hover:text-white text-xs p-1 rounded-lg hover:bg-slate-800 cursor-pointer ml-1.5 flex-shrink-0"
                      title="Clear custom login (revert to scheduled)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Real-time Dynamic Status Pill */}
                <div className="bg-[#11202b]/90 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-slate-300">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>Login: <strong className="text-white">{actualLogin12}</strong></span>
                    {attendanceStatus === 'on_time' ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                        {lateMinutesDiff > 0 ? `On Time (${lateMinutesDiff}m Grace)` : 'On Time'}
                      </span>
                    ) : attendanceStatus === 'late_reporting' ? (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/90 border border-amber-700 px-2 py-0.5 rounded-full">
                        Late Reporting (+{lateMinutesDiff}m)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-300 bg-rose-950/90 border border-rose-800 px-2 py-0.5 rounded-full">
                        Late Login (+{lateMinutesDiff}m)
                      </span>
                    )}
                  </div>

                  <div>
                    Logout:{' '}
                    <strong className="text-[#00e599] font-extrabold text-xs sm:text-sm">
                      {expectedLogout12}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Shift Rules Info Badge */}
            {selectedShift && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 px-1 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e599] flex-shrink-0" />
                <span>
                  {dayType === 'half_day' ? (
                    selectedShift.isGBJ ? (
                      <>
                        <strong className="text-[#00e599] font-bold">
                          GBJ Half Day ({shiftHalf === 'first_half' ? '1st Half' : '2nd Half'}):
                        </strong>{' '}
                        4h total (3h 30m work required, 30m break)
                      </>
                    ) : (
                      <>
                        <strong className="text-[#00e599] font-bold">
                          Half Day ({shiftHalf === 'first_half' ? '1st Half' : '2nd Half'}):
                        </strong>{' '}
                        5h total (4h 30m work required, 30m break)
                      </>
                    )
                  ) : selectedShift.isGBJ ? (
                    <>
                      <strong className="text-[#00e599] font-bold">Great Break Job (GBJ):</strong> 7h total (6h 30m work required, 30m break)
                    </>
                  ) : (selectedShift.allowedBreakMinutes === 30 || selectedShift.id === 'shift-1' || selectedShift.id === 'shift-2' || selectedShift.id === 'shift-9') ? (
                    <>
                      <strong className="text-[#00e599] font-bold">Regular Shift:</strong> 9h total (8h 30m work required, 30m break)
                    </>
                  ) : (
                    <>
                      <strong className="text-[#00e599] font-bold">Regular Shift:</strong> 9h 30m total (8h 30m work required, 1h break)
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Worked Time (Hours, Minutes, Seconds Optional) */}
        {/* Step 2: Worked Time (Hours, Minutes, Seconds Optional) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#00e599] text-slate-950 font-extrabold text-[11px] flex items-center justify-center flex-shrink-0 shadow-sm">
              2
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight">Worked Time</h3>
          </div>

          <div className="space-y-1.5">
            {/* 3-Segment Input: Hours (2 digits), Minutes (2 digits), Seconds (2 digits, optional) */}
            <div className="relative flex items-center justify-between bg-[#11202b] border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-inner hover:border-slate-600 focus-within:ring-2 focus-within:ring-[#00e599]/30 focus-within:border-[#00e599] transition-all">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Clock className="w-4 h-4 text-[#00e599] flex-shrink-0" />

                {/* Segment: Hours */}
                <div className="flex flex-col items-center">
                  <input
                    ref={hoursInputRef}
                    id="worked-hours-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={workedHours}
                    onChange={handleHoursChange}
                    onKeyDown={handleHoursKeyDown}
                    onPaste={handlePaste}
                    placeholder="HH"
                    className="w-10 sm:w-11 text-center bg-[#0c1822] border border-slate-700/70 rounded-lg py-1 text-sm sm:text-base font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#00e599] focus:ring-1 focus:ring-[#00e599] font-mono tracking-wider transition-all"
                    autoComplete="off"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 font-medium select-none">
                    Hours
                  </span>
                </div>

                <span className="text-base sm:text-lg font-bold text-slate-500 self-center mb-3.5 select-none">
                  :
                </span>

                {/* Segment: Minutes */}
                <div className="flex flex-col items-center">
                  <input
                    ref={minutesInputRef}
                    id="worked-minutes-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={workedMinutes}
                    onChange={handleMinutesChange}
                    onKeyDown={handleMinutesKeyDown}
                    onPaste={handlePaste}
                    placeholder="MM"
                    className="w-10 sm:w-11 text-center bg-[#0c1822] border border-slate-700/70 rounded-lg py-1 text-sm sm:text-base font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#00e599] focus:ring-1 focus:ring-[#00e599] font-mono tracking-wider transition-all"
                    autoComplete="off"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 font-medium select-none">
                    Mins
                  </span>
                </div>

                <span className="text-base sm:text-lg font-bold text-slate-500 self-center mb-3.5 select-none">
                  :
                </span>

                {/* Segment: Seconds (Optional) */}
                <div className="flex flex-col items-center">
                  <input
                    ref={secondsInputRef}
                    id="worked-seconds-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={workedSeconds}
                    onChange={handleSecondsChange}
                    onKeyDown={handleSecondsKeyDown}
                    onPaste={handlePaste}
                    placeholder="SS"
                    className="w-10 sm:w-11 text-center bg-[#0c1822] border border-slate-700/70 rounded-lg py-1 text-sm sm:text-base font-bold text-white placeholder-slate-600 focus:outline-none focus:border-[#00e599] focus:ring-1 focus:ring-[#00e599] font-mono tracking-wider transition-all"
                    autoComplete="off"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 font-medium select-none">
                    Secs (opt)
                  </span>
                </div>
              </div>

              {/* Clear X button */}
              {hasAnyTimeInput && (
                <button
                  type="button"
                  onClick={handleClearTime}
                  className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer flex-shrink-0"
                  aria-label="Clear time inputs"
                  title="Clear inputs"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
              <span>
                Format: <span className="font-semibold text-slate-300">HH : MM : SS</span>{' '}
                <span className="text-slate-500">(Space/Enter advances)</span>
              </span>
              <span className="text-slate-500">Seconds optional</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Action button & error */}
      <div className="space-y-2 pt-1">
        {/* Validation Error Message */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 px-3.5 py-2 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl text-xs font-medium animate-smooth-in"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button: Check Break */}
        <button
          type="submit"
          id="check-break-button"
          className={`w-full bg-[#00e599] hover:bg-[#00d68f] active:scale-[0.98] text-slate-950 font-extrabold py-2.5 sm:py-3 px-5 rounded-xl shadow-[0_0_20px_rgba(0,229,153,0.3)] transition-all duration-200 flex items-center justify-between group cursor-pointer ${
            isBtnClicked ? 'scale-[0.98] brightness-110' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 transition-transform group-hover:scale-110" />
            <span className="text-sm sm:text-base font-extrabold tracking-wide text-slate-950">Check Break</span>
          </div>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </form>
  );
};

export default CalculatorForm;
