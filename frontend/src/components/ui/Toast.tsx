import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast = ({ message, type = 'success', duration = 2000, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <Check className="w-4 h-4" />,
    error: <X className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />
  };

  const styles = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white'
  };

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${styles[type]}`}>
        <div className="shrink-0">{icons[type]}</div>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>,
    document.body
  );
};

// Toast queue manager for multiple toasts
interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ToastContainer = () => (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ bottom: `${24 + index * 60}px` }}
          className="fixed right-6 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-300"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </>
  );

  return { showToast, ToastContainer };
};

// Simple standalone toast for single use
export const SimpleToast = Toast;

export default Toast;
