import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export default function Toast({ message, type = 'error', onClose, duration = 4500 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const animationFrame = requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // match exit transition
    }, duration);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          bg: 'bg-slate-900/95 border-emerald-500/40 text-white',
          accent: 'bg-emerald-500',
          title: 'Success'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          bg: 'bg-slate-900/95 border-amber-500/40 text-white',
          accent: 'bg-amber-400',
          title: 'Warning'
        };
      case 'info':
        return {
          icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
          bg: 'bg-slate-900/95 border-sky-500/40 text-white',
          accent: 'bg-sky-400',
          title: 'Notification'
        };
      case 'error':
      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          bg: 'bg-slate-900/95 border-rose-500/40 text-white',
          accent: 'bg-rose-500',
          title: 'Error'
        };
    }
  };

  const config = getToastConfig();

  return (
    <div
      className={`fixed top-5 right-5 z-[9999] max-w-md w-[calc(100vw-2.5rem)] sm:w-auto transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95 pointer-events-none'
      }`}
      role="alert"
    >
      <div className={`relative overflow-hidden rounded-2xl border ${config.bg} p-4 shadow-2xl backdrop-blur-xl flex items-start gap-3 min-w-[320px]`}>
        {/* Left accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.accent}`} />

        {/* Icon */}
        <div className="pt-0.5 pl-1">{config.icon}</div>

        {/* Message */}
        <div className="flex-1 pr-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            {config.title}
          </p>
          <p className="text-sm font-medium leading-snug text-slate-100">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="text-slate-400 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors cursor-pointer shrink-0 -mr-1"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress Bar Animation */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-0.5 ${config.accent} opacity-60 animate-toast-progress`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}
