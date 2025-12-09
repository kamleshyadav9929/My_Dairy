import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Option {
  value: string | number;
  label: string;
  subLabel?: string;
}

interface SelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
}

export function Select({ value, onChange, options, placeholder = 'Select...', className = '', searchable = false }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value.toString() === value.toString());

  useLayoutEffect(() => {
    const updatePosition = () => {
      if (containerRef.current && isOpen) {
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };

    if (isOpen) {
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) || 
    opt.subLabel?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex items-center justify-between transition-all hover:bg-slate-50"
      >
        <span className={`block truncate ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && position && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col"
          style={{ 
            top: position.top, 
            left: position.left, 
            width: position.width,
            maxHeight: '16rem' // 256px
          }}
        >
          {searchable && (
            <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          <div className="overflow-y-auto p-1 custom-scrollbar flex-1">
            {filteredOptions.length === 0 ? (
               <div className="px-4 py-3 text-sm text-slate-400 text-center">No results found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value.toString());
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-colors ${
                    value.toString() === option.value.toString() 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="overflow-hidden">
                    <span className="font-medium block truncate">{option.label}</span>
                    {option.subLabel && (
                      <span className={`text-xs block truncate ${
                         value.toString() === option.value.toString() ? 'text-indigo-200' : 'text-slate-400 group-hover:text-slate-500'
                      }`}>
                        {option.subLabel}
                      </span>
                    )}
                  </div>
                  {value.toString() === option.value.toString() && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-2" />}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
