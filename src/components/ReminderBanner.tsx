import React from 'react';
import { Lightbulb } from 'lucide-react';

export const ReminderBanner: React.FC = () => {
  return (
    <div className="mt-5 bg-[#13222c] border border-slate-800/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
      <div className="w-10 h-10 rounded-full bg-[#272115] border border-[#543b12] text-amber-400 flex items-center justify-center flex-shrink-0 shadow-inner">
        <Lightbulb className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
          Take short breaks, stay refreshed!
        </h4>
        <p className="text-xs text-slate-400 mt-0.5 leading-snug">
          A well-timed break helps you stay focused and productive.
        </p>
      </div>
    </div>
  );
};
