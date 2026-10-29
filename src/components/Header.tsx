import React, { useEffect, useState } from 'react';
import { Calendar, RotateCcw, Clock, Download, Bell } from 'lucide-react';
import { InstallPromptModal } from './InstallPromptModal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface HeaderProps {
  onReset: () => void;
  onToggleReminderView: () => void;
  activeView: 'calculator' | 'reminder';
  isReminderRunning: boolean;
  remainingSeconds: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onToggleReminderView,
  activeView,
  isReminderRunning,
  remainingSeconds,
}) => {
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

  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as unknown as { standalone?: boolean }).standalone)
    );
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  return (
    <>
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

        {/* Right Controls: Date Pill, Reset Button, Current Time Pill, Install App Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Install / Download App Button */}
          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#00e599] bg-[#00e599]/15 hover:bg-[#00e599]/25 hover:text-white border border-[#00e599]/50 rounded-full shadow-[0_0_12px_rgba(0,229,153,0.2)] backdrop-blur-md transition-all cursor-pointer active:scale-95"
              title="Download & install app on your phone"
            >
              <Download className="w-3.5 h-3.5 text-[#00e599]" />
              <span>Install App</span>
            </button>
          )}

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

          {/* Break Reminder Button */}
          <button
            id="header-break-reminder-btn"
            type="button"
            onClick={onToggleReminderView}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border shadow-2xs backdrop-blur-md transition-all cursor-pointer active:scale-95 ${
              activeView === 'reminder'
                ? 'text-[#071a12] bg-[#00e599] border-[#00e599] shadow-[0_0_15px_rgba(0,229,153,0.45)]'
                : isReminderRunning
                ? 'text-[#00e599] bg-[#00e599]/20 border-[#00e599] shadow-[0_0_12px_rgba(0,229,153,0.35)]'
                : 'text-[#00e599] bg-[#0d1c26]/90 hover:bg-[#132c3c] border-[#00e599]/60'
            }`}
            title={activeView === 'reminder' ? 'Back to Calculator' : 'Set Break Reminder'}
          >
            <Bell
              className={`w-3.5 h-3.5 ${
                activeView === 'reminder' ? 'text-[#071a12]' : 'text-[#00e599]'
              } ${isReminderRunning ? 'animate-bounce' : ''}`}
            />
            <span>
              {activeView === 'reminder'
                ? 'Break Reminder'
                : isReminderRunning && remainingSeconds !== null
                ? `Break (${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s)`
                : 'Break Reminder'}
            </span>
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

      {/* PWA Install Modal */}
      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isIOS={isIOS}
      />
    </>
  );
};

export default Header;
