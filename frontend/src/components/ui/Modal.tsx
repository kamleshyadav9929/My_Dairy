import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={`w-full ${maxWidth} bg-white border border-slate-200 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex-shrink-0 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {children}
            </div>

            {footer && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex-shrink-0 rounded-b-2xl">
                {footer}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
