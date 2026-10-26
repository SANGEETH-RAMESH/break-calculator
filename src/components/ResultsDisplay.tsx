import React, { useEffect, useState } from 'react';
import { Coffee, Clock, Lightbulb, AlertTriangle, ArrowLeft } from 'lucide-react';
import type { CalculationResult } from '../types/shift';

interface ResultsDisplayProps {
  result: CalculationResult | null;
  onQuickSelect?: (shiftId: string, time: string) => void;
  animationKey?: number;
  onBackToForm?: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  result,
  animationKey = 0,
  onBackToForm,
}) => {
  const [isAnimated, setIsAnimated] = useState(false);

  // Trigger smooth enter animation when results change or component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 40);
    return () => clearTimeout(timer);
  }, [animationKey]);


  // If result is null (e.g. initial reset), show an elegant ready-to-calculate state
  const isReady = result !== null;

  // Defaults if waiting for calculation
  const totalBreakAllowed = result?.totalAllowedBreakMinutes || 60;
  const breakTakenMins = result ? result.breakTakenMinutes : 10;
  const breakLeftMins = result ? result.breakLeftMinutes : Math.max(0, totalBreakAllowed - breakTakenMins);

  // Math for SVG donut ring
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ≈ 402.12
  const breakPercentage = Math.min(100, Math.max(0, (breakTakenMins / totalBreakAllowed) * 100));

  const targetOrangeArcLength = Math.max(0, (breakPercentage / 100) * circumference);
  const targetBlueArcLength = Math.max(0, (breakLeftMins / totalBreakAllowed) * circumference);

  const orangeArcLength = isAnimated ? targetOrangeArcLength : 0;
  const blueArcLength = isAnimated ? targetBlueArcLength : 0;
  const currentProgress = isAnimated ? (isReady ? breakPercentage : 16.7) : 0;

  const isExceeded = (result?.excessBreakMinutes || 0) > 0 || breakTakenMins > totalBreakAllowed;

  return (
    <div className="w-full flex-1 h-full min-h-[580px] bg-[#0d1921]/95 backdrop-blur-2xl border border-slate-700/60 rounded-[28px] p-6 sm:p-7 shadow-2xl flex flex-col justify-between gap-5 transition-all duration-300">
      {/* Top Section: Header & Breakdown Info Strip */}
      <div className="space-y-3.5">
        {/* Mobile-Only Back Button */}
        {onBackToForm && (
          <button
            type="button"
            onClick={onBackToForm}
            className="lg:hidden flex items-center gap-1.5 text-xs font-bold text-[#00e599] hover:text-[#00c885] transition-colors pb-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shift Calculator</span>
          </button>
        )}

        {/* Header Row */}
        <div className="flex items-center justify-between pb-0.5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight tracking-tight">
              Your Break Status
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-normal">
              Here's how your break looks so far
            </p>
          </div>

          {/* Status Pill Badge */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border shadow-2xs transition-colors duration-300 ${
              isExceeded
                ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                : 'bg-[#0a271d] border-[#14533d] text-[#00e599]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isExceeded ? 'bg-amber-400 animate-pulse' : 'bg-[#00e599] animate-pulse'
              }`}
            />
            <span>{isExceeded ? 'Break Exceeded' : 'On Track'}</span>
          </div>
        </div>

        {/* Real-time Calculation Breakdown Context Strip */}
        <div className="bg-[#101e29] border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-y-1.5 gap-x-2 shadow-inner">
          <div className="flex flex-wrap items-center gap-2">
            <span>Shift Start:</span>
            <strong className="text-white font-bold">{result?.shift.startTime || '13:00'}</strong>
            <span className="text-slate-600 font-bold">•</span>
            <span>End:</span>
            <strong className="text-white font-bold">{result?.shift.endTime || '22:30'}</strong>
            <span className="text-slate-600 font-bold">•</span>
            <span>Elapsed:</span>
            <strong className="text-[#00e599] font-bold">{result?.elapsedHhMm || '00h 06m'}</strong>
            <span className="text-slate-600 font-bold">•</span>
            <span>Work left:</span>
            <strong className="text-white font-bold">{result?.workLeftHhMm || '08h 24m'}</strong>
          </div>
        </div>

        {/* Middle Split: Circular Donut Gauge (Left) + 3 Stacked Metric Cards (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center pt-2">
          {/* Dual-Arc Donut Gauge with Floating Badges (Left) */}
          <div className="md:col-span-6 flex flex-col items-center justify-center relative p-2 select-none">
            <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
              {/* Floating Orange Badge (Break Taken) */}
              <div
                className={`absolute top-2 right-2 sm:right-3 z-10 bg-[#ea580c] hover:bg-[#d97706] text-white text-xs font-bold px-3 py-1 rounded-xl shadow-[0_4px_12px_rgba(234,88,12,0.4)] transition-all duration-500 animate-badge-float cursor-default ${
                  isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
                title="Break Taken"
              >
                {result ? result.breakTakenDisplay : '10 mins'}
              </div>

              {/* Floating Blue Badge (Break Left) */}
              <div
                className={`absolute bottom-2 left-1 sm:left-2 z-10 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold px-3 py-1 rounded-xl shadow-[0_4px_12px_rgba(2,132,199,0.4)] transition-all duration-500 animate-badge-float cursor-default ${
                  isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
                title="Break Left"
              >
                {result ? result.breakLeftDisplay : '50 mins'}
              </div>

              {/* SVG Donut Ring */}
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                {/* Dark Base Track */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-[#13222d]"
                  strokeWidth="13"
                  fill="none"
                />

                {/* Sky Blue Arc (Break Left / Remaining) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-[#0284c7] donut-arc-blue"
                  strokeWidth="13"
                  strokeDasharray={`${blueArcLength} ${circumference}`}
                  strokeDashoffset={-orangeArcLength}
                  strokeLinecap="round"
                  fill="none"
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(2, 132, 199, 0.45))',
                  }}
                />

                {/* Orange / Amber Arc (Break Taken) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-[#ea580c] donut-arc-orange"
                  strokeWidth="13"
                  strokeDasharray={`${orangeArcLength} ${circumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  fill="none"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(234, 88, 12, 0.55))',
                  }}
                />
              </svg>

              {/* Center Icon: Clean Coffee Cup with steam */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-[#11202b]/80 border border-slate-700/50 flex items-center justify-center text-slate-100 shadow-inner">
                  <Coffee className="w-6 h-6 text-slate-100 stroke-[1.8]" />
                </div>
              </div>
            </div>
          </div>

          {/* 3 Stacked Cards (Right) */}
          <div className="md:col-span-6 space-y-2.5">
            {/* 1. Worked Time */}
            <div className="bg-[#101e29] border border-slate-700/60 rounded-2xl px-4 py-3 flex items-center gap-3.5 shadow-inner transition-transform hover:scale-[1.01]">
              <div className="w-9 h-9 rounded-full bg-[#0a271d] text-[#00e599] flex items-center justify-center flex-shrink-0 border border-[#14533d]/60">
                <Clock className="w-4 h-4 text-[#00e599]" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Worked Time
                </span>
                <span className="text-base sm:text-lg font-extrabold text-white tracking-tight block">
                  {result ? result.workedHhMm : '00h 06m'}
                </span>
              </div>
            </div>

            {/* 2. Break Taken */}
            <div className="bg-[#1b1712] border border-[#3e2c18] rounded-2xl px-4 py-3 flex items-center gap-3.5 shadow-inner transition-transform hover:scale-[1.01]">
              <div className="w-9 h-9 rounded-full bg-[#351e0e] text-[#ea580c] flex items-center justify-center flex-shrink-0 border border-[#ea580c]/30">
                <span className="w-3.5 h-3.5 rounded-full bg-[#ea580c]" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Break Taken
                </span>
                <span className="text-base sm:text-lg font-extrabold text-[#f59e0b] tracking-tight block">
                  {result ? result.breakTakenDisplay : '10 mins'}
                </span>
              </div>
            </div>

            {/* 3. Break Left */}
            <div className="bg-[#0e1d29] border border-[#183a54] rounded-2xl px-4 py-3 flex items-center gap-3.5 shadow-inner transition-transform hover:scale-[1.01]">
              <div className="w-9 h-9 rounded-full bg-[#0d2a3f] text-[#0284c7] flex items-center justify-center flex-shrink-0 border border-[#0284c7]/30">
                <span className="w-3.5 h-3.5 rounded-full bg-[#0284c7]" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Break Left
                </span>
                <span className="text-base sm:text-lg font-extrabold text-[#38bdf8] tracking-tight block">
                  {result ? result.breakLeftDisplay : '50 mins'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Break Usage Progress Bar Section */}
        <div className="pt-2">
          <div className="flex items-end justify-between gap-3 mb-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                Total Break Allowance
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                1 hour (60 minutes)
              </p>
            </div>

            <div className="text-right">
              <span className="text-sm sm:text-base font-extrabold text-white leading-tight mr-1">
                {result ? result.breakTakenDisplay : '10 mins'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                of 60 minutes used
              </span>
            </div>
          </div>

          {/* Smooth Progress Bar */}
          <div
            className="w-full bg-[#11202b] rounded-full h-3.5 sm:h-4 overflow-hidden relative border border-slate-700/50 shadow-inner"
            role="progressbar"
            aria-valuenow={breakPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(234,88,12,0.4)]"
              style={{ width: `${Math.max(currentProgress, 3)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exceeded Break Alert or Lightbulb Tip Card at bottom */}
      {isExceeded ? (
        <div className="bg-[#291712] border border-[#59261b] rounded-2xl p-3.5 flex items-center gap-3.5 shadow-2xs mt-auto text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-rose-200 leading-tight">
              Allowed Break Exceeded!
            </h4>
            <p className="text-xs text-rose-400/90 mt-0.5 leading-snug">
              You have exceeded your 1-hour allowed break limit by{' '}
              <strong>
                {Math.floor((result?.excessBreakMinutes || 0) / 60)}h{' '}
                {(result?.excessBreakMinutes || 0) % 60}m
              </strong>
              .
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#1c1813] border border-[#3e2e1a] rounded-2xl p-3.5 flex items-center gap-3.5 shadow-2xs mt-auto">
          <div className="w-8 h-8 rounded-full bg-[#352411] text-[#f59e0b] flex items-center justify-center flex-shrink-0 border border-[#f59e0b]/30">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
              Take short breaks, stay refreshed!
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-snug">
              A well-timed break helps you stay focused and productive.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
