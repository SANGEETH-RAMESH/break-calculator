import React, { useState } from 'react';
import { Check } from 'lucide-react';
import heroImage from '../assets/break-banner.jpg';

export const SidebarHero: React.FC = () => {
  const [checklist, setChecklist] = useState([
    { id: '1', label: 'Take a break', checked: true },
    { id: '2', label: 'Stay refreshed', checked: true },
    { id: '3', label: 'Be productive', checked: true },
    { id: '4', label: 'Keep going', checked: true },
  ]);

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  return (
    <div className="relative w-full h-full min-h-[540px] rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between border border-slate-200/60 bg-gradient-to-b from-[#f8faf7] to-[#eef4ee]">
      {/* Background Photography Image */}
      <img
        src={heroImage}
        alt="Aesthetic coffee mug, notebook checklist and plant on sunlit desk"
        className="absolute inset-0 w-full h-full object-cover object-center filter contrast-[1.03] brightness-[1.02]"
        loading="lazy"
      />

      {/* Gentle soft ambient gradient overlays for readability and warmth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/15 pointer-events-none" />

      {/* Top Overlay: Artistic Calligraphy */}
      <div className="relative z-10 p-7 text-right">
        <div className="inline-block text-right">
          <div className="font-script text-[#234d32] text-4xl sm:text-5xl font-bold leading-tight drop-shadow-xs rotate-[-3deg] tracking-tight">
            Good Breaks
          </div>
          <div className="font-script text-[#234d32] text-4xl sm:text-5xl font-bold leading-tight drop-shadow-xs rotate-[-3deg] tracking-tight relative inline-block">
            Better Work
            {/* Curved golden underline swoosh */}
            <svg
              className="absolute -bottom-2 right-0 w-28 text-amber-500 overflow-visible"
              viewBox="0 0 100 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            >
              <path d="M 5,5 Q 50,22 95,5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Overlay: Cozy Interactive Checklist Card */}
      <div className="relative z-10 p-6">
        <div className="bg-white/90 backdrop-blur-md border border-white/60 rounded-2xl p-4 shadow-lg text-slate-800 max-w-[280px] ml-auto transition-all hover:bg-white/95">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Daily Habit
          </div>
          <div className="space-y-2">
            {checklist.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleItem(item.id)}
                className="w-full flex items-center gap-2.5 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 group cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    item.checked
                      ? 'bg-[#1c6b41] border-[#1c6b41] text-white'
                      : 'border-slate-300 bg-white group-hover:border-slate-400'
                  }`}
                >
                  {item.checked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className={item.checked ? 'line-through text-slate-400 font-normal' : ''}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
