import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="flex flex-col gap-2.5 text-sm font-bold text-slate-600 dark:text-slate-300">
    {label}
    {children}
  </label>
);

const commonInputClasses =
  'rounded-[18px] border border-slate-200/80 bg-white/50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-accent focus:ring-4 focus:ring-accent/5 sm:rounded-[22px] sm:px-5 sm:py-3.5 sm:text-base dark:border-slate-700/50 dark:bg-slate-950/50 dark:text-slate-100';

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={clsx(commonInputClasses, props.className)}
  />
);

export const Select = ({
  value,
  defaultValue,
  onChange,
  children,
  className,
  name
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (val: string) => void;
  children: ReactNode;
  className?: string;
  name?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const containerRef = useRef<HTMLDivElement>(null);

  const currentValue = value !== undefined ? value : internalValue;

  useEffect(() => {
    if (defaultValue !== undefined) {
      setInternalValue(defaultValue || '');
    }
  }, [defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [currentValue]);

  const options = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === 'option') {
      return {
        value: child.props.value || String(child.props.children),
        label: child.props.children as string,
      };
    }
    return null;
  })?.filter((opt): opt is { value: string; label: string } => opt !== null) || [];

  const selectedOption = options.find(opt => opt.value === currentValue);
  const visibleOptions = options.filter((opt) => opt.value !== currentValue);

  return (
    <div className="relative" ref={containerRef}>
      {name && <input type="hidden" name={name} value={currentValue} />}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          commonInputClasses,
          'flex w-full items-center justify-between pr-5 text-left',
          isOpen && 'border-accent ring-4 ring-accent/5',
          className
        )}
      >
        <span className="truncate">{selectedOption?.label || 'Select...'}</span>
        <ChevronDown size={18} className={clsx('transition-transform duration-300', isOpen && 'rotate-180 text-accent')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-[26px] border border-slate-200/60 bg-white/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
            {visibleOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">No other options</div>
            )}
            {visibleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsOpen(false);
                  if (value === undefined) {
                    setInternalValue(opt.value);
                  }
                  onChange?.(opt.value);
                  requestAnimationFrame(() => setIsOpen(false));
                }}
                className={clsx(
                  'w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800',
                  opt.value === currentValue ? 'bg-accent/10 text-accent' : 'text-slate-700 dark:text-slate-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={clsx(commonInputClasses, 'min-h-[100px] resize-none', props.className)}
  />
);
