import React, { useState } from 'react';
import {
  Bell,
  Clock,
  ChevronDown,
  StopCircle,
  ArrowLeft,
  Volume2,
} from 'lucide-react';
import {
  requestNotificationPermission,
  subscribeAndSchedulePush,
  playBreakAlertSound,
} from '../utils/reminderSound';

export interface BreakReminderState {
  enabled: boolean;
  pushEnabled: boolean;
  soundEnabled?: boolean;
  duration: number;
  unit: 'Minutes' | 'Seconds';
  targetTimestamp: number | null;
  serverPushScheduled?: boolean;
}

interface BreakReminderCardProps {
  reminderState: BreakReminderState;
  onSaveReminder: (newState: BreakReminderState) => void;
  onStopReminder: () => void;
  remainingSeconds: number | null;
  onBackToCalculator: () => void;
}

export const BreakReminderCard: React.FC<BreakReminderCardProps> = ({
  reminderState,
  onSaveReminder,
  onStopReminder,
  remainingSeconds,
  onBackToCalculator,
}) => {
  // Local form state
  const [duration, setDuration] = useState<number>(reminderState.duration || 25);
  const [unit, setUnit] = useState<'Minutes' | 'Seconds'>(reminderState.unit || 'Minutes');
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = async () => {
    const durationSeconds = unit === 'Minutes' ? duration * 60 : duration;
    const targetTimestamp = Date.now() + durationSeconds * 1000;

    // Immediately save & start the reminder timer so UI feedback is instantaneous
    onSaveReminder({
      enabled: true,
      pushEnabled: true,
      soundEnabled: false,
      duration: Math.max(1, duration),
      unit,
      targetTimestamp,
      serverPushScheduled: false,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onBackToCalculator();
    }, 600);

    // Prompt for notification permission and schedule background Web Push
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setPermissionNotice('Please allow notifications in browser settings to receive alerts.');
      } else {
        setPermissionNotice(null);
        const serverScheduled = await subscribeAndSchedulePush(Math.max(1, duration), unit);
        if (serverScheduled) {
          onSaveReminder({
            enabled: true,
            pushEnabled: true,
            soundEnabled: false,
            duration: Math.max(1, duration),
            unit,
            targetTimestamp,
            serverPushScheduled: true,
          });
        }
      }
    } catch {
      // ignore
    }
  };

  const formatRemaining = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="w-full max-w-[480px] mx-auto bg-[#0a1824]/95 backdrop-blur-2xl border border-slate-700/60 rounded-[26px] p-5 sm:p-6 shadow-2xl text-white transition-all duration-300">
      {/* Header Row */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-[#09261c] border border-[#14533d] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,153,0.25)] flex-shrink-0 text-[#00e599]">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white leading-tight">
            Break <span className="text-[#00e599]">Reminder</span>
          </h2>
          <p className="text-slate-400 text-xs">
            Get notified when your break time is over.
          </p>
        </div>
      </div>

      {/* Active Timer Status Banner (if running) */}
      {reminderState.targetTimestamp && remainingSeconds !== null && remainingSeconds > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-[#00e599]/10 border border-[#00e599]/40 flex items-center justify-between gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e599] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00e599]" />
            </span>
            <span className="text-white font-medium">
              Active: <span className="text-[#00e599] font-bold font-mono">{formatRemaining(remainingSeconds)}</span> remaining
            </span>
          </div>
          <button
            type="button"
            onClick={onStopReminder}
            className="text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>
        </div>
      )}

      {/* Section: Set Reminder Time */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-white mb-2 tracking-wide">
          Set Reminder Time
        </label>
        <div className="flex items-center justify-between bg-[#06121d] border border-slate-700/80 rounded-xl p-1.5 focus-within:border-[#00e599]/70 focus-within:ring-1 focus-within:ring-[#00e599]/30 transition">
          <div className="w-9 h-9 rounded-lg bg-[#0b1c28] border border-slate-700/60 flex items-center justify-center text-[#00e599] flex-shrink-0">
            <Clock className="w-4.5 h-4.5" />
          </div>

          <input
            type="number"
            min={1}
            max={180}
            value={duration}
            onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-24 bg-transparent text-center text-white font-extrabold text-lg focus:outline-none"
          />

          <div className="relative">
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'Minutes' | 'Seconds')}
              aria-label="Reminder Time Unit"
              className="appearance-none bg-transparent text-slate-300 hover:text-white pr-7 pl-2 py-1 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="Minutes" className="bg-[#0a1824] text-white">
                Minutes
              </option>
              <option value="Seconds" className="bg-[#0a1824] text-white">
                Seconds
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          You'll get notified when your break exceeds {duration} {unit.toLowerCase()}.
        </p>
      </div>

      {/* Section: Reminder Preview */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-white tracking-wide">
            Reminder Preview
          </label>
          <button
            type="button"
            onClick={() => playBreakAlertSound()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00e599]/10 hover:bg-[#00e599]/20 text-[#00e599] border border-[#00e599]/30 text-[11px] font-semibold transition active:scale-95 cursor-pointer"
            title="Click to test alert sound"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Sound</span>
          </button>
        </div>
        <div className="bg-[#05101a]/90 border border-slate-800 rounded-xl p-4 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#09261c] border border-[#14533d] flex items-center justify-center p-1 flex-shrink-0">
                <img src="/logo.png" alt="Icon" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Break Calculator</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">now</span>
          </div>

          <p className="text-xs sm:text-sm font-extrabold text-white">
            Thambi... time aayiduchu! ⏰
          </p>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            Your {duration} {unit.toLowerCase()} break is over.
            <br />
            Time to get back to work! 💪
          </p>
        </div>
      </div>

      {/* Permission Warning Notice (if blocked by browser) */}
      {permissionNotice && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{permissionNotice}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2.5">
        <button
          id="save-reminder-btn"
          type="button"
          onClick={handleSave}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00b074] to-[#00e599] text-[#071a12] font-extrabold text-sm shadow-[0_0_20px_rgba(0,229,153,0.3)] hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Bell className="w-4 h-4 fill-[#071a12]" />
          <span>{savedSuccess ? 'Saved! ✓' : 'Save Reminder'}</span>
        </button>

        <button
          id="back-to-calculator-btn"
          type="button"
          onClick={onBackToCalculator}
          className="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/40 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Calculator</span>
        </button>
      </div>
    </div>
  );
};

export default BreakReminderCard;
