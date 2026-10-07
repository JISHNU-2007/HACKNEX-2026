import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ToastProps {
  id: string;
  title: string;
  desc: string;
  severity?: 'low' | 'medium' | 'high' | 'critical' | string;
  onClose: () => void;
  autoHideDuration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  title,
  desc,
  severity = 'medium',
  onClose,
  autoHideDuration = 5000,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, autoHideDuration);
    return () => clearTimeout(timer);
  }, [onClose, autoHideDuration]);

  const getIcon = () => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-400 shrink-0" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-teal-400 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-950/40 text-red-100 shadow-red-950/50';
      case 'high':
        return 'border-orange-500/50 bg-orange-950/40 text-orange-100 shadow-orange-950/50';
      case 'medium':
        return 'border-amber-500/50 bg-amber-950/40 text-amber-100 shadow-amber-950/50';
      default:
        return 'border-teal-500/50 bg-[#18202B] text-[#E6EDF3] shadow-black/50';
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all transform slide-in-from-bottom-5 duration-300 max-w-md w-full',
        getBorderColor()
      )}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
        <p className="text-xs text-[#8B98A9] mt-0.5 line-clamp-2">{desc}</p>
      </div>
      <button
        onClick={onClose}
        className="text-[#8B98A9] hover:text-[#E6EDF3] transition-colors p-1 rounded-md"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
