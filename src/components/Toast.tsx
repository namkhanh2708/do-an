import React from 'react';

export interface ToastData {
  id: string;
  title: string;
  message: string;
  icon: string;
  iconColor: string;
}

interface ToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-surface-container-highest text-on-surface p-space-md rounded-xl shadow-2xl flex items-center justify-between gap-space-sm border border-outline-variant/50 animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex items-center gap-space-sm min-w-0">
            <span className={`material-symbols-outlined text-[20px] ${toast.iconColor}`}>
              {toast.icon}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm font-semibold truncate">
                {toast.title}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {toast.message}
              </span>
            </div>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      ))}
    </div>
  );
};
