import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, CheckSquare, Edit3, Landmark, LineChart, PiggyBank, Plus, ShieldCheck, Square, TrendingUp, Trash2, WalletCards, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field, Input, Select } from '../components/ui/Input';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useSettings } from '../hooks/useSettings';
import type { FinancialItemType, Loan } from '../lib/types';
import { formatCurrency, formatDateByRegion } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';

const itemTypeOptions: { value: FinancialItemType; label: string }[] = [
  { value: 'loan', label: 'Loan / EMI' },
  { value: 'fd', label: 'Fixed Deposit (FD)' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'investment', label: 'Investment' }
];

const itemTypeMeta: Record<
  FinancialItemType,
  {
    Icon: typeof Landmark;
    accent: string;
    surface: string;
    description: string;
  }
> = {
  loan: {
    Icon: Landmark,
    accent: 'text-amber-700 dark:text-amber-300',
    surface: 'from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900',
    description: 'Track principal, EMI amount, repayment pace, and next due date.'
  },
  fd: {
    Icon: PiggyBank,
    accent: 'text-emerald-700 dark:text-emerald-300',
    surface: 'from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900',
    description: 'Store deposit amount, interest rate, maturity date, and current value.'
  },
  insurance: {
    Icon: ShieldCheck,
    accent: 'text-sky-700 dark:text-sky-300',
    surface: 'from-sky-50 to-white dark:from-sky-950/40 dark:to-slate-900',
    description: 'Track premium due dates and keep policy amounts easy to review.'
  },
  investment: {
    Icon: TrendingUp,
    accent: 'text-fuchsia-700 dark:text-fuchsia-300',
    surface: 'from-fuchsia-50 to-white dark:from-fuchsia-950/40 dark:to-slate-900',
    description: 'Review planned check-ins, invested amount, and current portfolio value.'
  }
};

const dateLabels: Record<FinancialItemType, string> = {
  loan: 'Next EMI Date',
  fd: 'Maturity Date',
  insurance: 'Premium Due Date',
  investment: 'Review Date'
};

const emptyForm = {
  type: 'loan' as FinancialItemType,
  loanName: '',
  loanAmount: '',
  interestRate: '',
  tenure: '',
  emiAmount: '',
  nextEmiDate: new Date().toISOString().slice(0, 10),
  startDate: '',
  currentValue: '',
  amountPaid: ''
};

const filterOptions: { key: 'all' | FinancialItemType; label: string }[] = [
  { key: 'all', label: 'Select All' },
  { key: 'loan', label: 'Loans' },
  { key: 'fd', label: 'FD' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'investment', label: 'Investment' }
];

const createPayload = (form: typeof emptyForm) => ({
  type: form.type,
  loanName: form.loanName.trim(),
  loanAmount: parseFloat(form.loanAmount),
  interestRate: form.type === 'loan' || form.type === 'fd' ? Number(form.interestRate || 0) : 0,
  tenure: form.type === 'loan' ? Number(form.tenure || 0) : 0,
  emiAmount: form.type === 'loan' ? parseFloat(form.emiAmount || '0') : 0,
  nextEmiDate: form.nextEmiDate,
  startDate: form.startDate || undefined,
  currentValue: form.currentValue ? parseFloat(form.currentValue) : '',
  amountPaid: form.type === 'loan' ? parseFloat(form.amountPaid || '0') : 0
});

const getDisplayStatus = (item: Loan) => {
  if (item.status === 'Completed') return 'Completed';
  if (item.type === 'loan' && item.repaymentProgress >= 100) return 'Completed';
  return 'Active';
};

