'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

interface OptionItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

function getOptionsFromChildren(children: React.ReactNode): OptionItem[] {
  const options: OptionItem[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === 'option') {
      const props = child.props as { value?: string; disabled?: boolean; children?: React.ReactNode };
      options.push({
        value: props.value ?? '',
        label: props.children ?? props.value ?? '',
        disabled: props.disabled,
      });
    }
  });
  return options;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value, onChange, onBlur, id, disabled, name }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const selectRef = React.useRef<HTMLSelectElement>(null);
    const mergedRef = (el: HTMLSelectElement | null) => {
      (selectRef as React.MutableRefObject<HTMLSelectElement | null>).current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLSelectElement | null>).current = el;
    };
    const options = React.useMemo(() => getOptionsFromChildren(children), [children]);
    const currentValue = value === undefined || value === null ? '' : String(value);
    const selectedOption = options.find((o) => o.value === currentValue);
    const displayLabel = selectedOption ? selectedOption.label : null;

    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          onBlur?.({} as React.FocusEvent<HTMLSelectElement>);
        }
      };
      if (isOpen) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onBlur]);

    const handleClose = () => {
      setIsOpen(false);
      onBlur?.({} as React.FocusEvent<HTMLSelectElement>);
    };

    const handleSelect = (optionValue: string) => {
      if (selectRef.current) {
        selectRef.current.value = optionValue;
      }
      if (onChange) {
        const syntheticEvent = {
          target: {
            value: optionValue,
            name: name ?? selectRef.current?.name ?? '',
          },
          currentTarget: {
            value: optionValue,
            name: name ?? selectRef.current?.name ?? '',
          },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
      handleClose();
    };

    return (
      <div className="relative w-full" ref={containerRef}>
        <select
          ref={mergedRef}
          value={currentValue}
          onChange={onChange}
          name={name}
          disabled={disabled}
          aria-hidden
          tabIndex={-1}
          className="absolute h-0 w-0 opacity-0 pointer-events-none p-0 border-0"
          style={{ position: 'absolute', left: -9999 }}
        >
          {children}
        </select>
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((o) => !o)}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-lg border-2 bg-white dark:bg-gray-800 px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
            className
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={typeof displayLabel === 'string' ? displayLabel : 'Select option'}
        >
          <span className={displayLabel ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
            {displayLabel ?? 'Select...'}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-gray-500 transition-transform', isOpen && 'rotate-180')}
          />
        </button>

        {isOpen && (
          <ul
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 shadow-lg"
            role="listbox"
          >
            {options.map((opt) => {
              const isSelected = opt.value === currentValue;
              return (
                <li key={opt.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={cn(
                      'w-full px-3 py-2.5 text-left text-sm font-medium transition-colors',
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-900 dark:text-gray-100 hover:bg-blue-600 hover:text-white',
                      opt.disabled && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
