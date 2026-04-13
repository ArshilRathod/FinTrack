import { useMemo, useState } from 'react';
import { BrainCircuit, BarChart3, CalendarDays, FileBarChart2, Sparkles, X, RefreshCcw } from 'lucide-react';
import { TrendAreaChart } from '../components/charts/TrendAreaChart';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Field, Input, Select } from '../components/ui/Input';
import { useExpenses } from '../hooks/useExpenses';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { useAiInsights } from '../hooks/useAiInsights';
import { toneClasses } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Expense } from '../lib/types';

const investmentToneClasses: Record<string, string> = {
  critical: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-[#0d2426] dark:text-[#b7f5e4] dark:border-[#0f5f59]',
  warning: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-[#0d2426] dark:text-[#b7f5e4] dark:border-[#0f5f59]',
  positive: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-[#0d2426] dark:text-[#b7f5e4] dark:border-[#0f5f59]',
  info: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-[#0d2426] dark:text-[#b7f5e4] dark:border-[#0f5f59]'
};

export const InsightsPage = () => {
  const { expenses } = useExpenses();
  const { settings, saveSettings, isSaving } = useSettings();
  const { user } = useAuth();
  const { data: aiInsights, isLoading: aiInsightsLoading, refetch: refetchAiInsights, isFetching: aiInsightsFetching } = useAiInsights();
  const [activeChart, setActiveChart] = useState<'weekly' | 'monthly' | 'yearly' | null>(null);
  const [compareKeys, setCompareKeys] = useState<Array<'weekly' | 'monthly' | 'yearly'>>([]);
  const [lastAutoBudgetRun, setLastAutoBudgetRun] = useState<string | null>(() => localStorage.getItem('fintrack-auto-budget-run'));
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [activeBudgetId, setActiveBudgetId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<'weekly' | 'monthly' | 'yearly' | null>(null);

  const { weeklySeries, monthlySeries, yearlySeries, selectedMonthSeries, selectedYearSeries, weeklyTotal, monthlyTotal, yearlyTotal } = useMemo(() => {
    const safeExpenses = expenses || [];
    const now = new Date();

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const weeklySeries = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - index));
      const total = safeExpenses.reduce((sum: number, exp: Expense) => {
        const date = new Date(exp.date);
        return sameDay(date, day) ? sum + (Number(exp.amount) || 0) : sum;
      }, 0);
      return { month: day.toLocaleDateString(undefined, { weekday: 'short' }), amount: total };
    });

    const monthlySeries = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      const total = safeExpenses.reduce((sum: number, exp: Expense) => {
        const d = new Date(exp.date);
        return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth()
          ? sum + (Number(exp.amount) || 0)
          : sum;
      }, 0);
      return { month: date.toLocaleDateString(undefined, { month: 'short' }), amount: total };
    });

    const yearlySeries = Array.from({ length: 5 }, (_, index) => {
      const year = now.getFullYear() - (4 - index);
      const total = safeExpenses.reduce((sum: number, exp: Expense) => {
        const d = new Date(exp.date);
        return d.getFullYear() === year ? sum + (Number(exp.amount) || 0) : sum;
      }, 0);
      return { month: String(year), amount: total };
    });

    const [selectedYearStr, selectedMonthStr] = selectedMonth.split('-');
    const selectedMonthYear = Number(selectedYearStr);
    const selectedMonthIndex = Math.max(0, Number(selectedMonthStr || 1) - 1);
    const daysInSelectedMonth = Number.isFinite(selectedMonthYear) && Number.isFinite(selectedMonthIndex)
      ? new Date(selectedMonthYear, selectedMonthIndex + 1, 0).getDate()
      : 30;

    const selectedMonthSeries = Array.from({ length: daysInSelectedMonth }, (_, index) => {
      const day = index + 1;
      const total = safeExpenses.reduce((sum: number, exp: Expense) => {
        const d = new Date(exp.date);
        return d.getFullYear() === selectedMonthYear && d.getMonth() === selectedMonthIndex && d.getDate() === day
          ? sum + (Number(exp.amount) || 0)
          : sum;
      }, 0);
      return { month: String(day).padStart(2, '0'), amount: total };
    });

    const selectedYearSeries = Array.from({ length: 12 }, (_, index) => {
      const total = safeExpenses.reduce((sum: number, exp: Expense) => {
        const d = new Date(exp.date);
        return d.getFullYear() === selectedYear && d.getMonth() === index
          ? sum + (Number(exp.amount) || 0)
          : sum;
      }, 0);
      const label = new Date(2020, index, 1).toLocaleDateString(undefined, { month: 'short' });
      return { month: label, amount: total };
    });

    const weeklyTotal = weeklySeries.reduce((sum: number, point: { amount: number }) => sum + point.amount, 0);
    const monthlyTotal = monthlySeries[monthlySeries.length - 1]?.amount || 0;
    const yearlyTotal = yearlySeries[yearlySeries.length - 1]?.amount || 0;

    return { weeklySeries, monthlySeries, yearlySeries, selectedMonthSeries, selectedYearSeries, weeklyTotal, monthlyTotal, yearlyTotal };
  }, [expenses, selectedMonth, selectedYear]);

  const suggestedBudgets = useMemo(() => {
    const safeExpenses = expenses || [];
    const categoryTotals: Record<string, number> = {};
    safeExpenses.forEach((exp: Expense) => {
      const key = exp.category || 'Other';
      categoryTotals[key] = (categoryTotals[key] || 0) + (Number(exp.amount) || 0);
    });

    const totalSpent = Object.values(categoryTotals).reduce((sum: number, val: number) => sum + val, 0);
    if (!totalSpent) return [];

    const income = Number(user?.monthlyIncome) || 0;
    const savingsGoal = Number(user?.savingsGoal) || 0;
    const allocationBase = income > 0 ? Math.max(totalSpent, Math.max(0, income - savingsGoal)) : totalSpent;

    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, amount]) => {
        const share = amount / totalSpent;
        const limit = Math.max(0, Math.round(allocationBase * share));
        return {
          id: `auto-${category.toLowerCase()}`,
          name: `${category} Budget`,
          category,
          limit,
          period: 'Monthly',
          share
        };
      });
  }, [expenses, user?.monthlyIncome, user?.savingsGoal]);

  const categoryTotals = useMemo(() => {
    const safeExpenses = expenses || [];
    const totals: Record<string, number> = {};
    safeExpenses.forEach((exp: Expense) => {
      const key = exp.category || 'Other';
      totals[key] = (totals[key] || 0) + (Number(exp.amount) || 0);
    });
    const total = Object.values(totals).reduce((sum: number, val: number) => sum + val, 0);
    return { totals, total };
  }, [expenses]);

  const activeBudget = useMemo(() => suggestedBudgets.find((budget) => budget.id === activeBudgetId) || null, [activeBudgetId, suggestedBudgets]);

  const realtimeInsights = useMemo(() => {
    const safeExpenses = expenses || [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyExpenses = safeExpenses.filter((expense: Expense) => {
      const d = new Date(expense.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const income = Number(user?.monthlyIncome) || 0;
    const savingsGoal = Number(user?.savingsGoal) || 0;
    const netAfterSpend = income - monthlyTotal;

    const categoryTotals: Record<string, number> = {};
    monthlyExpenses.forEach((exp) => {
      const key = exp.category || 'Other';
      categoryTotals[key] = (categoryTotals[key] || 0) + (Number(exp.amount) || 0);
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    const weeklyAvg = weeklySeries.reduce((sum, point) => sum + point.amount, 0) / 7;

    const investmentSignals = monthlyExpenses.filter((exp) => {
      const note = `${exp.notes || ''} ${exp.paymentMethod || ''}`.toLowerCase();
      return note.includes('invest') || note.includes('mutual') || note.includes('sip') || exp.category === 'Investment';
    });

    const expenseInsights = [
      {
        title: 'Monthly Spend Check',
        description:
          income > 0
            ? `You have spent ₹${Math.round(monthlyTotal).toLocaleString()} out of ₹${Math.round(income).toLocaleString()} this month.`
            : `You have spent ₹${Math.round(monthlyTotal).toLocaleString()} this month.`,
        tone: monthlyTotal > income * 0.9 && income > 0 ? 'warning' : 'info'
      },
      topCategory
        ? {
            title: 'Top Spending Category',
            description: `${topCategory[0]} is leading at ₹${Math.round(topCategory[1]).toLocaleString()} this month.`,
            tone: 'info'
          }
        : {
            title: 'Top Spending Category',
            description: 'Add more expenses to identify your biggest category.',
            tone: 'info'
          },
      {
        title: 'Weekly Spend Pace',
        description: `Average per week this month: ₹${Math.round(weeklyAvg || 0).toLocaleString()}.`,
        tone: 'info'
      }
    ];

    const savingsInsights = [
      {
        title: 'Savings Target Status',
        description:
          income > 0
            ? `Target: ₹${Math.round(savingsGoal).toLocaleString()}. Remaining after spend: ₹${Math.round(netAfterSpend).toLocaleString()}.`
            : 'Set monthly income to unlock savings insights.',
        tone: netAfterSpend >= savingsGoal && income > 0 ? 'positive' : 'warning'
      },
      {
        title: 'Auto Allocation',
        description: settings.autoBudgetAllocation
          ? 'Auto budget allocation is enabled and will rebalance budgets.'
          : 'Auto budget allocation is off. Enable to automate budget distribution.',
        tone: settings.autoBudgetAllocation ? 'positive' : 'info'
      }
    ];

    const investmentInsights = [
      investmentSignals.length > 0
        ? {
            title: 'Investment Activity',
            description: `You have ${investmentSignals.length} investment-related entries this month. Keep it consistent to build momentum.`,
            tone: 'positive'
          }
        : {
            title: 'Investment Activity',
            description: 'No investment activity spotted this month. Consider starting a small SIP.',
            tone: 'info'
          }
    ];

    return { expenseInsights, savingsInsights, investmentInsights };
  }, [expenses, settings.autoBudgetAllocation, user?.monthlyIncome, user?.savingsGoal, weeklySeries]);


  const chartMeta = {
    weekly: { title: 'Weekly Spending', subtitle: 'Last 7 days', data: weeklySeries },
    monthly: { title: 'Monthly Spending', subtitle: 'Last 12 months', data: monthlySeries },
    yearly: { title: 'Yearly Spending', subtitle: 'Last 5 years', data: yearlySeries }
  } as const;

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    (expenses || []).forEach((exp) => years.add(new Date(exp.date).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses]);

  const toggleCompare = (key: 'weekly' | 'monthly' | 'yearly') => {
    setCompareKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const applyAutoBudgets = () => {
    const existingRaw = localStorage.getItem('fintrack-budget-plans');
    let existing: any[] = [];
    if (existingRaw) {
      try {
        existing = JSON.parse(existingRaw);
      } catch {
        existing = [];
      }
    }

    const cleaned = existing.filter((budget) => !budget.autoGenerated);
    const generated = suggestedBudgets.map((budget) => ({
      id: budget.id,
      name: budget.name,
      limit: budget.limit,
      period: budget.period,
      autoGenerated: true
    }));

    const next = [...cleaned, ...generated];
    localStorage.setItem('fintrack-budget-plans', JSON.stringify(next));
    const timestamp = new Date().toISOString();
    localStorage.setItem('fintrack-auto-budget-run', timestamp);
    setLastAutoBudgetRun(timestamp);
  };

  const downloadCsv = (filename: string, rows: Array<Record<string, string | number>>) => {
    if (typeof document === 'undefined') return;
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = (title: string, subtitle: string, rows: Array<{ label: string; amount: number }>, totalLabel: string) => {
    if (typeof window === 'undefined') return;
    const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin: 0 0 8px; font-size: 22px; }
            p { margin: 0 0 16px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
            th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
            .total { margin-top: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>${subtitle}</p>
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map((row) => `<tr><td>${row.label}</td><td>${row.amount}</td></tr>`)
                .join('')}
            </tbody>
          </table>
          <div class="total">${totalLabel}: ₹${Math.round(total).toLocaleString()}</div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const reportMeta = {
    weekly: {
      title: 'Weekly Report',
      subtitle: 'Last 7 days',
      totalLabel: 'Total spend (last 7 days)',
      totalValue: weeklyTotal,
      rows: weeklySeries.map((point) => ({ label: point.month, amount: Math.round(point.amount) }))
    },
    monthly: {
      title: 'Monthly Report',
      subtitle: 'Last 12 months',
      totalLabel: 'Total spend (current month)',
      totalValue: monthlyTotal,
      rows: monthlySeries.map((point) => ({ label: point.month, amount: Math.round(point.amount) }))
    },
    yearly: {
      title: 'Yearly Report',
      subtitle: 'Last 5 years',
      totalLabel: 'Total spend (current year)',
      totalValue: yearlyTotal,
      rows: yearlySeries.map((point) => ({ label: point.month, amount: Math.round(point.amount) }))
    }
  } as const;

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader
          eyebrow="Real AI insights"
          title="Generate AI insights"
          description={aiInsightsLoading || aiInsightsFetching ? 'Generating insights…' : 'Click generate to fetch expense, savings, and investment insights.'}
          action={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => refetchAiInsights()}
                disabled={aiInsightsFetching}
                className="rounded-2xl px-4 h-10 text-xs font-bold uppercase tracking-widest"
              >
                <RefreshCcw size={14} className={aiInsightsFetching ? 'animate-spin' : ''} />
                <span className="ml-2">Generate</span>
              </Button>
              <BrainCircuit size={30} className="text-accent" />
            </div>
          }
        />
      </Card>

      {aiInsights && (
        <Card>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Expense Insights</p>
              {aiInsights.expenseInsights.map((insight) => (
                <div key={insight.title} className={`rounded-3xl border p-4 ${toneClasses[insight.tone]}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">{insight.tone}</p>
                  <p className="mt-2 text-lg font-bold">{insight.title}</p>
                  <p className="mt-2 text-sm">{insight.description}</p>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Savings Insights</p>
              {aiInsights.savingsInsights.map((insight) => (
                <div key={insight.title} className={`rounded-3xl border p-4 ${toneClasses[insight.tone]}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">{insight.tone}</p>
                  <p className="mt-2 text-lg font-bold">{insight.title}</p>
                  <p className="mt-2 text-sm">{insight.description}</p>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Investment Insights</p>
              {aiInsights.investmentInsights.map((insight) => (
                <div key={insight.title} className={`rounded-3xl border p-4 ${investmentToneClasses[insight.tone]}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">{insight.tone}</p>
                  <p className="mt-2 text-lg font-bold">{insight.title}</p>
                  <p className="mt-2 text-sm">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <SectionHeader
          eyebrow="Charts"
          title="Pick a view to expand"
          description="Select weekly, monthly, or yearly to open a full-size chart and compare."
          action={<BarChart3 size={30} className="text-accent" />}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {(['weekly', 'monthly', 'yearly'] as const).map((key) => (
          <Card
            key={key}
            className="group cursor-pointer"
            onClick={() => setActiveChart(key)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setActiveChart(key);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Open ${chartMeta[key].title} chart`}
          >
            <SectionHeader eyebrow={chartMeta[key].title} title={chartMeta[key].subtitle} action={<CalendarDays size={22} className="text-accent" />} />
            <TrendAreaChart data={chartMeta[key].data} />
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveChart(key);
                }}
              >
                Expand
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionHeader
          eyebrow="Reports"
          title="Weekly, monthly, and yearly summaries"
          description="Quick totals you can use for reporting, with downloadable exports."
          action={<FileBarChart2 size={30} className="text-accent" />}
        />
      </Card>

      {(!settings.weeklySpendingSummary || !settings.monthlyFinancialReport) && (
        <Card className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
          {!settings.weeklySpendingSummary && (
            <p>
              <Link to="/settings?focus=alerts#settings-alerts" className="underline">
                Weekly spending summary is disabled in settings.
              </Link>
            </p>
          )}
          {!settings.monthlyFinancialReport && (
            <p className={settings.weeklySpendingSummary ? '' : 'mt-1'}>
              <Link to="/settings?focus=alerts#settings-alerts" className="underline">
                Monthly financial report is disabled in settings.
              </Link>
            </p>
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          className="border cursor-pointer"
          onClick={() => setActiveReport('weekly')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setActiveReport('weekly');
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Open weekly report"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Weekly Report</p>
          <p className="mt-3 text-3xl font-black">₹{Math.round(weeklyTotal).toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-500">Total spend in the last 7 days.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCsv('weekly-report.csv', reportMeta.weekly.rows)}>
              Download CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadPdf(reportMeta.weekly.title, reportMeta.weekly.subtitle, reportMeta.weekly.rows, reportMeta.weekly.totalLabel)}>
              Download PDF
            </Button>
          </div>
        </Card>
        <Card
          className="border cursor-pointer"
          onClick={() => setActiveReport('monthly')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setActiveReport('monthly');
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Open monthly report"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Monthly Report</p>
          <p className="mt-3 text-3xl font-black">₹{Math.round(monthlyTotal).toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-500">Total spend in the current month.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCsv('monthly-report.csv', reportMeta.monthly.rows)}>
              Download CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadPdf(reportMeta.monthly.title, reportMeta.monthly.subtitle, reportMeta.monthly.rows, reportMeta.monthly.totalLabel)}>
              Download PDF
            </Button>
          </div>
        </Card>
        <Card
          className="border cursor-pointer"
          onClick={() => setActiveReport('yearly')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setActiveReport('yearly');
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Open yearly report"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Yearly Report</p>
          <p className="mt-3 text-3xl font-black">₹{Math.round(yearlyTotal).toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-500">Total spend in the current year.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCsv('yearly-report.csv', reportMeta.yearly.rows)}>
              Download CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadPdf(reportMeta.yearly.title, reportMeta.yearly.subtitle, reportMeta.yearly.rows, reportMeta.yearly.totalLabel)}>
              Download PDF
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader
          eyebrow="Automation"
          title="Real-time auto budget allocation"
          description="Auto-generate budgets based on your real spending patterns."
          action={<Sparkles size={30} className="text-accent" />}
        />
        <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/70 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold">Status</p>
            <p className="text-sm text-slate-500">
              {settings.autoBudgetAllocation ? 'Enabled and actively balancing budgets.' : 'Disabled — no automatic changes applied.'}
            </p>
            {!settings.autoBudgetAllocation && (
              <p className="mt-1 text-xs text-slate-400">
                <Link to="/settings?focus=automation#settings-automation" className="underline">
                  Auto budget allocation is disabled in settings.
                </Link>
              </p>
            )}
            {lastAutoBudgetRun && (
              <p className="mt-1 text-xs text-slate-400">
                Last generated: {new Date(lastAutoBudgetRun).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={applyAutoBudgets}
              disabled={suggestedBudgets.length === 0}
            >
              Generate Budgets
            </Button>
            <Link to="/expenses" className="inline-flex">
              <Button variant="ghost">Open Budget Planner</Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {suggestedBudgets.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
              Add some expenses this month to generate personalized budget suggestions.
            </div>
          ) : (
            suggestedBudgets.map((budget) => (
              <button
                key={budget.id}
                type="button"
                onClick={() => setActiveBudgetId(budget.id)}
                className="rounded-3xl border border-slate-100 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-soft dark:border-slate-800 dark:bg-slate-950/70"
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{budget.period}</p>
                <p className="mt-2 text-lg font-bold">{budget.name}</p>
                <p className="mt-3 text-3xl font-black">₹{Math.round(budget.limit).toLocaleString()}</p>
                <p className="mt-2 text-xs text-slate-500">Based on {Math.round(budget.share * 100)}% of your spend.</p>
              </button>
            ))
          )}
        </div>
      </Card>

      {activeChart && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setActiveChart(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[40px] shadow-3xl border border-white/40 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">{chartMeta[activeChart].title}</h3>
                <p className="text-slate-500 text-sm mt-1 font-medium">{chartMeta[activeChart].subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveChart(null);
                  setCompareKeys([]);
                }}
                className="w-12 h-12 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="rounded-[28px] border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 p-6">
                <TrendAreaChart data={chartMeta[activeChart].data} />
              </div>
              {activeChart === 'monthly' && (
                <div className="rounded-[28px] border border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 p-6 space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Individual Month</p>
                      <p className="text-xs text-slate-500">Pick a month to see daily spend.</p>
                    </div>
                    <div className="min-w-[200px]">
                      <Field label="Month">
                        <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                      </Field>
                    </div>
                  </div>
                  <TrendAreaChart data={selectedMonthSeries} />
                </div>
              )}
              {activeChart === 'yearly' && (
                <div className="rounded-[28px] border border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 p-6 space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Year-wise Breakdown</p>
                      <p className="text-xs text-slate-500">Pick a year to see month-by-month spend.</p>
                    </div>
                    <div className="min-w-[160px]">
                      <Field label="Year">
                        <Select value={String(selectedYear)} onChange={(val) => setSelectedYear(Number(val))}>
                          {availableYears.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                  </div>
                  <TrendAreaChart data={selectedYearSeries} />
                </div>
              )}

              <div className="rounded-[24px] border border-slate-100 dark:border-white/5 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Compare With</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {(['weekly', 'monthly', 'yearly'] as const)
                    .filter((key) => key !== activeChart)
                    .map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleCompare(key)}
                        className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
                          compareKeys.includes(key)
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-slate-200 text-slate-500 hover:border-accent/50 hover:text-accent'
                        }`}
                      >
                        {chartMeta[key].title}
                      </button>
                    ))}
                </div>

                {compareKeys.length > 0 && (
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {compareKeys.map((key) => (
                      <div key={key} className="rounded-[20px] border border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 p-5">
                        <p className="text-sm font-semibold">{chartMeta[key].title}</p>
                        <p className="text-xs text-slate-500 mb-3">{chartMeta[key].subtitle}</p>
                        <TrendAreaChart data={chartMeta[key].data} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeBudgetId && activeBudget && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setActiveBudgetId(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[36px] shadow-3xl border border-white/40 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">{activeBudget.category} Budget</h3>
                <p className="text-slate-500 text-sm mt-1 font-medium">Category-only spend and share.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveBudgetId(null)}
                className="w-12 h-12 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {(() => {
                const categoryAmount = categoryTotals.totals[activeBudget.category] || 0;
                const percent = categoryTotals.total > 0 ? Math.round((categoryAmount / categoryTotals.total) * 100) : 0;
                return (
                  <div className="rounded-2xl border border-slate-100 bg-white px-6 py-6 dark:border-slate-800 dark:bg-slate-950/70">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{activeBudget.category}</p>
                        <p className="text-xs text-slate-500">{percent}% of total spend</p>
                      </div>
                      <p className="text-2xl font-black">₹{Math.round(categoryAmount).toLocaleString()}</p>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min(100, percent)}%` }} />
                    </div>
                    <p className="mt-3 text-xs text-slate-500">This is the total spend recorded for this category.</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {activeReport && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setActiveReport(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[36px] shadow-3xl border border-white/40 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">{reportMeta[activeReport].title}</h3>
                <p className="text-slate-500 text-sm mt-1 font-medium">{reportMeta[activeReport].subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveReport(null)}
                className="w-12 h-12 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="rounded-[24px] border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{reportMeta[activeReport].totalLabel}</p>
                  <p className="mt-2 text-3xl font-black">₹{Math.round(reportMeta[activeReport].totalValue).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadCsv(`${activeReport}-report.csv`, reportMeta[activeReport].rows)}>
                    Download CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadPdf(reportMeta[activeReport].title, reportMeta[activeReport].subtitle, reportMeta[activeReport].rows, reportMeta[activeReport].totalLabel)}>
                    Download PDF
                  </Button>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 p-6">
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white/95 dark:bg-slate-900/95">
                      <tr>
                        <th className="px-2 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">Label</th>
                        <th className="px-2 py-3 text-xs uppercase tracking-[0.2em] text-slate-400 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportMeta[activeReport].rows.map((row) => (
                        <tr key={row.label} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-2 py-3 font-semibold">{row.label}</td>
                          <td className="px-2 py-3 text-right font-semibold">₹{Math.round(row.amount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
