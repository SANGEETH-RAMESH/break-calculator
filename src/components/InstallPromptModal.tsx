import React from 'react';
import { X, Smartphone, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose,
  isIOS,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#0a1824]/95 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#09261c] border border-[#00e599]/40 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(0,229,153,0.3)] flex-shrink-0">
            <img src="/logo.png" alt="App Icon" className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Install Break Calculator</h3>
            <p className="text-xs text-slate-300">Fast, full-screen, and works offline on your phone</p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-3 my-4 bg-[#05101a]/70 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-200">
          {isIOS ? (
            <>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00e599]/20 text-[#00e599] font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <div className="pt-0.5">
                  Tap the <span className="font-semibold text-white">Share</span> button{' '}
                  <Share className="w-3.5 h-3.5 inline text-[#00e599] mx-1" /> in your Safari toolbar (at the bottom of your iPhone screen).
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00e599]/20 text-[#00e599] font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <div className="pt-0.5">
                  Scroll down the menu and tap{' '}
                  <span className="font-semibold text-white">
                    Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline text-[#00e599] ml-1" />
                  </span>
                  .
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00e599]/20 text-[#00e599] font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <div className="pt-0.5">
                  Tap <span className="font-semibold text-white">Add</span> in the top-right corner. Done!
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00e599]/20 text-[#00e599] font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <div className="pt-0.5">
                  Tap the browser menu <span className="font-semibold text-white">(⋮)</span> in the top-right corner of Chrome or Edge.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00e599]/20 text-[#00e599] font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <div className="pt-0.5">
                  Select <span className="font-semibold text-white">Install app</span> or{' '}
                  <span className="font-semibold text-white">Add to Home screen</span>.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00e599]/20 text-[#00e599] font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <div className="pt-0.5">
                  Confirm when prompted. The app icon will appear on your phone home screen!
                </div>
              </div>
            </>
          )}
        </div>

        {/* Benefits bullets */}
        <div className="flex items-center justify-around py-2 border-t border-slate-800 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00e599]" /> No App Store needed
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00e599]" /> Zero storage space
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00e599]" /> Works offline
          </span>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00b074] to-[#00e599] text-[#071a12] font-extrabold text-xs shadow-md hover:brightness-110 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Smartphone className="w-4 h-4" />
          <span>Got it!</span>
        </button>
      </div>
    </div>
  );
};

export default InstallPromptModal;
