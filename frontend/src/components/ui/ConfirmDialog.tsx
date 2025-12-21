import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setIsOpen(true);
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef?.(false);
  };

  const getVariantStyles = () => {
    switch (options?.variant) {
      case 'danger':
        return {
          icon: Trash2,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBg: 'bg-red-600 hover:bg-red-700',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          confirmBg: 'bg-amber-600 hover:bg-amber-700',
        };
      default:
        return {
          icon: AlertTriangle,
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
          confirmBg: 'bg-indigo-600 hover:bg-indigo-700',
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = styles.icon;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-fadeIn"
            onClick={handleCancel}
          />
          
          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-6 text-center">
                {/* Icon */}
                <div className={`w-16 h-16 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={`w-8 h-8 ${styles.iconColor}`} />
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {options.title}
                </h3>
                
                {/* Message */}
                <p className="text-slate-500 text-sm mb-6">
                  {options.message}
                </p>
                
                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                  >
                    {options.cancelText || 'Cancel'}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`flex-1 px-4 py-2.5 ${styles.confirmBg} text-white font-medium rounded-xl transition-colors`}
                  >
                    {options.confirmText || 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}
