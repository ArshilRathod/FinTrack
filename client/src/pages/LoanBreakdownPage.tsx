import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useSettings } from '../hooks/useSettings';
import { getBreakdownRows } from '../lib/loanBreakdown';
import type { Loan } from '../lib/types';
import { formatCurrency, formatDateByRegion } from '../lib/utils';

export const LoanBreakdownPage = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { id } = useParams();

  const { data, isLoading } = useQuery<{ items: Loan[] }>({
    queryKey: ['loans'],
    queryFn: async () => (await api.get('/loans')).data
  });

  const item = useMemo(() => data?.items.find((entry) => entry._id === id), [data?.items, id]);
  const breakdownRows = useMemo(() => (item ? getBreakdownRows(item) : []), [item]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/loans')} className="rounded-2xl px-4 py-2">
          <ArrowLeft size={16} /> Back to EMI & Loans
        </Button>
        <Card>
          <SectionHeader
            eyebrow="Breakdown"
            title="Item not found"
            description="The financial item you requested is no longer available."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="outline" onClick={() => navigate('/loans')} className="rounded-2xl px-4 py-2">
          <ArrowLeft size={16} /> Back to EMI & Loans
        </Button>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Year-by-year view</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{item.loanName}</p>
        </div>
      </div>

      <Card>
        <SectionHeader
          eyebrow={item.type === 'loan' ? 'Loan Breakdown' : 'FD Breakdown'}
          title={`${item.loanName} performance timeline`}
          description="Full screen breakdown so you can review each year without the popup."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">Type</p>
            <p className="mt-2 text-xl font-bold">{item.typeLabel}</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">Base Amount</p>
            <p className="mt-2 text-xl font-bold">{formatCurrency(item.loanAmount)}</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">{item.dateLabel}</p>
            <p className="mt-2 text-xl font-bold">{formatDateByRegion(item.nextEmiDate, settings.region)}</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">{item.type === 'loan' ? 'EMI / Progress' : 'Current Value'}</p>
            <p className="mt-2 text-xl font-bold">
              {item.type === 'loan'
                ? `${formatCurrency(item.emiAmount)} / ${item.repaymentProgress}%`
                : formatCurrency(item.currentValue ?? item.loanAmount)}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-100 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-300">
                <tr>
                  <th className="px-5 py-4">Year</th>
                  <th className="px-5 py-4">Opening</th>
                  <th className="px-5 py-4">{item.type === 'loan' ? 'EMI Paid' : 'Contribution'}</th>
                  <th className="px-5 py-4">{item.type === 'loan' ? 'Interest Paid' : 'Interest / Growth'}</th>
                  <th className="px-5 py-4">Closing</th>
                  <th className="px-5 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900">
                {breakdownRows.map((row) => (
                  <tr key={row.year} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-5 py-4 font-semibold">{row.year}</td>
                    <td className="px-5 py-4">{formatCurrency(row.openingValue)}</td>
                    <td className="px-5 py-4">{formatCurrency(row.contribution)}</td>
                    <td className="px-5 py-4">{formatCurrency(row.interestOrGrowth)}</td>
                    <td className="px-5 py-4 font-semibold">{formatCurrency(row.closingValue)}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};