export const LoansPage = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectionStep, setSelectionStep] = useState<'select' | 'form'>('select');
  const [activeFilter, setActiveFilter] = useState<'all' | FinancialItemType>('all');
  const [isSelectingLoans, setIsSelectingLoans] = useState(false);
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);

  const { data } = useQuery<{ items: Loan[]; upcomingActions: Loan[]; reminders: { id: string; message: string; type: FinancialItemType }[] }>({
    queryKey: ['loans'],
    queryFn: async () => (await api.get('/loans')).data
  });

  const invalidateLoanQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['loans'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['insights'] });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectionStep('select');
    setEditingItemId(null);
    setForm(emptyForm);
  };

  const createItem = useMutation({
    mutationFn: async () => api.post('/loans', createPayload(form)),
    onSuccess: () => {
      closeForm();
      invalidateLoanQueries();
    }
  });

  const updateItem = useMutation({
    mutationFn: async (itemId: string) => api.put(`/loans/${itemId}`, createPayload(form)),
    onSuccess: () => {
      closeForm();
      invalidateLoanQueries();
    }
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => api.delete(`/loans/${itemId}`),
    onSuccess: () => {
      invalidateLoanQueries();
    }
  });

  const openTypeSelection = () => {
    setIsFormOpen(true);
    setSelectionStep('select');
    setEditingItemId(null);
    setForm(emptyForm);
  };

  const startCreateForType = (type: FinancialItemType) => {
    setForm((current) => ({
      ...emptyForm,
      type,
      nextEmiDate: current.nextEmiDate
    }));
    setSelectionStep('form');
  };

  const startEdit = (item: Loan) => {
    setEditingItemId(item._id);
    setForm({
      type: item.type,
      loanName: item.loanName,
      loanAmount: String(item.loanAmount),
      interestRate: String(item.interestRate || ''),
      tenure: String(item.tenure || ''),
      emiAmount: String(item.emiAmount || ''),
      nextEmiDate: item.nextEmiDate.slice(0, 10),
      startDate: item.startDate ? item.startDate.slice(0, 10) : '',
      currentValue: item.currentValue !== null ? String(item.currentValue) : '',
      amountPaid: String(item.amountPaid || '')
    });
    setSelectionStep('form');
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (!data?.items) return;
    setSelectedLoanIds((current) => current.filter((id) => data.items.some((item) => item._id === id)));
  }, [data?.items]);

  const filteredItems = useMemo(() => {
    const items = data?.items || [];
    return activeFilter === 'all' ? items : items.filter((item) => item.type === activeFilter);
  }, [activeFilter, data?.items]);

  const allLoanIds = useMemo(() => filteredItems.map((item) => item._id), [filteredItems]);
  const isAllLoansSelected = allLoanIds.length > 0 && selectedLoanIds.length === allLoanIds.length;

  const toggleLoanSelection = (itemId: string) => {
    setSelectedLoanIds((current) => current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]);
  };

  const toggleSelectAllLoans = () => {
    setSelectedLoanIds(isAllLoansSelected ? [] : allLoanIds);
  };

  const cancelLoanSelection = () => {
    setIsSelectingLoans(false);
    setSelectedLoanIds([]);
  };

  const bulkDeleteLoans = async () => {
    if (!selectedLoanIds.length) return;
    await Promise.all(selectedLoanIds.map((id) => deleteItem.mutateAsync(id)));
    cancelLoanSelection();
  };

  const deleteSingleLoan = async (item: Loan) => {
    const label = item.loanName || item.typeLabel || 'this item';
    if (!window.confirm(`Delete ${label}?`)) return;
    await deleteItem.mutateAsync(item._id);
  };

  const reminderMessages = useMemo(() => data?.reminders || [], [data?.reminders]);

  const upcomingActions = data?.upcomingActions || [];
  const showInterestRate = form.type === 'loan' || form.type === 'fd';
  const showTenure = form.type === 'loan';
  const showEmiAmount = form.type === 'loan';
  const showAmountPaid = form.type === 'loan';
  const activeTypeMeta = itemTypeMeta[form.type];
  const canPortal = typeof document !== 'undefined';

  useEffect(() => {
    const hasOpenModal = isFormOpen;
    const previousOverflow = document.body.style.overflow;

    if (hasOpenModal) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFormOpen]);

  useEffect(() => {
    if (form.type !== 'loan') return;

    const P = parseFloat(form.loanAmount);
    const R = parseFloat(form.interestRate);
    const N = parseInt(form.tenure);

    if (!isNaN(P) && !isNaN(N) && P > 0 && N > 0) {
      let emi = 0;
      if (!isNaN(R) && R > 0) {
        const r = R / 12 / 100;
        emi = (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
      } else {
        emi = P / N;
      }
      
      const emiString = emi.toFixed(2);
      if (form.emiAmount !== emiString) {
        setForm((prev) => ({ ...prev, emiAmount: emiString }));
      }
    }
  }, [form.loanAmount, form.interestRate, form.tenure, form.type]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <SectionHeader
            eyebrow="Financial tracker"
            title="Track loans, deposits, insurance, and investments"
            description="Stay on top of important dates and values without changing the familiar flow of the page."
            action={
              <Button className="justify-center" onClick={openTypeSelection}>
                <Plus size={16} />
                Add Item
              </Button>
            }
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Tracked items</p>
              <p className="mt-3 text-3xl font-bold">{data?.items.length || 0}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Upcoming actions</p>
              <p className="mt-3 text-3xl font-bold">{upcomingActions.length}</p>
            </div>
          </div>
          <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <WalletCards size={16} className="text-accent" />
              Simple reminders
            </div>
            <div className="mt-4 space-y-3">
              {reminderMessages.length ? (
                reminderMessages.map((reminder) => (
                  <div key={reminder.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    {reminder.message}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Reminders appear 3 days before, 1 day before, and on the date.</p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader eyebrow="Upcoming Actions" title="Nearest financial dates" action={<BellRing className="text-accent" />} />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {settings.billPaymentReminders ? (
              upcomingActions.length ? (
                upcomingActions.map((item) => (
                  <div key={item._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.typeLabel}</p>
                        <h4 className="mt-2 text-xl font-bold">{item.loanName}</h4>
                      </div>
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {item.actionStatus}
                      </span>
                    </div>
                    <p className="mt-3 font-semibold">{formatCurrency(item.currentValue ?? item.loanAmount)}</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {item.dateLabel}: {formatDateByRegion(item.nextEmiDate, settings.region)}
                    </p>
                    {item.reminderMessage && <p className="mt-3 text-sm text-accent">{item.reminderMessage}</p>}
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  Add a financial item to start seeing upcoming actions.
                </div>
              )
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                <Link to="/settings?focus=alerts#settings-alerts" className="underline">
                  Bill payment reminders are disabled in settings.
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader
          eyebrow="All Financial Items"
          title="Everything in one place"
          description="Filter by type and keep the existing loan progress experience intact."
          action={
            <Button className="justify-center" onClick={openTypeSelection}>
              <Plus size={16} />
              Add Item
            </Button>
          }
        />
        <div className="mt-5 flex flex-wrap gap-3">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setActiveFilter(option.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeFilter === option.key
                  ? 'bg-slate-900 text-white dark:bg-accent'
                  : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6">
          {filteredItems.length ? (
            filteredItems.map((item) => (
              <Card key={item._id}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {item.typeLabel}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                        {getDisplayStatus(item)}
                      </span>
                    </div>
                    {item.type === 'loan' ? (
                      <>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{item.interestRate}% interest</p>
                        <h3 className="mt-2 text-2xl font-bold">{item.loanName}</h3>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                          Principal {formatCurrency(item.loanAmount)} • Total interest {formatCurrency(item.totalInterest)}
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          {item.dateLabel}: {formatDateByRegion(item.nextEmiDate, settings.region)} • EMI {formatCurrency(item.emiAmount)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{item.dateLabel}</p>
                        <h3 className="mt-2 text-2xl font-bold">{item.loanName}</h3>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                          {item.currentValue !== null ? `Current value ${formatCurrency(item.currentValue)}` : `Amount ${formatCurrency(item.loanAmount)}`}
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          {formatDateByRegion(item.nextEmiDate, settings.region)} • {item.actionStatus}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex min-w-[260px] flex-col gap-4">
                    <div className="flex justify-end">
                      <div className="flex flex-wrap justify-end gap-2">
                        {(item.type === 'loan' || item.type === 'fd') && (
                          <button
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                            onClick={() => navigate(`/loans/${item._id}/breakdown`)}
                            type="button"
                          >
                            <LineChart size={16} />
                            View Breakdown
                          </button>
                        )}
                        <button
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                          onClick={() => startEdit(item)}
                          type="button"
                        >
                          <Edit3 size={16} />
                          Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 dark:border-rose-900/40 dark:text-rose-300 dark:hover:text-rose-200"
                          onClick={() => deleteSingleLoan(item)}
                          type="button"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                    {item.type === 'loan' ? (
                      <>
                        <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                          <span>Repayment progress</span>
                          <span>{item.repaymentProgress}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800">
                          <div className="h-3 rounded-full bg-gradient-to-r from-accent to-cyan-400" style={{ width: `${item.repaymentProgress}%` }} />
                        </div>
                      </>
                    ) : (
                      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-right dark:border-slate-800 dark:bg-slate-950">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Tracked value</p>
                        <p className="mt-2 text-2xl font-bold">{formatCurrency(item.currentValue ?? item.loanAmount)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              No financial items match the current filter.
            </div>
          )}
        </div>
      </Card>

      {isFormOpen && canPortal && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm md:p-8">
          <div className="mx-auto flex max-h-[calc(100vh-2rem)] max-w-3xl flex-col overflow-hidden rounded-[30px] border border-white/70 bg-white/95 shadow-panel backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 md:max-h-[calc(100vh-4rem)]">
            <div className="bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.16),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,0.96),_rgba(255,255,255,0.98))] px-6 py-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_30%),linear-gradient(180deg,_rgba(15,23,42,0.95),_rgba(15,23,42,0.98))] md:px-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                    Financial tracker
                  </span>
                  <SectionHeader
                    eyebrow={editingItemId ? 'Edit item' : 'Add financial item'}
                    title={selectionStep === 'select' && !editingItemId ? 'Choose item type' : 'Add Financial Item'}
                    description={
                      selectionStep === 'select' && !editingItemId
                        ? 'Pick one category first. The form will stay compact and only show the fields that matter.'
                        : 'Use the familiar form below to capture the key value and date for this item.'
                    }
                  />
                </div>
                <button
                  className="rounded-2xl border border-slate-200 bg-white/90 p-3 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-white"
                  onClick={closeForm}
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto bg-[linear-gradient(180deg,_rgba(248,250,252,0.82),_rgba(255,255,255,0.98))] px-6 py-6 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.9),_rgba(15,23,42,0.98))] md:px-8 md:py-7">
              <div className="mb-6 rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100/80 dark:bg-slate-900/55 dark:text-slate-400 dark:ring-slate-800/80">
                {selectionStep === 'select' && !editingItemId
                  ? 'Choose the kind of financial item you want to track.'
                  : `Selected type: ${itemTypeOptions.find((option) => option.value === form.type)?.label}`}
              </div>

            {selectionStep === 'select' && !editingItemId ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {itemTypeOptions.map((option) => (
                  (() => {
                    const meta = itemTypeMeta[option.value];
                    const Icon = meta.Icon;
                    return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => startCreateForType(option.value)}
                    className={`group overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br ${meta.surface} px-5 py-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-lg dark:border-slate-700`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Type</p>
                        <h3 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">{option.label}</h3>
                        <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600 dark:text-slate-300">{meta.description}</p>
                      </div>
                      <div className={`rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 ${meta.accent}`}>
                        <Icon size={20} />
                      </div>
                    </div>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                      Continue
                      <span className="transition group-hover:translate-x-0.5">→</span>
                    </div>
                  </button>
                    );
                  })()
                ))}
              </div>
            ) : (
              <form
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (editingItemId) {
                    updateItem.mutate(editingItemId);
                    return;
                  }
                  createItem.mutate();
                }}
              >
                <div className={`rounded-[28px] border border-slate-200 bg-gradient-to-br ${activeTypeMeta.surface} p-5 dark:border-slate-700`}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 ${activeTypeMeta.accent}`}>
                        <activeTypeMeta.Icon size={22} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Selected Type</p>
                        <h3 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                          {itemTypeOptions.find((option) => option.value === form.type)?.label}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{activeTypeMeta.description}</p>
                      </div>
                    </div>
                    <div className="min-w-[220px]">
                      <Field label="Type">
                        <Select value={form.type} onChange={(value) => setForm((current) => ({ ...current, type: value as FinancialItemType }))}>
                          {itemTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-950/70">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Core Details</p>
                    <div className="mt-4 space-y-4">
                      <Field label="Name">
                        <Input value={form.loanName} onChange={(event) => setForm((current) => ({ ...current, loanName: event.target.value }))} placeholder="Enter a clear item name" required />
                      </Field>
                      <Field label="Amount">
                        <Input type="number" min="0" step="0.01" inputMode="decimal" value={form.loanAmount} onChange={(event) => setForm((current) => ({ ...current, loanAmount: event.target.value }))} placeholder="0.00" required />
                      </Field>
                      <Field label={dateLabels[form.type]}>
                        <Input type="date" value={form.nextEmiDate} onChange={(event) => setForm((current) => ({ ...current, nextEmiDate: event.target.value }))} required />
                      </Field>
                      <Field label="Start Date (Optional)">
                        <Input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
                      </Field>
                      <Field label="Current Value (Optional)">
                        <Input type="number" min="0" step="0.01" inputMode="decimal" value={form.currentValue} onChange={(event) => setForm((current) => ({ ...current, currentValue: event.target.value }))} placeholder="Track today's value if needed" />
                      </Field>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-950/70">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Type-Specific Fields</p>
                    <div className="mt-4 space-y-4">
                      {showInterestRate ? (
                        <Field label="Interest Rate">
                          <Input type="number" min="0" step="0.01" inputMode="decimal" value={form.interestRate} onChange={(event) => setForm((current) => ({ ...current, interestRate: event.target.value }))} placeholder="e.g. 7.25" required={showInterestRate} />
                        </Field>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                          This item type keeps things lighter. No rate, EMI, or tenure fields are needed here.
                        </div>
                      )}
                      {showTenure && (
                        <Field label="Tenure (Months)">
                          <Input type="number" min="0" value={form.tenure} onChange={(event) => setForm((current) => ({ ...current, tenure: event.target.value }))} placeholder="e.g. 60" required />
                        </Field>
                      )}
                      {showEmiAmount && (
                        <Field label="EMI Amount">
                          <Input type="number" min="0" step="0.01" inputMode="decimal" value={form.emiAmount} onChange={(event) => setForm((current) => ({ ...current, emiAmount: event.target.value }))} placeholder="0.00" required />
                        </Field>
                      )}
                      {showAmountPaid && (
                        <Field label="Amount Paid">
                          <Input type="number" min="0" step="0.01" inputMode="decimal" value={form.amountPaid} onChange={(event) => setForm((current) => ({ ...current, amountPaid: event.target.value }))} placeholder="Optional progress so far" />
                        </Field>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <Button className="flex-1 justify-center" disabled={createItem.isPending || updateItem.isPending}>
                    {createItem.isPending || updateItem.isPending ? 'Saving...' : editingItemId ? 'Save Changes' : 'Save Item'}
                  </Button>
                  {!editingItemId && selectionStep === 'form' && (
                    <button
                      type="button"
                      onClick={() => setSelectionStep('select')}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                    >
                      Back
                    </button>
                  )}
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      , document.body)}

    </div>
  );
};
