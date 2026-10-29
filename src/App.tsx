import React, { useState, useEffect } from 'react';
import { SHIFT_OPTIONS } from './constants/shifts';
import { getCurrentTimePeriod, type TimePeriod } from './constants/timePeriods';
import type { CalculationResult, DayType, ShiftHalf } from './types/shift';
import { calculateLiveShiftBreak } from './utils/timeCalculations';
import { Header } from './components/Header';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { OverbreakModal } from './components/OverbreakModal';
import { BreakReminderCard, type BreakReminderState } from './components/BreakReminderCard';
import { triggerBreakNotification } from './utils/reminderSound';

const DEFAULT_SHIFT_STORAGE_KEY = 'break_calculator_default_shift';
const REMINDER_STORAGE_KEY = 'break_calculator_reminder_config';

export const App: React.FC = () => {
  // Load default shift from localStorage if previously selected
  const [selectedShiftId, setSelectedShiftId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(DEFAULT_SHIFT_STORAGE_KEY);
      if (saved && SHIFT_OPTIONS.some((s) => s.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return '';
  });

  const [dayType, setDayType] = useState<DayType>('full_day');
  const [shiftHalf, setShiftHalf] = useState<ShiftHalf>('first_half');
  const [customLoginTime, setCustomLoginTime] = useState<string>('');
  const [workedHours, setWorkedHours] = useState<string>('');
  const [workedMinutes, setWorkedMinutes] = useState<string>('');
  const [workedSeconds, setWorkedSeconds] = useState<string>('');
  const [animationKey, setAnimationKey] = useState<number>(0);

  // Dynamic Time-of-Day Period (morning, noon, evening, night)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(() => getCurrentTimePeriod());

  useEffect(() => {
    // Check every second so the background changes automatically without refresh
    // at exact period boundaries (e.g., 14:59 -> 15:00)
    const timer = setInterval(() => {
      setTimePeriod((prev) => {
        const next = getCurrentTimePeriod();
        return prev === next ? prev : next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Result starts as null so initially only the first card/table is displayed
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Overbreak Popup Modal state (triggered when break taken exceeds allowed limit)
  const [isOverbreakModalOpen, setIsOverbreakModalOpen] = useState<boolean>(false);

  // Mobile navigation state: initially 'form' (Table 1), toggles to 'results' (Table 2) upon calculation
  const [mobileView, setMobileView] = useState<'form' | 'results'>('form');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Break Reminder configuration and active countdown state
  const [reminderState, setReminderState] = useState<BreakReminderState>(() => {
    try {
      const saved = localStorage.getItem(REMINDER_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      enabled: true,
      pushEnabled: true,
      duration: 25,
      unit: 'Minutes',
      targetTimestamp: null,
    };
  });

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(REMINDER_STORAGE_KEY);
      if (saved) {
        const parsed: BreakReminderState = JSON.parse(saved);
        if (parsed.targetTimestamp) {
          const diff = Math.round((parsed.targetTimestamp - Date.now()) / 1000);
          return diff > 0 ? diff : 0;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Main View: 'calculator' (default) or 'reminder' (inline Break Reminder card)
  const [mainView, setMainView] = useState<'calculator' | 'reminder'>('calculator');

  // Countdown timer effect for active Break Reminder
  useEffect(() => {
    if (!reminderState.targetTimestamp) {
      return;
    }

    const checkTimer = () => {
      if (!reminderState.targetTimestamp) return;
      const diff = Math.round((reminderState.targetTimestamp - Date.now()) / 1000);

      if (diff <= 0) {
        setRemainingSeconds(0);
        // Only trigger local push if server push was NOT already scheduled
        if (reminderState.pushEnabled && !reminderState.serverPushScheduled) {
          triggerBreakNotification(
            `${reminderState.duration} ${reminderState.unit.toLowerCase()}`
          );
        }

        // Reset targetTimestamp
        setReminderState((prev) => {
          const next = { ...prev, targetTimestamp: null };
          try {
            localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      } else {
        setRemainingSeconds(diff);
      }
    };

    checkTimer();
    const timerId = setInterval(checkTimer, 1000);
    return () => clearInterval(timerId);
  }, [reminderState]);

  const handleSaveReminder = (newState: BreakReminderState) => {
    setReminderState(newState);
    try {
      localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(newState));
    } catch {
      // ignore
    }
    if (newState.targetTimestamp) {
      const diff = Math.round((newState.targetTimestamp - Date.now()) / 1000);
      setRemainingSeconds(Math.max(0, diff));
    } else {
      setRemainingSeconds(null);
    }
  };

  const handleStopReminder = () => {
    const updated = { ...reminderState, targetTimestamp: null };
    setReminderState(updated);
    try {
      localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setRemainingSeconds(null);
  };

  // When a user selects a shift, save it as their default in localStorage
  const handleSelectShift = (id: string) => {
    setSelectedShiftId(id);
    if (errorMessage) setErrorMessage(null);
    try {
      if (id) {
        localStorage.setItem(DEFAULT_SHIFT_STORAGE_KEY, id);
      } else {
        localStorage.removeItem(DEFAULT_SHIFT_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  };

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

    setErrorMessage(null);

    // Calculate break results using live time and custom login if provided
    const calculated = calculateLiveShiftBreak(
      shift,
      totalMinutes,
      undefined,
      'current_time',
      s,
      dayType,
      shiftHalf,
      customLoginTime
    );
    setResult(calculated);

    // If break taken exceeds allowed limit, automatically pop up the Overbreak Modal
    if (calculated.breakTakenMinutes > calculated.totalAllowedBreakMinutes) {
      setIsOverbreakModalOpen(true);
    } else {
      setIsOverbreakModalOpen(false);
    }

    // Switch mobile view to show ONLY 2nd table
    setMobileView('results');
    setAnimationKey((prev) => prev + 1);
  };

  const handleReset = () => {
    // Keep saved default shift from localStorage so user doesn't have to re-select every time
    let defaultShift = '';
    try {
      const saved = localStorage.getItem(DEFAULT_SHIFT_STORAGE_KEY);
      if (saved && SHIFT_OPTIONS.some((s) => s.id === saved)) {
        defaultShift = saved;
      }
    } catch {
      // ignore
    }

    setSelectedShiftId(defaultShift);
    setDayType('full_day');
    setShiftHalf('first_half');
    setCustomLoginTime('');
    setWorkedHours('');
    setWorkedMinutes('');
    setWorkedSeconds('');
    setErrorMessage(null);
    setResult(null);
    setIsOverbreakModalOpen(false);
    setMobileView('form');
    setAnimationKey((prev) => prev + 1);
  };

  const isCalculated = result !== null;

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-center items-center p-2 sm:p-4 lg:py-3 lg:px-6 overflow-x-hidden text-slate-100 font-sans bg-[#070e14]"
    >
      {/* Background Layers with 1-second Smooth Cross-fade (Preloaded & Zero Flicker) */}
      {(['morning', 'noon', 'evening', 'night'] as const).map((period) => (
        <div
          key={period}
          aria-hidden={timePeriod !== period}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out bg-period-${period} ${
            timePeriod === period ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
          }`}
        />
      ))}

      {/* Dark Ambient Layer */}
      <div className="absolute inset-0 bg-black/45 backdrop-brightness-[0.92] pointer-events-none z-[1]" />

      {/* Top Right Calligraphy: "Good Breaks Better Work" */}
      <div className="absolute top-4 right-6 pointer-events-none hidden md:block z-10 text-right select-none">
        <div className="font-script text-[#00e599] text-2xl sm:text-3xl font-bold leading-tight rotate-[-4deg] tracking-tight drop-shadow-[0_0_15px_rgba(0,229,153,0.35)]">
          Good Breaks
        </div>
        <div className="font-script text-[#00e599] text-2xl sm:text-3xl font-bold leading-tight rotate-[-4deg] tracking-tight relative inline-block drop-shadow-[0_0_15px_rgba(0,229,153,0.35)]">
          Better Work
          <svg
            className="absolute -bottom-1.5 right-0 w-20 text-[#00e599] overflow-visible"
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
      <div
        className={`absolute left-6 lg:left-8 top-1/2 -translate-y-1/2 max-w-[170px] hidden xl:block z-10 pointer-events-none select-none transition-opacity duration-500 ${
          isCalculated ? 'xl:opacity-0 2xl:opacity-100' : 'opacity-100'
        }`}
      >
        <p className="text-xs sm:text-sm font-semibold text-slate-200/90 leading-relaxed tracking-wide drop-shadow-md">
          A short break <br />
          today, <br />
          a better you <br />
          tomorrow.
        </p>
        <div className="w-7 h-1 bg-[#00e599] rounded-full mt-2.5 shadow-[0_0_10px_rgba(0,229,153,0.7)]" />
      </div>

      {/* Main Content Area */}
      <div
        className={`relative z-20 w-full transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          mainView === 'reminder'
            ? 'max-w-[480px]'
            : isCalculated
            ? 'max-w-6xl xl:max-w-7xl'
            : 'max-w-[460px]'
        }`}
      >
        {/* Top Header Bar */}
        <Header
          onReset={handleReset}
          onToggleReminderView={() =>
            setMainView((prev) => (prev === 'reminder' ? 'calculator' : 'reminder'))
          }
          activeView={mainView}
          isReminderRunning={Boolean(
            reminderState.targetTimestamp && remainingSeconds !== null && remainingSeconds > 0
          )}
          remainingSeconds={remainingSeconds}
        />

        {/* In-Page View Switch: Break Reminder Card vs Calculator */}
        {mainView === 'reminder' ? (
          <div className="w-full flex justify-center animate-in fade-in zoom-in-95 duration-200">
            <BreakReminderCard
              reminderState={reminderState}
              onSaveReminder={handleSaveReminder}
              onStopReminder={handleStopReminder}
              remainingSeconds={remainingSeconds}
              onBackToCalculator={() => setMainView('calculator')}
            />
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* DESKTOP LAYOUT (lg:flex): Card 1 + Card 2 (Exact Same Height) */}
            {/* ============================================================== */}
            <div className="hidden lg:flex items-stretch gap-6 w-full">
              {/* Card 1: Calculator Form (Stable 460px width, glides smoothly from center to left) */}
              <div className="w-[460px] xl:w-[470px] flex-shrink-0 bg-[#0d1921]/95 backdrop-blur-2xl border border-slate-700/60 rounded-[26px] p-5 sm:p-5.5 shadow-2xl flex flex-col justify-between min-h-0 lg:min-h-[570px] z-20 transition-all duration-300">
                <CalculatorForm
                  selectedShiftId={selectedShiftId}
                  onSelectShift={handleSelectShift}
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
                  customLoginTime={customLoginTime}
                  onChangeCustomLoginTime={(val) => {
                    setCustomLoginTime(val);
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
                  onSubmit={handleCalculate}
                  errorMessage={errorMessage}
                  onToggleReminderView={() =>
                    setMainView((prev) => (prev === 'reminder' ? 'calculator' : 'reminder'))
                  }
                  isReminderRunning={Boolean(
                    reminderState.targetTimestamp && remainingSeconds !== null && remainingSeconds > 0
                  )}
                  remainingSeconds={remainingSeconds}
                />
              </div>

              {/* Card 2: Status Results (emerges smoothly from center to right) */}
              {isCalculated && (
                <div className="flex-1 min-w-0 flex flex-col min-h-0 lg:min-h-[570px] animate-desktop-card2-in z-10">
                  <ResultsDisplay
                    result={result}
                    animationKey={animationKey}
                    onOpenOverbreakModal={() => setIsOverbreakModalOpen(true)}
                  />
                </div>
              )}
            </div>

        {/* ============================================================== */}
        {/* MOBILE LAYOUT (< lg): Show ONLY 1 Card at a time               */}
        {/* ============================================================== */}
        <div className="lg:hidden w-full">
          {/* When in 'form' view: Show ONLY 1st Table */}
          {mobileView === 'form' && (
            <div className="w-full bg-[#0d1921]/95 backdrop-blur-2xl border border-slate-700/60 rounded-[22px] p-4 sm:p-5 shadow-2xl flex flex-col justify-between animate-mobile-slide-right">
              <CalculatorForm
                selectedShiftId={selectedShiftId}
                onSelectShift={handleSelectShift}
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
                customLoginTime={customLoginTime}
                onChangeCustomLoginTime={(val) => {
                  setCustomLoginTime(val);
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
                onSubmit={handleCalculate}
                errorMessage={errorMessage}
                onToggleReminderView={() =>
                  setMainView((prev) => (prev === 'reminder' ? 'calculator' : 'reminder'))
                }
                isReminderRunning={Boolean(
                  reminderState.targetTimestamp && remainingSeconds !== null && remainingSeconds > 0
                )}
                remainingSeconds={remainingSeconds}
              />
            </div>
          )}

          {/* When in 'results' view: Show ONLY 2nd Table */}
          {mobileView === 'results' && isCalculated && (
            <div className="w-full animate-mobile-slide-left">
              <ResultsDisplay
                result={result}
                animationKey={animationKey}
                onBackToForm={() => setMobileView('form')}
                onOpenOverbreakModal={() => setIsOverbreakModalOpen(true)}
              />
            </div>
          )}
        </div>
          </>
        )}
      </div>

      {/* Overbreak Alert Popup Modal ("Thambi Thappu!") */}
      <OverbreakModal
        isOpen={isOverbreakModalOpen}
        onClose={() => setIsOverbreakModalOpen(false)}
        result={result}
      />
    </div>
  );
};

export default App;
