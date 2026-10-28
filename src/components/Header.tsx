import React, { useEffect, useState } from 'react';
import { Calendar, RotateCcw, Clock } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  const [formattedDate] = useState(() => {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  });

  const [currentTime, setCurrentTime] = useState(() => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 mb-2.5 sm:mb-3">
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#09261c] border border-[#14533d] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,153,0.25)] flex-shrink-0 overflow-hidden p-1">
          <img
            src="/logo.png"
            alt="Break Calculator Logo"
            className="w-full h-full object-contain"
          />
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
            Break <span className="text-[#00e599]">Calculator</span>
          </h1>
          <p className="text-slate-400 text-[11px] sm:text-xs font-normal">
            Plan your breaks, stay focused and productive.
          </p>
        </div>
      </div>

      {/* Right Controls: Date Pill, Reset Button, Current Time Pill */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Date Badge */}
        <div className="inline-flex items-center gap-1.5 bg-[#0d1c26]/90 border border-slate-700/60 px-3 py-1 rounded-full text-slate-300 text-xs font-medium shadow-2xs backdrop-blur-md">
          <Calendar className="w-3.5 h-3.5 text-[#00e599]" />
          <span>{formattedDate}</span>
        </div>

        {/* Reset Button */}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-300 bg-[#0d1c26]/90 hover:bg-[#152a3a] hover:text-white border border-slate-700/60 rounded-full shadow-2xs backdrop-blur-md transition-all cursor-pointer active:scale-95"
          title="Reset form"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
          <span>Reset</span>
        </button>

        {/* Live Current Time Badge (Right side of reset) */}
        <div
          className="inline-flex items-center gap-1.5 bg-[#0d1c26]/90 border border-slate-700/60 px-3 py-1 rounded-full text-white text-xs font-mono font-bold shadow-2xs backdrop-blur-md"
          title="Current local time"
        >
          <Clock className="w-3.5 h-3.5 text-[#00e599]" />
          <span>{currentTime}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
