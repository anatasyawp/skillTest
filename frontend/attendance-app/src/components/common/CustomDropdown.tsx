import { FC, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value?: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * CustomDropdown:
 * Fully custom, theme-consistent UI dropdown component that replaces
 * raw OS/browser native <select> menus.
 * - Fits the trigger width perfectly (no OS overflowing blue menus).
 * - Styled with DEXAsync brand theme (deep maroon & red accents).
 * - Smooth chevron rotation, outside click handling, and keyboard Escape listener.
 */
export const CustomDropdown: FC<CustomDropdownProps> = ({
  value = '',
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  ariaLabel,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Selected option display text
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        aria-label={ariaLabel || placeholder}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[38px] rounded-xl border bg-white px-3.5 py-2 text-xs font-medium text-left flex items-center justify-between gap-2 shadow-2xs transition-all cursor-pointer ${
          isOpen
            ? 'border-[#800020] ring-2 ring-[#800020]/15'
            : 'border-slate-200 hover:border-[#800020]/40'
        } ${value ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#800020]' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel || placeholder}
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200/90 shadow-xl shadow-black/8 py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={`px-3.5 py-2 text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#800020]/10 text-[#800020] font-bold'
                    : 'text-slate-700 hover:bg-[#FFF5F7] hover:text-[#800020]'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#800020] shrink-0 stroke-[2.5]" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
