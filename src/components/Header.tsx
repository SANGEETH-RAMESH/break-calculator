import React, { useState } from 'react';
import { Calendar, RotateCcw, Smartphone } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenTestModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onOpenTestModal }) => {
  const [formattedDate] = useState(() => {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  });

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#09261c] border border-[#14533d] flex items-center justify-center shadow-[0_0_20px_rgba(0,229,153,0.25)] flex-shrink-0 overflow-hidden p-1.5">
          <img
            src="/logo.png"
            alt="Break Calculator Logo"
            className="w-full h-full object-contain"
          />
        </div>

        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-white leading-tight">
            Break <span className="text-[#00e599]">Calculator</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5 font-normal">
            Plan your breaks, stay focused and productive.
          </p>
        </div>
      </div>

      {/* Right Controls: Date Pill, Reset Button, Spec Test Cases */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Date Badge */}
        <div className="inline-flex items-center gap-2 bg-[#0d1c26]/90 border border-slate-700/60 px-3.5 py-1.5 rounded-full text-slate-300 text-xs font-medium shadow-2xs backdrop-blur-md">
          <Calendar className="w-3.5 h-3.5 text-[#00e599]" />
          <span>{formattedDate}</span>
        </div>

        {/* Reset Button */}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-[#0d1c26]/90 hover:bg-[#152a3a] hover:text-white border border-slate-700/60 rounded-full shadow-2xs backdrop-blur-md transition-all cursor-pointer active:scale-95"
          title="Reset form"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
          <span>Reset</span>
        </button>

        {/* Spec Test Cases Pill Button */}
        <button
          type="button"
          onClick={onOpenTestModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#00e599] bg-[#0c261e]/90 hover:bg-[#12382c] border border-[#15543c] rounded-full shadow-2xs backdrop-blur-md transition-all cursor-pointer active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#00e599]" />
          <span>Spec Test Cases (10/10)</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
