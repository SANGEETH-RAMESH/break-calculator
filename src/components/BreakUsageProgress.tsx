import React from 'react';
import type { CalculationResult } from '../types/shift';

interface BreakUsageProgressProps {
  result: CalculationResult;
}

export const BreakUsageProgress: React.FC<BreakUsageProgressProps> = ({ result }) => {
  const percentage = Math.min(100, Math.max(0, result.percentageUsed));
  const showTextInsideBar = percentage >= 14;

  return (
    <section className="mt-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            Break Usage
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Total allowed break: <span className="font-bold text-slate-800">{result.totalAllowedBreakFormatted}</span>
          </p>
        </div>

        {/* Dynamic Percentage */}
        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#136a3c] leading-none">
            {percentage}%
          </div>
          <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
            of break used
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div
        className="w-full bg-[#e6ebed] rounded-full h-6 p-0.5 overflow-hidden flex items-center relative mt-2"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Break usage progress"
      >
        <div
          className="h-full bg-gradient-to-r from-[#20a455] via-[#1ba04f] to-[#158241] rounded-full transition-all duration-700 ease-out flex items-center justify-center shadow-2xs"
          style={{ width: `${Math.max(percentage, 0)}%` }}
        >
          {showTextInsideBar && (
            <span className="text-[11px] font-bold text-white tracking-wider animate-fadeIn select-none px-2">
              {result.breakTakenFormatted}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};
