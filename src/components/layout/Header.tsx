import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, Video, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface HeaderProps {
  systemStatus?: 'ACTIVE' | 'IDLE' | 'PROCESSING';
}

export const Header: React.FC<HeaderProps> = ({ systemStatus = 'ACTIVE' }) => {
  const location = useLocation();
  const [time, setTime] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/monitor':
        return 'Monitor Console';
      case '/investigate':
        return 'Incident Investigation';
      case '/configure':
        return 'Safety Configuration';
      default:
        if (location.pathname.startsWith('/investigate/')) return 'Incident Detail';
        return 'Dashboard';
    }
  };

  const getStatusPill = () => {
    switch (systemStatus) {
      case 'ACTIVE':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ACTIVE
          </div>
        );
      case 'PROCESSING':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            PROCESSING
          </div>
        );
      case 'IDLE':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            IDLE
          </div>
        );
    }
  };

  return (
    <header className="h-16 px-6 bg-[#121821] border-b border-[#243041] flex items-center justify-between shrink-0 z-20">
      {/* Title & Video Source */}
      <div className="flex items-center gap-4">
        <h1 className="text-base font-bold tracking-tight text-[#E6EDF3]">
          {getPageTitle()}
        </h1>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0B0F14] border border-[#243041] text-xs font-mono text-[#8B98A9]">
          <Video className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="text-[#E6EDF3]">CAM-04</span> · Factory Floor (Welding Zone)
        </div>
      </div>

      {/* Status, Clock & Theme Toggle */}
      <div className="flex items-center gap-4">
        {getStatusPill()}

        {/* Live Clock */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#E6EDF3] bg-[#0B0F14] px-3 py-1 rounded-lg border border-[#243041]">
          <Clock className="w-3.5 h-3.5 text-[#8B98A9]" />
          <span>{time || '10:42:18'}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-[#18202B] border border-[#243041] text-[#8B98A9] hover:text-[#E6EDF3] transition-colors"
          title="Toggle Light/Dark Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-teal-400" />}
        </button>
      </div>
    </header>
  );
};
