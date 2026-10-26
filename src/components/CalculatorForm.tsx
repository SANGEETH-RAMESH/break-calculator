import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Clock, ArrowRight, X, AlertCircle, ChevronDown, Coffee } from 'lucide-react';
import { SHIFT_OPTIONS } from '../constants/shifts';
import type { TimeCalculationMode } from '../types/shift';
import { getCurrentClockTime24, formatMinutesToClockTime12h } from '../utils/timeCalculations';

interface CalculatorFormProps {
  selectedShiftId: string;
  onSelectShift: (shiftId: string) => void;
  workedHours: string;
  onChangeWorkedHours: (val: string) => void;
  workedMinutes: string;
  onChangeWorkedMinutes: (val: string) => void;
  workedSeconds: string;
  onChangeWorkedSeconds: (val: string) => void;
  calculationMode: TimeCalculationMode;
  onChangeCalculationMode: (mode: TimeCalculationMode) => void;
  customLogoutTime: string;
  onChangeCustomLogoutTime: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  errorMessage: string | null;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  selectedShiftId,
  onSelectShift,
  workedHours,
  onChangeWorkedHours,
  workedMinutes,
  onChangeWorkedMinutes,
  workedSeconds,
  onChangeWorkedSeconds,
  calculationMode,
  onChangeCalculationMode,
  customLogoutTime,
  onChangeCustomLogoutTime,
  onSubmit,
  errorMessage,
}) => {
  const [currentClock, setCurrentClock] = useState<string>(getCurrentClockTime24());
  const [isBtnClicked, setIsBtnClicked] = useState(false);

  // Input refs for seamless auto-advance and backspace navigation
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const secondsInputRef = useRef<HTMLInputElement>(null);

  // Update live clock every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClock(getCurrentClockTime24());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const selectedShift = SHIFT_OPTIONS.find((s) => s.id === selectedShiftId);

  const liveDisplayTime = (() => {
    const [h, m] = currentClock.split(':').map(Number);
    return formatMinutesToClockTime12h(h * 60 + m);
  })();

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

  // Keyboard navigation (Backspace backwards, Arrow keys)
  const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowRight' && minutesInputRef.current) {
      minutesInputRef.current.focus();
    }
  };

  const handleMinutesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !workedMinutes && hoursInputRef.current) {
      hoursInputRef.current.focus();
    } else if (e.key === 'ArrowLeft' && hoursInputRef.current) {
      hoursInputRef.current.focus();
    } else if (e.key === 'ArrowRight' && secondsInputRef.current) {
      secondsInputRef.current.focus();
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
    <form onSubmit={handleFormSubmit} className="h-full flex-1 flex flex-col justify-between gap-6" noValidate>
      <div className="space-y-5">
        {/* Step 1: Select Shift */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#00e599] text-slate-950 font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
              1
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Select Shift</h3>
              <p className="text-[11px] text-slate-400">Choose your working shift</p>
            </div>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="relative flex items-center bg-[#11202b] border border-slate-700/80 rounded-xl px-3.5 py-3 shadow-inner hover:border-slate-600 focus-within:ring-2 focus-within:ring-[#00e599]/30 focus-within:border-[#00e599] transition-all">
              <Calendar className="w-4 h-4 text-[#00e599] mr-3 flex-shrink-0" />
              <select
                id="shift-select"
                value={selectedShiftId}
                onChange={(e) => onSelectShift(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-400 focus:outline-none appearance-none pr-8 cursor-pointer"
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

            {/* Shift Rules Info Badge */}
            {selectedShift && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 px-1 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e599] flex-shrink-0" />
                <span>
                  {selectedShift.isGBJ ? (
                    <>
                      <strong className="text-[#00e599] font-bold">GBJ Shift:</strong> 7h total (6h work required, 1h break)
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
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#00e599] text-slate-950 font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
              2
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Worked Time</h3>
              <p className="text-[11px] text-slate-400">Enter total time actually worked</p>
            </div>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {/* 3-Segment Input: Hours (2 digits), Minutes (2 digits), Seconds (2 digits, optional) */}
            <div className="relative flex items-center justify-between bg-[#11202b] border border-slate-700/80 rounded-xl px-3 sm:px-4 py-2.5 shadow-inner hover:border-slate-600 focus-within:ring-2 focus-within:ring-[#00e599]/30 focus-within:border-[#00e599] transition-all">
              <div className="flex items-center gap-2 sm:gap-3">
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
                    className="w-11 sm:w-12 text-center bg-[#0c1822] border border-slate-700/70 rounded-lg py-1 text-sm sm:text-base font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#00e599] focus:ring-1 focus:ring-[#00e599] font-mono tracking-wider transition-all"
                    autoComplete="off"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 font-medium select-none">
                    Hours
                  </span>
                </div>

                <span className="text-base sm:text-lg font-bold text-slate-500 self-center mb-4 select-none">
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
                    className="w-11 sm:w-12 text-center bg-[#0c1822] border border-slate-700/70 rounded-lg py-1 text-sm sm:text-base font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#00e599] focus:ring-1 focus:ring-[#00e599] font-mono tracking-wider transition-all"
                    autoComplete="off"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 font-medium select-none">
                    Mins
                  </span>
                </div>

                <span className="text-base sm:text-lg font-bold text-slate-500 self-center mb-4 select-none">
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
                    className="w-11 sm:w-12 text-center bg-[#0c1822] border border-slate-700/70 rounded-lg py-1 text-sm sm:text-base font-bold text-white placeholder-slate-600 focus:outline-none focus:border-[#00e599] focus:ring-1 focus:ring-[#00e599] font-mono tracking-wider transition-all"
                    autoComplete="off"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 font-medium select-none">
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
                <span className="text-slate-500">(e.g. 08:27 or 08:27:30)</span>
              </span>
              <span className="text-slate-500 text-[10px]">Seconds optional</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Clock reference + Action button */}
      <div className="space-y-3.5 pt-2">
        {/* Live Clock / Logout Time Controls */}
        <div className="bg-[#0f1d27] border border-slate-700/60 rounded-xl p-2.5 sm:p-3 space-y-2">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00e599] animate-pulse" />
              Current Time: <strong className="text-white ml-0.5">{liveDisplayTime}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChangeCalculationMode('current_time')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  calculationMode === 'current_time'
                    ? 'bg-[#00e599] text-slate-950 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Use Live
              </button>
              <button
                type="button"
                onClick={() => onChangeCalculationMode('logout_time')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  calculationMode === 'logout_time'
                    ? 'bg-[#00e599] text-slate-950 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom Logout
              </button>
            </div>
          </div>

          {/* Custom Logout Time Input */}
          {calculationMode === 'logout_time' && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
              <label htmlFor="custom-logout-input" className="text-[11px] font-semibold text-slate-300 whitespace-nowrap">
                Logout Time:
              </label>
              <input
                id="custom-logout-input"
                type="text"
                value={customLogoutTime}
                onChange={(e) => onChangeCustomLogoutTime(e.target.value)}
                placeholder="e.g. 10:15 PM or 22:15"
                className="bg-[#09151e] border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00e599] flex-1 font-mono"
              />
            </div>
          )}
        </div>

        {/* Validation Error Message */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 px-3 py-2 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl text-xs font-medium animate-smooth-in"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button: Check Break */}
        <button
          type="submit"
          id="check-break-button"
          className={`w-full bg-[#00e599] hover:bg-[#00d68f] active:scale-[0.98] text-slate-950 font-extrabold py-3.5 px-6 rounded-2xl shadow-[0_0_24px_rgba(0,229,153,0.35)] transition-all duration-200 flex items-center justify-between group cursor-pointer ${
            isBtnClicked ? 'scale-[0.98] brightness-110' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Coffee className="w-5 h-5 text-slate-950 transition-transform group-hover:scale-110" />
            <span className="text-sm font-extrabold tracking-wide text-slate-950">Check Break</span>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-950 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </form>
  );
};

export default CalculatorForm;
