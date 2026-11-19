import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  minDate?: string;
  maxDate?: string;
  align?: 'left' | 'right';
  triggerClassName?: string;
}

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const SHORT_MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const WEEKDAYS_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function toIsoDate(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function parseIsoDate(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}

function formatReadableId(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return iso;
  return `${String(parsed.day).padStart(2, '0')} ${SHORT_MONTHS_ID[parsed.month]} ${parsed.year}`;
}

export const CustomDatePicker: FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Pilih tanggal',
  label,
  ariaLabel,
  minDate,
  maxDate,
  align = 'left',
  triggerClassName = '',
}) => {
  const today = useMemo(() => {
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      iso: toIsoDate(d.getFullYear(), d.getMonth(), d.getDate()),
    };
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parseIsoDate(value)?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState(() => parseIsoDate(value)?.month ?? today.month);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const parsed = parseIsoDate(value);
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: Array<{ day: number; iso: string } | null> = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, iso: toIsoDate(viewYear, viewMonth, day) });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelect = (iso: string) => {
    onChange(iso);
    setIsOpen(false);
  };

  const isDisabled = (iso: string) => {
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <span className="block text-[11px] font-bold text-[#634E53] mb-1.5">{label}</span>
      )}

      <div className="relative flex items-center">
        <button
          type="button"
          aria-label={ariaLabel || label || placeholder}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full min-h-[42px] rounded-xl border bg-white pl-3.5 pr-9 py-2 text-sm text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
            isOpen
              ? 'border-[#800020] ring-2 ring-[#800020]/15'
              : value
              ? 'border-[#F2C8D2] hover:border-[#800020]/50'
              : 'border-[#E7DFE2] hover:border-[#800020]/40'
          } ${triggerClassName}`}
        >
          <span
            className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              value ? 'bg-[#FBE8EC] text-[#800020]' : 'bg-[#F7F4F5] text-[#634E53]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
          </span>
          <span
            className={`truncate font-mono-tabular ${
              value ? 'font-bold text-[#2A040A]' : 'font-medium text-[#8B757A]'
            }`}
          >
            {value ? formatReadableId(value) : placeholder}
          </span>
        </button>

        {value ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            aria-label={`Hapus ${label || placeholder}`}
            className="absolute right-2 h-7 w-7 rounded-full inline-flex items-center justify-center text-[#634E53] hover:bg-[#FBE8EC] hover:text-[#800020] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown
            className={`pointer-events-none absolute right-3 w-4 h-4 text-[#634E53] transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-[#800020]' : ''
            }`}
          />
        )}
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-label={`Kalender ${label || placeholder}`}
          className={`absolute top-full mt-2 z-50 w-[292px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl border border-[#ECE4E7] shadow-xl p-4 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Month Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Bulan sebelumnya"
              className="h-9 w-9 rounded-full hover:bg-[#F7F4F5] text-[#2A040A] inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-[#2A040A]">
              {MONTH_NAMES_ID[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Bulan berikutnya"
              className="h-9 w-9 rounded-full hover:bg-[#F7F4F5] text-[#2A040A] inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAYS_ID.map((dayName) => (
              <span key={dayName} className="text-[11px] font-bold text-[#634E53] py-1">
                {dayName}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <span key={`empty-${idx}`} className="h-9" />;
              }

              const selected = value === cell.iso;
              const isToday = today.iso === cell.iso;
              const disabled = isDisabled(cell.iso);

              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(cell.iso)}
                  aria-pressed={selected}
                  className={`h-9 w-9 mx-auto rounded-full text-xs font-mono-tabular font-bold transition-colors flex items-center justify-center ${
                    disabled
                      ? 'text-[#C8BCBF] cursor-not-allowed'
                      : selected
                      ? 'bg-[#800020] text-white cursor-pointer'
                      : isToday
                      ? 'bg-[#FBE8EC] text-[#800020] hover:bg-[#F5CFD8] cursor-pointer'
                      : 'text-[#2A040A] hover:bg-[#F7F4F5] cursor-pointer'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Quick Footer */}
          <div className="mt-3 pt-3 border-t border-[#F2ECEE] flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={isDisabled(today.iso)}
              onClick={() => handleSelect(today.iso)}
              className="min-h-[34px] px-3 rounded-full text-xs font-bold text-[#800020] hover:bg-[#FBE8EC] disabled:opacity-40 transition-colors cursor-pointer"
            >
              Hari Ini
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="min-h-[34px] px-3 rounded-full text-xs font-semibold text-[#634E53] hover:bg-[#F7F4F5] transition-colors cursor-pointer"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
