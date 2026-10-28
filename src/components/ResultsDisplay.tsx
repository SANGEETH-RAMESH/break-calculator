import React, { useEffect, useState } from 'react';
import { Coffee, Clock, Lightbulb, AlertTriangle, ArrowLeft, LogOut, Hourglass, ChevronDown, ChevronUp } from 'lucide-react';
import type { CalculationResult } from '../types/shift';

interface ResultsDisplayProps {
  result: CalculationResult | null;
  animationKey?: number;
  onBackToForm?: () => void;
  onOpenOverbreakModal?: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  result,
  animationKey = 0,
  onBackToForm,
  onOpenOverbreakModal,
}) => {
  const [isAnimated, setIsAnimated] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
  const excessMins = result?.excessBreakMinutes || Math.max(0, breakTakenMins - totalBreakAllowed);
  const isExceeded = excessMins > 0;

  // Math for SVG donut ring
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ≈ 402.12
  const breakPercentage = Math.min(100, Math.max(0, (breakTakenMins / totalBreakAllowed) * 100));

  const targetOrangeArcLength = Math.max(0, (breakPercentage / 100) * circumference);
  const targetBlueArcLength = Math.max(0, (breakLeftMins / totalBreakAllowed) * circumference);

  const orangeArcLength = isAnimated ? targetOrangeArcLength : 0;
  const blueArcLength = isAnimated ? targetBlueArcLength : 0;
  const currentProgress = isAnimated ? (isReady ? breakPercentage : 16.7) : 0;

  // Render the circular donut gauge (reused in both circle-only and detailed views)
  const renderDonutGauge = (sizeClass = 'w-44 h-44 sm:w-48 sm:h-48') => (
    <div className={`relative ${sizeClass} flex items-center justify-center select-none`}>
      {/* Floating Orange Badge (Break Taken) */}
      <div
        className={`absolute top-2 right-2 sm:right-3 z-10 bg-[#ea580c] hover:bg-[#d97706] text-white text-xs font-bold px-3 py-1 rounded-xl shadow-[0_4px_12px_rgba(234,88,12,0.4)] transition-all duration-500 animate-badge-float cursor-default ${
          isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
        title="Break Taken"
      >
        {result ? result.breakTakenDisplay : '10m 00s'}
      </div>

      {/* Floating Bottom Badge: Break Left OR Over Break Taken */}
      {isExceeded ? (
        <div
          onClick={onOpenOverbreakModal ? onOpenOverbreakModal : undefined}
          className={`absolute bottom-2 left-1 sm:left-2 z-10 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold px-3 py-1 rounded-xl shadow-[0_4px_12px_rgba(225,29,72,0.4)] transition-all duration-500 animate-badge-float cursor-pointer flex items-center gap-1 active:scale-95 ${
            isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
          title="Over Break Taken (Click to view warning)"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>+{result?.excessBreakDisplay || `${excessMins}m 00s`}</span>
        </div>
      ) : (
        <div
          className={`absolute bottom-2 left-1 sm:left-2 z-10 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold px-3 py-1 rounded-xl shadow-[0_4px_12px_rgba(2,132,199,0.4)] transition-all duration-500 animate-badge-float cursor-default ${
            isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
          title="Break Left"
        >
          {result ? result.breakLeftDisplay : '50m 00s'}
        </div>
      )}

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
        {!isExceeded && (
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
        )}

        {/* Orange / Rose Arc (Break Taken) */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          className={isExceeded ? 'stroke-rose-500' : 'stroke-[#ea580c] donut-arc-orange'}
          strokeWidth="13"
          strokeDasharray={`${orangeArcLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          fill="none"
          style={{
            filter: isExceeded
              ? 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.6))'
              : 'drop-shadow(0 0 8px rgba(234, 88, 12, 0.55))',
          }}
        />
      </svg>

      {/* Center Icon: Clean Coffee Cup */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center shadow-inner transition-colors ${
            isExceeded
              ? 'bg-rose-950/80 border-rose-700/60 text-rose-300'
              : 'bg-[#11202b]/80 border-slate-700/50 text-slate-100'
          }`}
        >
          <Coffee className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full flex-1 h-full min-h-0 bg-[#0d1921]/95 backdrop-blur-2xl border border-slate-700/60 rounded-[26px] p-5 sm:p-5.5 shadow-2xl flex flex-col justify-between gap-3.5 transition-all duration-300">
      {/* Top Header Row (Always displayed) */}
      <div className="space-y-2">
        {/* Mobile-Only Back Button */}
        {onBackToForm && (
          <button
            type="button"
            onClick={onBackToForm}
            className="lg:hidden flex items-center gap-1.5 text-xs font-bold text-[#00e599] hover:text-[#00c885] transition-colors pb-0.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
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
              {result?.dayType === 'half_day' ? 'Half Day break calculation' : "Here's how your break looks so far"}
            </p>
          </div>

          {/* Status Pill Badge */}
          <div
            onClick={isExceeded && onOpenOverbreakModal ? onOpenOverbreakModal : undefined}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border shadow-2xs transition-all duration-300 ${
              isExceeded
                ? 'bg-rose-950/80 border-rose-700/80 text-rose-300 cursor-pointer hover:scale-105 active:scale-95 hover:border-rose-500'
                : 'bg-[#0a271d] border-[#14533d] text-[#00e599]'
            }`}
            title={isExceeded ? 'Click to view Overbreak alert popup' : undefined}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isExceeded ? 'bg-rose-400 animate-pulse' : 'bg-[#00e599] animate-pulse'
              }`}
            />
            <span className="font-bold">
              {isExceeded
                ? `Over Break (+${result?.excessBreakDisplay || `${excessMins} mins`})`
                : 'On Track'}
            </span>
          </div>
        </div>
      </div>

      {!showDetails ? (
        /* ============================================================== */
        /* MODE 1: CIRCLE ONLY (Default View)                             */
        /* ============================================================== */
        <div className="flex-1 flex flex-col items-center justify-between py-2 sm:py-3 gap-3 animate-smooth-in">
          {/* Centered Hero Donut Gauge */}
          <div className="flex-1 flex flex-col items-center justify-center my-auto">
            {renderDonutGauge('w-48 h-48 sm:w-56 sm:h-56')}

            {/* Quick Summary Chips below circle */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <div className="bg-[#0b251c] border border-[#175c43] px-3 py-1.5 rounded-xl text-emerald-300 font-bold flex items-center gap-1.5 shadow-xs">
                <LogOut className="w-3.5 h-3.5 text-[#00e599]" />
                <span>Logout: <strong className="text-[#00e599] font-extrabold">{result ? result.expectedLogoutTime : '06:00 PM'}</strong></span>
              </div>
              <div className="bg-[#101e29] border border-slate-700/60 px-3 py-1.5 rounded-xl text-slate-300 font-medium flex items-center gap-1.5 shadow-xs">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Worked: <strong className="text-white font-bold">{result ? result.workedHhMm : '00h 06m'}</strong></span>
              </div>
              <div className="bg-[#101e29] border border-slate-700/60 px-3 py-1.5 rounded-xl text-slate-300 font-medium shadow-xs">
                Allowed: <strong className="text-white font-bold">{totalBreakAllowed}m</strong>
              </div>
            </div>
          </div>

          {/* "Show More" Button at bottom */}
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="w-full py-2.5 px-4 bg-[#11202b] hover:bg-[#162c3b] border border-slate-700/80 hover:border-[#00e599]/60 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-[#00e599] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.99] group"
          >
            <span>Show More Details</span>
            <ChevronDown className="w-4 h-4 text-[#00e599] group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      ) : (
        /* ============================================================== */
        /* MODE 2: FULL DETAILS (When Clicking "Show More")                */
        /* ============================================================== */
        <div className="space-y-3 animate-smooth-in flex-1 flex flex-col justify-between">
          <div className="space-y-2.5">
            {/* Real-time Calculation Breakdown Context Strip */}
            <div className="bg-[#101e29] border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1.5 shadow-inner">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Shift:</span>
                <strong className="text-white font-bold">
                  {result?.effectiveShiftLabel || `${result?.shift.startTime || '13:00'} – ${result?.shift.endTime || '22:30'}`}
                </strong>
                {result?.dayType === 'half_day' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 ml-1">
                    {result?.shift.isGBJ ? 'GBJ Half Day' : 'Half Day'} ({result.shiftHalf === 'first_half' ? '1st Half' : '2nd Half'})
                  </span>
                )}
              </div>
              <span className="text-slate-600 font-bold">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Login:</span>
                <strong className="text-white font-bold">
                  {result?.actualLoginTimeFormatted || result?.scheduledStartTime || '09:00 AM'}
                </strong>
                {result?.attendanceStatus === 'late_reporting' ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-700 text-amber-300 ml-1">
                    Late Reporting (+{result.lateMinutes}m)
                  </span>
                ) : result?.attendanceStatus === 'late_login' ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/90 border border-rose-700 text-rose-300 ml-1">
                    Late Login (+{result.lateMinutes}m)
                  </span>
                ) : result?.lateMinutes && result.lateMinutes > 0 ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-700 text-emerald-300 ml-1">
                    {result.lateMinutes}m Grace
                  </span>
                ) : null}
              </div>
              <span className="text-slate-600 font-bold">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Logout:</span>
                <strong className="text-[#00e599] font-bold">
                  {result?.expectedLogoutTime || '06:00 PM'}
                </strong>
              </div>
              <span className="text-slate-600 font-bold">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Elapsed:</span>
                <strong className="text-cyan-400 font-bold">{result?.elapsedHhMm || '00h 16m 00s'}</strong>
              </div>
              <span className="text-slate-600 font-bold">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Work left:</span>
                <strong className="text-white font-bold">{result?.workLeftHhMm || '08h 24m 00s'}</strong>
              </div>
            </div>

            {/* Middle Split: Donut Gauge (Left) + Stacked Metric Cards (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center pt-1">
              {/* Dual-Arc Donut Gauge */}
              <div className="md:col-span-5 flex flex-col items-center justify-center relative p-2 select-none">
                {renderDonutGauge('w-44 h-44 sm:w-48 sm:h-48')}
              </div>

              {/* Metrics Column (Right): Expected Logout + 2x2 Grid */}
              <div className="md:col-span-7 space-y-2">
                {/* Expected Logout Time Banner */}
                <div className="bg-[#0b251c] border border-[#175c43] rounded-xl px-3.5 py-2 flex items-center justify-between shadow-inner transition-transform hover:scale-[1.01]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#073826] text-[#00e599] flex items-center justify-center flex-shrink-0 border border-[#00e599]/40">
                      <LogOut className="w-3.5 h-3.5 text-[#00e599]" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-300 font-medium block leading-none">
                        Expected Logout Time
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-[#00e599] tracking-tight block mt-0.5">
                        {result ? result.expectedLogoutTime : '06:00 PM'}
                      </span>
                    </div>
                  </div>
                  {result?.attendanceStatus === 'late_reporting' ? (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-700/80 px-2 py-0.5 rounded-full">
                      +{result.lateMinutes}m Late Reporting
                    </span>
                  ) : result?.attendanceStatus === 'late_login' ? (
                    <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-700/80 px-2 py-0.5 rounded-full">
                      +{result.lateMinutes}m Late Login
                    </span>
                  ) : result?.lateMinutes && result.lateMinutes > 0 ? (
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                      {result.lateMinutes}m Grace (On Schedule)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                      On Schedule
                    </span>
                  )}
                </div>

                {/* 2x2 Metric Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Worked Time */}
                  <div className="bg-[#101e29] border border-slate-700/60 rounded-xl p-2.5 sm:p-3 shadow-inner transition-transform hover:scale-[1.01] flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#00e599]" />
                      <span>Worked Time</span>
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight mt-1 truncate">
                      {result ? result.workedHhMm : '00h 06m 00s'}
                    </span>
                  </div>

                  {/* Remaining Work */}
                  <div className="bg-[#0f1d26] border border-[#1b3a4d] rounded-xl p-2.5 sm:p-3 shadow-inner transition-transform hover:scale-[1.01] flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
                      <Hourglass className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Remaining Work</span>
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-cyan-300 tracking-tight mt-1 truncate">
                      {result ? result.workLeftHhMm : '08h 24m 00s'}
                    </span>
                  </div>

                  {/* Break Taken */}
                  <div className="bg-[#1b1712] border border-[#3e2c18] rounded-xl p-2.5 sm:p-3 shadow-inner transition-transform hover:scale-[1.01] flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" />
                      <span>Break Taken</span>
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-[#f59e0b] tracking-tight mt-1 truncate">
                      {result ? result.breakTakenDisplay : '10m 00s'}
                    </span>
                  </div>

                  {/* Break Left */}
                  <div className="bg-[#0e1d29] border border-[#183a54] rounded-xl p-2.5 sm:p-3 shadow-inner transition-transform hover:scale-[1.01] flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                      <span>Break Left</span>
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-[#38bdf8] tracking-tight mt-1 truncate">
                      {result ? result.breakLeftDisplay : '50m 00s'}
                    </span>
                  </div>
                </div>

                {/* Over Break Taken banner (if exceeded) */}
                {isExceeded && (
                  <div className="bg-[#291215] border border-rose-800 rounded-xl px-3 py-1.5 flex items-center justify-between shadow-inner transition-transform hover:scale-[1.01] animate-smooth-in">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span className="text-xs text-rose-300 font-bold">
                        Over Break Taken
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-rose-400 tracking-tight">
                      +{result?.excessBreakDisplay || `${excessMins}m 00s`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Break Usage Progress Bar Section */}
            <div className="pt-1">
              <div className="flex items-end justify-between gap-3 mb-1.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Total Break Allowance
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {totalBreakAllowed === 30
                      ? `30 minutes ${result?.dayType === 'half_day' ? '(Half Day)' : ''}`
                      : '1 hour (60 minutes)'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-extrabold text-white leading-tight mr-1">
                    {result ? result.breakTakenDisplay : '10m 00s'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    of {totalBreakAllowed}m used
                  </span>
                  {isExceeded && (
                    <span className="block text-[11px] font-extrabold text-rose-400">
                      (+{result?.excessBreakDisplay || `${excessMins}m 00s`} over!)
                    </span>
                  )}
                </div>
              </div>

              {/* Smooth Progress Bar */}
              <div
                className="w-full bg-[#11202b] rounded-full h-3 sm:h-3.5 overflow-hidden relative border border-slate-700/50 shadow-inner"
                role="progressbar"
                aria-valuenow={breakPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isExceeded
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 shadow-[0_0_14px_rgba(244,63,94,0.5)]'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 shadow-[0_0_12px_rgba(234,88,12,0.4)]'
                  }`}
                  style={{ width: `${Math.max(currentProgress, 3)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Section: Warning or Tip card + Show Less button */}
          <div className="space-y-2.5 pt-1">
            {isExceeded ? (
              <div
                onClick={onOpenOverbreakModal}
                className="bg-[#291712] hover:bg-[#381a20] border border-rose-900/80 hover:border-rose-600/80 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs text-rose-300 animate-smooth-in cursor-pointer transition-all active:scale-[0.99] group"
                title="Click to view full Overbreak warning"
              >
                <div className="w-7 h-7 rounded-full bg-rose-950 text-rose-400 group-hover:text-rose-300 flex items-center justify-center flex-shrink-0 border border-rose-800 transition-colors">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-rose-200 leading-tight">
                      Allowed Break Exceeded!
                    </h4>
                    <span className="text-[10px] text-rose-400/90 font-semibold group-hover:text-rose-300 transition-colors">
                      View Warning →
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-400/90 mt-0.5 leading-snug">
                    Exceeded your{' '}
                    {totalBreakAllowed === 30 ? '30m' : '1h'}{' '}
                    allowed break by{' '}
                    <strong className="text-rose-200 font-extrabold">
                      {result?.excessBreakHhMm || '00h 00m 00s'}
                    </strong>{' '}
                    ({result?.excessBreakDisplay || `${excessMins}m 00s`}).
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#1c1813] border border-[#3e2e1a] rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#352411] text-[#f59e0b] flex items-center justify-center flex-shrink-0 border border-[#f59e0b]/30">
                  <Lightbulb className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    Take short breaks, stay refreshed!
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-snug">
                    A well-timed break helps you stay focused and productive.
                  </p>
                </div>
              </div>
            )}

            {/* "Show Less" Button */}
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              className="w-full py-2 px-4 bg-[#11202b] hover:bg-[#162c3b] border border-slate-700/80 hover:border-slate-600 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-[0.99]"
            >
              <span>Show Less</span>
              <ChevronUp className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
