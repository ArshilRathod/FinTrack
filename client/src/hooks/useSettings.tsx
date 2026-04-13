import { createContext, useContext, useEffect, useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from './useAuth';
import type { Setting } from '../lib/types';
import { getStoredSettings } from '../lib/utils';

const defaultSettings: Setting = {
  darkMode: false,
  currency: 'INR',
  region: 'India',
  notifications: true,
  budgetAlerts: true,
  billPaymentReminders: true,
  largeTransactionAlerts: true,
  weeklySpendingSummary: true,
  monthlyFinancialReport: true,
  automaticCategorizationRules: true,
  recurringTransactionSetup: true,
  autoBudgetAllocation: false,
  exportFormat: 'CSV'
};

type SettingsContextValue = {
  settings: Setting;
  isLoading: boolean;
  saveSettings: (payload: Partial<Setting>) => Promise<Setting>;
  isSaving: boolean;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider = ({ children }: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const { data, isLoading } = useQuery<Setting>({
    queryKey: ['settings'],
    enabled: Boolean(token),
    queryFn: async () => (await api.get('/settings')).data
  });

  const mutation = useMutation({
    mutationFn: async (payload: Partial<Setting>) => (await api.put('/settings', payload)).data,
    onSuccess: (nextSettings) => {
      queryClient.setQueryData(['settings'], nextSettings);
    }
  });

  const storedSettings = getStoredSettings();
  const settings = data || { ...defaultSettings, ...storedSettings };

  useEffect(() => {
    localStorage.setItem('fintrack-settings', JSON.stringify(settings));

    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      saveSettings: async (payload: Partial<Setting>) => mutation.mutateAsync(payload),
      isSaving: mutation.isPending
    }),
    [isLoading, mutation, settings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }

  return context;
};
