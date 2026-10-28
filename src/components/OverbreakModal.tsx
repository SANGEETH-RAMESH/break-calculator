import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Coffee, Clock, Timer, Hourglass, Play } from 'lucide-react';
import type { CalculationResult } from '../types/shift';

interface OverbreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CalculationResult | null;
}

export const OverbreakModal: React.FC<OverbreakModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  // Alternate between overbreak.png (finger up) and overbreak2.png (finger tilted) every 1 second
  const [activeFrame, setActiveFrame] = useState<0 | 1>(0);

  useEffect(() => {
    if (!isOpen) return;

    // Preload both frames so switching is instant with zero network lag or blank flash
    const img1 = new Image();
    img1.src = '/overbreak.png';
    const img2 = new Image();
    img2.src = '/overbreak2.png';

    const interval = setInterval(() => {
      setActiveFrame((prev) => (prev === 0 ? 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !result) return null;

  const totalAllowedDisplay =
    result.totalAllowedBreakMinutes === 30 ? '30m 00s' : '1h 00m 00s';
  const breakTakenDisplay =
    result.breakTakenDisplay || `${result.breakTakenMinutes}m 00s`;
  const excessDisplay =
    result.excessBreakDisplay || `${result.excessBreakMinutes || 0}m 00s`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-[500px] flex flex-col items-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-1 sm:-right-3 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1c080c]/90 hover:bg-[#320f16] border border-rose-700/80 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-90"
          aria-label="Close overbreak modal"
          title="Close"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Character Image Area with Dynamic Decorative Floating Elements */}
        <div className="relative w-full flex justify-center -mb-8 z-20 pointer-events-none">
          {/* Left Floating Warning Triangle */}
          <div
            className="absolute left-4 sm:left-8 top-6 sm:top-8 animate-bounce z-10"
            style={{ animationDuration: '3s' }}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-rose-600 to-rose-900 border-2 border-rose-400 flex items-center justify-center shadow-[0_0_18px_rgba(255,23,68,0.7)] rotate-[-12deg]">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>

          {/* Left Floating Angled Document */}
          <div className="absolute -left-1 sm:left-2 bottom-6 animate-pulse z-10">
            <div className="w-7 h-9 sm:w-8 sm:h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-md border border-slate-300 shadow-xl rotate-[-24deg] flex flex-col justify-center items-center p-1.5 opacity-85">
              <div className="w-full h-1 bg-slate-400 rounded-xs mb-1" />
              <div className="w-4/5 h-1 bg-slate-400 rounded-xs mb-1" />
              <div className="w-3/5 h-1 bg-slate-300 rounded-xs" />
            </div>
          </div>

          {/* Right Floating Warning Triangle */}
          <div
            className="absolute right-4 sm:right-8 top-10 sm:top-12 animate-bounce z-10"
            style={{ animationDuration: '2.5s' }}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-rose-600 to-rose-900 border-2 border-rose-400 flex items-center justify-center shadow-[0_0_18px_rgba(255,23,68,0.7)] rotate-[15deg]">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>

          {/* Right Floating Angled Document */}
          <div
            className="absolute -right-1 sm:right-2 bottom-8 animate-pulse z-10"
            style={{ animationDuration: '2.2s' }}
          >
            <div className="w-7 h-9 sm:w-8 sm:h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-md border border-slate-300 shadow-xl rotate-[22deg] flex flex-col justify-center items-center p-1.5 opacity-85">
              <div className="w-full h-1 bg-slate-400 rounded-xs mb-1" />
              <div className="w-4/5 h-1 bg-slate-400 rounded-xs mb-1" />
              <div className="w-3/5 h-1 bg-slate-300 rounded-xs" />
            </div>
          </div>

          {/* Little Floating Confetti Sparks */}
          <div className="absolute left-1/4 top-3 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-ping" />
          <div className="absolute right-1/4 top-5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-ping" style={{ animationDelay: '0.7s' }} />

          {/* Main Overbreak Character Image (1-second alternating finger wag: overbreak.png <-> overbreak2.png) */}
          <img
            src={activeFrame === 0 ? '/overbreak.png' : '/overbreak2.png'}
            alt="Thambi Thappu! Overbreak"
            className="w-[280px] sm:w-[340px] max-w-full object-contain drop-shadow-[0_0_35px_rgba(255,23,68,0.55)] pointer-events-auto hover:scale-105"
          />
        </div>

        {/* Modal Card Content with Neon Red Border & Glow */}
        <div className="w-full bg-[#160508]/98 backdrop-blur-2xl border-2 border-[#ff1744] rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 pt-9 sm:pt-10 shadow-[0_0_45px_rgba(255,23,68,0.45)] relative z-10 flex flex-col items-center text-center animate-modal-pop">
          {/* Header Title & Emoji */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-rose-950/90 border border-rose-500/80 flex items-center justify-center text-[#ff1744] flex-shrink-0 shadow-[0_0_12px_rgba(255,23,68,0.4)]">
              <AlertTriangle className="w-4 h-4 text-[#ff1744]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Bro... break kazhinju
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-rose-200/80 font-medium mb-3.5">
            You’ve exceeded your allowed break time!
          </p>

          {/* 2 Comparison Cards (Allowed vs Actual) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full mb-3">
            {/* Card 1: Allowed Break */}
            <div className="bg-[#20090d] border border-rose-900/70 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 shadow-inner">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-950/90 border border-rose-800/80 flex items-center justify-center flex-shrink-0 text-[#ff1744]">
                <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff1744]" />
              </div>
              <div className="text-left min-w-0">
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block leading-none">
                  Allowed Break
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight block mt-1 truncate">
                  {totalAllowedDisplay}
                </span>
              </div>
            </div>

            {/* Card 2: Your Break */}
            <div className="bg-[#20090d] border border-rose-900/70 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 shadow-inner">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-950/90 border border-rose-800/80 flex items-center justify-center flex-shrink-0 text-[#ff1744]">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff1744]" />
              </div>
              <div className="text-left min-w-0">
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block leading-none">
                  Your Break
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight block mt-1 truncate">
                  {breakTakenDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Banner: You've used XX more than allowed */}
          <div className="w-full bg-[#20090d] border border-rose-900/70 rounded-xl sm:rounded-2xl px-3.5 py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-300 font-medium mb-3.5 shadow-inner">
            <Timer className="w-4 h-4 text-[#ff1744] flex-shrink-0" />
            <span>
              You’ve used <strong className="text-[#ff1744] font-black">{excessDisplay} more</strong> than allowed!
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#1d090d] hover:bg-[#2b0f15] border border-rose-800/80 text-white font-bold py-2.5 sm:py-3 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Hourglass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
              <span>Ayyoo... Back to Work!</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-gradient-to-r from-[#ff0055] to-[#ff1744] hover:from-[#ff1a66] hover:to-[#ff2d55] text-white font-extrabold py-2.5 sm:py-3 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_22px_rgba(255,23,68,0.55)] active:scale-95"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white" />
              <span>Seri Seri, Working Now!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverbreakModal;
