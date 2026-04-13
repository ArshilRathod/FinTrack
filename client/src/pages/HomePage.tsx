import { lazy, Suspense } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, MonitorX, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { CategoryBreakdownChart } from '../components/charts/CategoryBreakdownChart';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import type { DashboardData } from '../lib/types';
import { formatCurrency, formatDateByRegion } from '../lib/utils';

const CategoryPieChart = lazy(() => import('../components/charts/CategoryPieChart').then((module) => ({ default: module.CategoryPieChart })));

const ChartSkeleton = () => (
  <div className="flex h-72 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-400">
    Loading chart...
  </div>
);

export const HomePage = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const { data } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data
  });

  const invalidateDashboardQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const removeRecurringPaymentFromHome = useMutation({
    mutationFn: async (paymentId: string) =>
      api.put(`/recurring-payments/${paymentId}`, {
        showOnHome: false
      }),
    onSuccess: () => {
      invalidateDashboardQueries();
      queryClient.invalidateQueries({ queryKey: ['recurring-payments'] });
    }
  });

  if (!data || !user) return null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Financial health dashboard</p>
            <h1 className="mt-3 text-4xl font-bold text-slate-950 dark:text-white">{data.welcome.name}, your money system is starting to compound.</h1>
            <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-300">
              Track spending, monitor EMIs, and use AI-style recommendations to move income toward savings with fewer blind spots.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/expenses">
                <Button>Add Today&apos;s Expense</Button>
              </Link>
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700/80 dark:bg-slate-950/55">
            <p className="text-sm text-slate-500 dark:text-slate-400">Financial Health Score</p>
            <div className="mt-5 flex items-end gap-3">
              <span className="text-6xl font-black text-slate-950 dark:text-white">{data.healthScore}</span>
              <span className="pb-2 text-sm text-slate-500 dark:text-slate-400">/100</span>
            </div>
            <div className="mt-6 h-3 rounded-full bg-slate-200 dark:bg-slate-800/80">
              <div className="h-3 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${data.healthScore}%` }} />
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Calculated from savings rate, spending control, and debt ratio.</p>
          </div>
        </div>
      </Card>

      {settings.recurringTransactionSetup && !!data.recurringPayments.length && (
        <Card>
          <SectionHeader
            eyebrow="Recurring commitments"
            title="Policies, insurance, and fixed monthly payments"
            description="These are the recurring payments you chose to show on the Home page from Expense Tracking."
          />
          <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700/80 dark:bg-slate-950/55">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total monthly recurring payments</p>
              <p className="mt-3 text-4xl font-black text-slate-950 dark:text-white">{formatCurrency(data.summary.recurringCommitment)}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950/80">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Active plans</p>
                  <p className="mt-2 text-2xl font-bold">{data.summary.recurringCount}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950/80">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Next due</p>
                  <p className="mt-2 text-base font-bold">
                    {formatDateByRegion(data.recurringPayments[0].nextPaymentDate, settings.region)}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {data.recurringPayments.map((payment) => (
                <div key={payment._id} className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950/70 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold">{payment.title}</p>
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {payment.category}
                      </span>
                      {payment.autopay && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Autopay
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={15} />
                        {formatDateByRegion(payment.nextPaymentDate, settings.region)}
                      </span>
                      <span>{payment.frequency}</span>
                      <span>{payment.reminderDaysBefore} day reminder</span>
                    </div>
                    {payment.notes && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{payment.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold">{formatCurrency(payment.amount)}</p>
                    <button
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-800 dark:hover:text-rose-300"
                      onClick={() => removeRecurringPaymentFromHome.mutate(payment._id)}
                      type="button"
                    >
                      <MonitorX size={16} />
                      Remove from Home
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {!settings.recurringTransactionSetup && (
        <Card className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
          <Link to="/settings?focus=automation#settings-automation" className="underline">
            Recurring transaction setup is disabled in settings.
          </Link>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard label="Monthly Expense" value={formatCurrency(data.summary.monthlyExpense)} hint="Current month spend" />
        <MetricCard label="Active Loans / EMIs" value={String(data.summary.activeLoans)} hint={`${formatCurrency(data.summary.totalEmi)} monthly EMI`} />
        <MetricCard label="Savings Progress" value={`${data.summary.savingsProgress}%`} hint={`Goal: ${formatCurrency(data.welcome.savingsGoal)}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <SectionHeader eyebrow="Category breakdown" title="Where money is going" />
          <Suspense fallback={<ChartSkeleton />}>
            <CategoryPieChart data={data.charts.categoryTotals} />
          </Suspense>
        </Card>
        <Card>
          <SectionHeader
            eyebrow="Category split"
            title="Pressure by category"
            description="See which buckets are taking the biggest share of the current month."
          />
          <div className="mt-5">
            <CategoryBreakdownChart data={data.charts.categoryTotals} />
          </div>
        </Card>
      </div>

    </div>
  );
};
