import React, { useState } from 'react';
import { SHIFT_OPTIONS } from './constants/shifts';
import type { CalculationResult, TimeCalculationMode, DayType, ShiftHalf } from './types/shift';
import {
  parseTimeToMinutes,
  calculateLiveShiftBreak,
  calculateBreak,
} from './utils/timeCalculations';
import { Header } from './components/Header';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { TestScenariosModal } from './components/TestScenariosModal';

export const App: React.FC = () => {
  // Clean initial state with NO default values, default full day
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [dayType, setDayType] = useState<DayType>('full_day');
  const [shiftHalf, setShiftHalf] = useState<ShiftHalf>('first_half');
  const [workedHours, setWorkedHours] = useState<string>('');
  const [workedMinutes, setWorkedMinutes] = useState<string>('');
  const [workedSeconds, setWorkedSeconds] = useState<string>('');
  const [calculationMode, setCalculationMode] = useState<TimeCalculationMode>('current_time');
  const [customLogoutTime, setCustomLogoutTime] = useState<string>('');
  const [animationKey, setAnimationKey] = useState<number>(0);

  // Result starts as null so initially only the first card/table is displayed
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Mobile navigation state: initially 'form' (Table 1), toggles to 'results' (Table 2) upon calculation
  const [mobileView, setMobileView] = useState<'form' | 'results'>('form');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);

  // Form submission / calculation trigger
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedShiftId) {
      setErrorMessage('Please select a shift from the dropdown.');
      return;
    }

    const shift = SHIFT_OPTIONS.find((s) => s.id === selectedShiftId);
    if (!shift) {
      setErrorMessage('Selected shift is invalid. Please pick a valid shift.');
      return;
    }

    if (!workedHours.trim() && !workedMinutes.trim()) {
      setErrorMessage('Please enter worked hours (HH) and minutes (MM).');
      return;
    }

    const h = parseInt(workedHours || '0', 10);
    const m = parseInt(workedMinutes || '0', 10);
    const s = workedSeconds.trim() ? parseInt(workedSeconds, 10) : 0;

    if (isNaN(h) || h < 0 || h > 24) {
      setErrorMessage('Hours must be a 2-digit number between 00 and 24.');
      return;
    }
    if (isNaN(m) || m < 0 || m > 59) {
      setErrorMessage('Minutes must be a 2-digit number between 00 and 59.');
      return;
    }
    if (isNaN(s) || s < 0 || s > 59) {
      setErrorMessage('Seconds must be a 2-digit number between 00 and 59.');
      return;
    }

    const totalMinutes = h * 60 + m + s / 60;

    let refClock24: string | undefined = undefined;
    if (calculationMode === 'logout_time') {
      if (!customLogoutTime.trim()) {
        setErrorMessage('Please enter your logout time (e.g. 10:15 PM or 22:15).');
        return;
      }
      const parsedLogout = parseTimeToMinutes(customLogoutTime);
      if (!parsedLogout.isValid || parsedLogout.minutes === undefined) {
        setErrorMessage(parsedLogout.error || 'Please enter a valid logout time (e.g. 10:15 PM).');
        return;
      }
      const logoutHours = Math.floor(parsedLogout.minutes / 60);
      const logoutMins = parsedLogout.minutes % 60;
      refClock24 = `${String(logoutHours).padStart(2, '0')}:${String(logoutMins).padStart(2, '0')}`;
    }

    setErrorMessage(null);

    // Calculate break results from worked time (supporting optional seconds, day type, and shift half)
    const calculated = calculateLiveShiftBreak(
      shift,
      totalMinutes,
      refClock24,
      calculationMode,
      s,
      dayType,
      shiftHalf
    );
    setResult(calculated);

    // Switch mobile view to show ONLY 2nd table
    setMobileView('results');
    setAnimationKey((prev) => prev + 1);
  };

  // Preset helper for test modal
  const handleApplyPreset = (
    shiftId: string,
    workedTimeStr: string,
    presetDayType: DayType = 'full_day',
    presetShiftHalf: ShiftHalf = 'first_half'
  ) => {
    setSelectedShiftId(shiftId);
    setDayType(presetDayType);
    setShiftHalf(presetShiftHalf);
    setErrorMessage(null);

    const parts = workedTimeStr.split(':');
    setWorkedHours(parts[0] || '');
    setWorkedMinutes(parts[1] || '');
    setWorkedSeconds(parts[2] || '');

    const shift = SHIFT_OPTIONS.find((s) => s.id === shiftId);
    if (shift) {
      const parsed = parseTimeToMinutes(workedTimeStr);
      if (parsed.isValid && parsed.minutes !== undefined) {
        const res = calculateBreak(shift, parsed.minutes, presetDayType, presetShiftHalf);
        setResult(res);
        setMobileView('results');
        setAnimationKey((prev) => prev + 1);
      }
    }
  };

  const handleReset = () => {
    setSelectedShiftId('');
    setDayType('full_day');
    setShiftHalf('first_half');
    setWorkedHours('');
    setWorkedMinutes('');
    setWorkedSeconds('');
    setCustomLogoutTime('');
    setCalculationMode('current_time');
    setErrorMessage(null);
    setResult(null);
    setMobileView('form');
    setAnimationKey((prev) => prev + 1);
  };

  const isCalculated = result !== null;

  return (
    <div
      className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 overflow-x-hidden text-slate-100 font-sans bg-[url('/mobile_background.png')] lg:bg-[url('/background.png')]"
    >
      {/* Dark Ambient Layer */}
      <div className="absolute inset-0 bg-black/45 backdrop-brightness-[0.92] pointer-events-none" />

      {/* Top Right Calligraphy: "Good Breaks Better Work" */}
      <div className="absolute top-6 right-8 pointer-events-none hidden md:block z-10 text-right select-none">
        <div className="font-script text-[#00e599] text-3xl sm:text-4xl font-bold leading-tight rotate-[-4deg] tracking-tight drop-shadow-[0_0_15px_rgba(0,229,153,0.35)]">
          Good Breaks
        </div>
        <div className="font-script text-[#00e599] text-3xl sm:text-4xl font-bold leading-tight rotate-[-4deg] tracking-tight relative inline-block drop-shadow-[0_0_15px_rgba(0,229,153,0.35)]">
          Better Work
          <svg
            className="absolute -bottom-1.5 right-0 w-24 text-[#00e599] overflow-visible"
            viewBox="0 0 100 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          >
            <path d="M 5,5 Q 50,20 95,5" />
          </svg>
        </div>
      </div>

      {/* Left Inspiring Quote Overlay */}
      <div className="absolute left-8 lg:left-12 top-1/2 -translate-y-1/2 max-w-[190px] hidden xl:block z-10 pointer-events-none select-none">
        <p className="text-sm font-semibold text-slate-200/90 leading-relaxed tracking-wide drop-shadow-md">
          A short break <br />
          today, <br />
          a better you <br />
          tomorrow.
        </p>
        <div className="w-8 h-1 bg-[#00e599] rounded-full mt-3 shadow-[0_0_10px_rgba(0,229,153,0.7)]" />
      </div>

      {/* Main Content Area */}
      <div
        className={`relative z-20 w-full transition-all duration-600 ease-out ${
          isCalculated ? 'max-w-5xl xl:max-w-6xl' : 'max-w-[460px]'
        }`}
      >
        {/* Top Header Bar */}
        <Header onReset={handleReset} onOpenTestModal={() => setIsTestModalOpen(true)} />

        {/* ============================================================== */}
        {/* DESKTOP LAYOUT (lg:grid): Card 1 + Card 2 (Exact Same Height) */}
        {/* ============================================================== */}
        {isCalculated ? (
          <div className="hidden lg:grid grid-cols-12 gap-6 items-stretch w-full">
            {/* Card 1: Calculator Form (Locked to exact same height as Card 2 via grid stretch + min-h-[580px]) */}
            <div className="col-span-5 bg-[#0d1921]/95 backdrop-blur-2xl border border-slate-700/60 rounded-[28px] p-6 sm:p-7 shadow-2xl flex flex-col justify-between h-full min-h-[580px] transition-all duration-300">
              <CalculatorForm
                selectedShiftId={selectedShiftId}
                onSelectShift={(id) => {
                  setSelectedShiftId(id);
                  if (errorMessage) setErrorMessage(null);
                }}
                dayType={dayType}
                onChangeDayType={(dt) => {
                  setDayType(dt);
                  if (errorMessage) setErrorMessage(null);
                }}
                shiftHalf={shiftHalf}
                onChangeShiftHalf={(sh) => {
                  setShiftHalf(sh);
                  if (errorMessage) setErrorMessage(null);
                }}
                workedHours={workedHours}
                onChangeWorkedHours={(val) => {
                  setWorkedHours(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                workedMinutes={workedMinutes}
                onChangeWorkedMinutes={(val) => {
                  setWorkedMinutes(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                workedSeconds={workedSeconds}
                onChangeWorkedSeconds={(val) => {
                  setWorkedSeconds(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                calculationMode={calculationMode}
                onChangeCalculationMode={(mode) => {
                  setCalculationMode(mode);
                  if (errorMessage) setErrorMessage(null);
                }}
                customLogoutTime={customLogoutTime}
                onChangeCustomLogoutTime={(val) => {
                  setCustomLogoutTime(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                onSubmit={handleCalculate}
                errorMessage={errorMessage}
              />
            </div>

            {/* Card 2: Status Results (Locked to exact same height as Card 1 via grid stretch + min-h-[580px]) */}
            <div className="col-span-7 flex flex-col h-full min-h-[580px] animate-desktop-reveal">
              <ResultsDisplay
                result={result}
                animationKey={animationKey}
                onQuickSelect={handleApplyPreset}
              />
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex justify-center w-full">
            {/* Card 1 Alone (Centered before calculation) */}
            <div className="w-[460px] bg-[#0d1921]/95 backdrop-blur-2xl border border-slate-700/60 rounded-[28px] p-6 sm:p-7 shadow-2xl flex flex-col justify-between transition-all duration-300">
              <CalculatorForm
                selectedShiftId={selectedShiftId}
                onSelectShift={(id) => {
                  setSelectedShiftId(id);
                  if (errorMessage) setErrorMessage(null);
                }}
                dayType={dayType}
                onChangeDayType={(dt) => {
                  setDayType(dt);
                  if (errorMessage) setErrorMessage(null);
                }}
                shiftHalf={shiftHalf}
                onChangeShiftHalf={(sh) => {
                  setShiftHalf(sh);
                  if (errorMessage) setErrorMessage(null);
                }}
                workedHours={workedHours}
                onChangeWorkedHours={(val) => {
                  setWorkedHours(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                workedMinutes={workedMinutes}
                onChangeWorkedMinutes={(val) => {
                  setWorkedMinutes(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                workedSeconds={workedSeconds}
                onChangeWorkedSeconds={(val) => {
                  setWorkedSeconds(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                calculationMode={calculationMode}
                onChangeCalculationMode={(mode) => {
                  setCalculationMode(mode);
                  if (errorMessage) setErrorMessage(null);
                }}
                customLogoutTime={customLogoutTime}
                onChangeCustomLogoutTime={(val) => {
                  setCustomLogoutTime(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                onSubmit={handleCalculate}
                errorMessage={errorMessage}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MOBILE LAYOUT (< lg): Show ONLY 1 Card at a time               */}
        {/* ============================================================== */}
        <div className="lg:hidden w-full">
          {/* When in 'form' view: Show ONLY 1st Table */}
          {mobileView === 'form' && (
            <div className="w-full bg-[#0d1921]/95 backdrop-blur-2xl border border-slate-700/60 rounded-[28px] p-6 shadow-2xl flex flex-col justify-between animate-mobile-slide-right">
              <CalculatorForm
                selectedShiftId={selectedShiftId}
                onSelectShift={(id) => {
                  setSelectedShiftId(id);
                  if (errorMessage) setErrorMessage(null);
                }}
                dayType={dayType}
                onChangeDayType={(dt) => {
                  setDayType(dt);
                  if (errorMessage) setErrorMessage(null);
                }}
                shiftHalf={shiftHalf}
                onChangeShiftHalf={(sh) => {
                  setShiftHalf(sh);
                  if (errorMessage) setErrorMessage(null);
                }}
                workedHours={workedHours}
                onChangeWorkedHours={(val) => {
                  setWorkedHours(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                workedMinutes={workedMinutes}
                onChangeWorkedMinutes={(val) => {
                  setWorkedMinutes(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                workedSeconds={workedSeconds}
                onChangeWorkedSeconds={(val) => {
                  setWorkedSeconds(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                calculationMode={calculationMode}
                onChangeCalculationMode={(mode) => {
                  setCalculationMode(mode);
                  if (errorMessage) setErrorMessage(null);
                }}
                customLogoutTime={customLogoutTime}
                onChangeCustomLogoutTime={(val) => {
                  setCustomLogoutTime(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                onSubmit={handleCalculate}
                errorMessage={errorMessage}
              />
            </div>
          )}

          {/* When in 'results' view: Show ONLY 2nd Table */}
          {mobileView === 'results' && isCalculated && (
            <div className="w-full animate-mobile-slide-left">
              <ResultsDisplay
                result={result}
                animationKey={animationKey}
                onQuickSelect={handleApplyPreset}
                onBackToForm={() => setMobileView('form')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Test Scenarios Verification Modal */}
      <TestScenariosModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onApplyScenario={handleApplyPreset}
      />
    </div>
  );
};

export default App;
