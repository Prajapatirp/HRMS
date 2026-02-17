'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, '0')
);

function parseValue(value: string): { year: string; monthIndex: number; day: string } {
  const datePart = (value || '').split('T')[0].trim();
  if (!datePart) {
    return { year: '', monthIndex: 0, day: '01' };
  }
  const parts = datePart.split('-');
  const y = parts[0] ?? '';
  const m = parts[1] ?? '1';
  const d = parts[2] ?? '1';
  const monthIndex = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
  const dayNum = parseInt(d, 10) || 1;
  const day = dayNum >= 1 && dayNum <= 31 ? String(dayNum).padStart(2, '0') : '01';
  return { year: y, monthIndex, day };
}

function toValue(year: string, monthIndex: number, day: string): string {
  const y = year.trim();
  if (!y) return '';
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = day && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31
    ? String(parseInt(day, 10)).padStart(2, '0')
    : '01';
  return `${y}-${m}-${d}`;
}

export interface MonthDayYearInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  label?: string;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  /** Show label as "Date Of Birth (MM/DD/YYYY)" style */
  labelFormat?: string;
}

export function MonthDayYearInput({
  value,
  onChange,
  onBlur,
  name,
  id,
  label = 'Date (MM/DD/YYYY)',
  required,
  error,
  disabled,
  className,
}: MonthDayYearInputProps) {
  const { year, monthIndex, day } = parseValue(value);
  const [openDropdown, setOpenDropdown] = useState<'month' | 'day' | null>(null);
  const [monthQuery, setMonthQuery] = useState('');
  const [dayQuery, setDayQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredMonths = MONTHS.filter((m) =>
    m.toLowerCase().includes(monthQuery.toLowerCase())
  );
  const filteredDays = DAYS.filter((d) =>
    d.includes(dayQuery)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMonthSelect = (index: number) => {
    onChange(toValue(year, index, day));
    setOpenDropdown(null);
    setMonthQuery('');
  };

  const handleDaySelect = (d: string) => {
    onChange(toValue(year, monthIndex, d));
    setOpenDropdown(null);
    setDayQuery('');
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
    onChange(toValue(v, monthIndex, day));
  };

  const inputBase = cn(
    'w-full rounded-lg border bg-white py-2.5 text-sm text-gray-900 transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
    'disabled:cursor-not-allowed disabled:opacity-50',
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-300 hover:border-gray-400'
  );

  return (
    <div ref={containerRef} className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        {/* Month - searchable dropdown */}
        <div className="relative flex-1 min-w-0">
          <div
            className={cn(
              inputBase,
              'flex items-center gap-1 pl-3 pr-9 cursor-pointer',
              openDropdown === 'month' && 'border-blue-500 ring-2 ring-blue-500/20'
            )}
            onClick={(e) => {
              if (disabled) return;
              if ((e.target as HTMLElement).closest('input')) return;
              setOpenDropdown((o) => (o === 'month' ? null : 'month'));
              if (openDropdown !== 'month') setMonthQuery('');
            }}
          >
            <input
              type="text"
              readOnly={openDropdown !== 'month'}
              value={openDropdown === 'month' ? monthQuery : MONTHS[monthIndex]}
              onChange={(e) => setMonthQuery(e.target.value)}
              onFocus={() => !disabled && setOpenDropdown('month')}
              className="flex-1 min-w-0 bg-transparent border-0 p-0 text-sm focus:ring-0 focus:outline-none cursor-pointer placeholder:text-gray-400"
              placeholder={openDropdown === 'month' ? 'Search month...' : ''}
            />
            <Search className="h-4 w-4 shrink-0 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          {openDropdown === 'month' && (
            <ul
              className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
              style={{ minWidth: 'var(--radix-popper-anchor-width, 160px)' }}
            >
              {filteredMonths.map((m) => {
                const idx = MONTHS.indexOf(m);
                const isSelected = idx === monthIndex;
                return (
                  <li
                    key={m}
                    onClick={() => handleMonthSelect(idx)}
                    className={cn(
                      'cursor-pointer px-3 py-2 text-sm',
                      isSelected
                        ? 'bg-blue-100 font-semibold text-blue-900'
                        : 'hover:bg-gray-100 text-gray-900'
                    )}
                  >
                    {m}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Day - dropdown */}
        <div className="relative w-20 shrink-0">
          <div
            className={cn(
              inputBase,
              'flex items-center justify-between pl-3 pr-8 cursor-pointer',
              openDropdown === 'day' && 'border-blue-500 ring-2 ring-blue-500/20'
            )}
            onClick={() => {
              if (disabled) return;
              setOpenDropdown((o) => (o === 'day' ? null : 'day'));
            }}
          >
            <span className="flex-1 truncate text-sm">{day}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
          </div>
          {openDropdown === 'day' && (
            <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {filteredDays.map((d) => {
                const isSelected = d === day;
                return (
                  <li
                    key={d}
                    onClick={() => handleDaySelect(d)}
                    className={cn(
                      'cursor-pointer px-3 py-2 text-sm',
                      isSelected
                        ? 'bg-blue-100 font-semibold text-blue-900'
                        : 'hover:bg-gray-100 text-gray-900'
                    )}
                  >
                    {d}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Year - text input */}
        <div className="relative w-24 shrink-0">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={year}
            onChange={handleYearChange}
            onBlur={onBlur}
            placeholder="YYYY"
            disabled={disabled}
            name={name}
            id={id}
            className={cn(inputBase, 'px-3')}
          />
        </div>
      </div>
    </div>
  );
}

export default MonthDayYearInput;
