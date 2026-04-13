import type { Setting } from './types';

export const getStoredSettings = (): Partial<Setting> => {
  if (typeof window === 'undefined') {
    return {};
  }

  const rawSettings = localStorage.getItem('fintrack-settings');

  if (!rawSettings) {
    return {};
  }

  try {
    return JSON.parse(rawSettings) as Partial<Setting>;
  } catch {
    return {};
  }
};

export const getLocaleFromRegion = (region?: string) => {
  switch (region) {
    case 'United States':
      return 'en-US';
    case 'United Kingdom':
      return 'en-GB';
    case 'Europe':
      return 'en-IE';
    case 'India':
    default:
      return 'en-IN';
  }
};

export const formatCurrency = (value: number, currency?: string, region?: string) => {
  const storedSettings = getStoredSettings();
  const resolvedCurrency = currency || storedSettings.currency || 'INR';
  const resolvedRegion = region || storedSettings.region || 'India';

  return new Intl.NumberFormat(getLocaleFromRegion(resolvedRegion), {
    style: 'currency',
    currency: resolvedCurrency,
    maximumFractionDigits: 0
  }).format(value || 0);
};

export const formatDateByRegion = (value: string | Date, region?: string) => {
  const storedSettings = getStoredSettings();
  const resolvedRegion = region || storedSettings.region || 'India';

  return new Intl.DateTimeFormat(getLocaleFromRegion(resolvedRegion)).format(new Date(value));
};

export const toneClasses: Record<string, string> = {
  critical: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-[#0d2426] dark:text-[#b7f5e4] dark:border-[#0f5f59]',
  warning: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-[#0d2426] dark:text-[#b7f5e4] dark:border-[#0f5f59]',
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-[#0d2426] dark:text-[#b7f5e4] dark:border-[#0f5f59]',
  info: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-[#0d2426] dark:text-[#b7f5e4] dark:border-[#0f5f59]'
};
