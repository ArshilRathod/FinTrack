import { useState, useEffect } from 'react';
import { BellRing, Globe, Palette, Zap } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Field, Select } from '../components/ui/Input';
import { useSettings } from '../hooks/useSettings';
import type { Setting } from '../lib/types';
import { useLocation } from 'react-router-dom';

const TogglePill = ({
  value,
  onChange,
  trueLabel = 'Enabled',
  falseLabel = 'Disabled',
  leftLabel,
  rightLabel,
  leftValue,
  rightValue
}: {
  value: boolean;
  onChange: (val: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
  leftLabel?: string;
  rightLabel?: string;
  leftValue?: boolean;
  rightValue?: boolean;
}) => (
  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => onChange(leftValue ?? true)}
      className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
        value === (leftValue ?? true)
          ? 'bg-slate-950 text-white shadow-md hover:bg-slate-900 dark:bg-[#0f6f67] dark:hover:bg-[#0b5f59]'
          : 'border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
      }`}
    >
      {leftLabel ?? trueLabel}
    </button>
    <button
      type="button"
      onClick={() => onChange(rightValue ?? false)}
      className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
        value === (rightValue ?? false)
          ? 'bg-slate-950 text-white shadow-md hover:bg-slate-900 dark:bg-[#0f6f67] dark:hover:bg-[#0b5f59]'
          : 'border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
      }`}
    >
      {rightLabel ?? falseLabel}
    </button>
  </div>
);

export const SettingsPage = () => {
  const { settings, saveSettings, isSaving } = useSettings();
  const [form, setForm] = useState<Setting>(settings);
  const location = useLocation();
  const focus = new URLSearchParams(location.search).get('focus');

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const setB = (key: keyof Setting) => (val: boolean) => {
    const updated = { ...form, [key]: val };
    setForm(updated);
    void saveSettings({ [key]: val });
  };

  const setV = (key: keyof Setting) => (val: string | boolean) => {
    const updated = { ...form, [key]: val };
    setForm(current => ({ ...current, [key]: val }));
    void saveSettings({ [key]: val });
  };

  return (
    <Card className="dark:border-slate-700 dark:bg-slate-900/90">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Settings</p>
          <h2 className="mt-2 text-3xl font-bold">Application preferences</h2>
        </div>
        {isSaving && (
          <div className="flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-xs font-bold text-accent animate-pulse">
            <div className="h-2 w-2 rounded-full bg-accent" />
            Saving changes...
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* Currency & Region */}
        <section
          id="settings-currency"
          className={`md:col-span-2 group relative rounded-[35px] border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 ${
            focus === 'currency' ? 'ring-2 ring-emerald-500/60' : ''
          }`}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[35px]">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/5 blur-3xl transition-colors group-hover:bg-accent/10" />
          </div>
          <div className="relative flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-800/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Currency & Regional Preferences</h3>
          </div>
          <div className="relative mt-6 grid gap-6 md:grid-cols-2">
            <Field label="Currency Preference">
              <Select value={form.currency} onChange={setV('currency')}>
                {['INR', 'USD', 'EUR', 'GBP'].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Regional Preference">
              <Select value={form.region} onChange={setV('region')}>
                {['India', 'United States', 'United Kingdom', 'Europe'].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </Field>
          </div>
        </section>

        {/* Alerts & Reports */}
        <section
          id="settings-alerts"
          className={`md:col-span-2 group relative rounded-[35px] border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 ${
            focus === 'alerts' ? 'ring-2 ring-emerald-500/60' : ''
          }`}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[35px]">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-rose-500/5 blur-3xl transition-colors group-hover:bg-rose-500/10" />
          </div>
          <div className="relative flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-800/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <BellRing size={24} />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Alerts & Reports</h3>
          </div>
          <div className="relative mt-6 grid gap-6 md:grid-cols-2">
            <Field label="Budget limit alerts"><TogglePill value={form.budgetAlerts} onChange={setB('budgetAlerts')} /></Field>
            <Field label="Bill payment reminders"><TogglePill value={form.billPaymentReminders} onChange={setB('billPaymentReminders')} /></Field>
            <Field label="Large transaction alerts"><TogglePill value={form.largeTransactionAlerts} onChange={setB('largeTransactionAlerts')} /></Field>
            <Field label="Weekly spending summary"><TogglePill value={form.weeklySpendingSummary} onChange={setB('weeklySpendingSummary')} /></Field>
            <Field label="Monthly financial report"><TogglePill value={form.monthlyFinancialReport} onChange={setB('monthlyFinancialReport')} /></Field>
            <Field label="Notifications"><TogglePill value={form.notifications} onChange={setB('notifications')} /></Field>
          </div>
        </section>

        {/* Appearance */}
        <section
          id="settings-appearance"
          className={`group relative rounded-[35px] border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 ${
            focus === 'appearance' ? 'ring-2 ring-emerald-500/60' : ''
          }`}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[35px]">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl transition-colors group-hover:bg-indigo-500/10" />
          </div>
          <div className="relative flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-800/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Palette size={24} />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Appearance</h3>
          </div>
          <div className="relative mt-6 grid gap-6">
            <Field label="Theme">
              <TogglePill
                value={form.darkMode}
                onChange={setB('darkMode')}
                leftLabel="Light"
                rightLabel="Dark"
                leftValue={false}
                rightValue={true}
              />
            </Field>
            <Field label="Data Export">
              <div className="flex gap-2">
                {(['CSV', 'PDF'] as const).map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setV('exportFormat')(format)}
                    className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                      form.exportFormat === format
                        ? 'bg-slate-950 text-white shadow-md hover:bg-slate-900 dark:bg-[#0f6f67] dark:hover:bg-[#0b5f59]'
                        : 'border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </section>

        {/* Automation */}
        <section
          id="settings-automation"
          className={`group relative rounded-[35px] border border-slate-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 ${
            focus === 'automation' ? 'ring-2 ring-emerald-500/60' : ''
          }`}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[35px]">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-500/5 blur-3xl transition-colors group-hover:bg-amber-500/10" />
          </div>
          <div className="relative flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-800/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Automation Rules</h3>
          </div>
          <div className="relative mt-6 space-y-5">
            <Field label="Automatic categorization rules">
              <TogglePill value={form.automaticCategorizationRules} onChange={setB('automaticCategorizationRules')} />
            </Field>
            <p className="-mt-3 text-sm text-slate-500 dark:text-slate-400 opacity-70">Ex: Automatically map Swiggy to Food category.</p>
            <Field label="Recurring transaction setup">
              <TogglePill value={form.recurringTransactionSetup} onChange={setB('recurringTransactionSetup')} />
            </Field>
            <p className="-mt-3 text-sm text-slate-500 dark:text-slate-400 opacity-70">Rent, subscriptions, and salary tracking.</p>
            <Field label="Auto budget allocation">
              <TogglePill value={form.autoBudgetAllocation} onChange={setB('autoBudgetAllocation')} />
            </Field>
          </div>
        </section>
      </div>
    </Card>
  );
};
