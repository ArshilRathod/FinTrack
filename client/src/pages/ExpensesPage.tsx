import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, CheckSquare, Edit3, Maximize2, MonitorUp, Square, Trash2, UploadCloud, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { Link } from 'react-router-dom';
import type { Expense, RecurringPayment } from '../lib/types';
import { formatCurrency, formatDateByRegion } from '../lib/utils';

const emptyForm = {
  amount: '',
  category: 'Food',
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: 'UPI',
  notes: ''
};

const defaultCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Others'] as const;

const emptyBudgetForm = {
  name: '',
  limit: '',
  period: 'Monthly',
  category: 'All Categories'
};

const emptyRecurringForm = {
  title: '',
  amount: '',
  dueDate: '',
  frequency: 'Monthly'
};

type BudgetPlan = {
  id: string;
  name: string;
  limit: number;
  period: string;
  category: string;
};

export const ExpensesPage = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ category: '', from: '', to: '' });
  const [form, setForm] = useState(emptyForm);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isSelectingExpenses, setIsSelectingExpenses] = useState(false);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState<string>('Food');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetForm, setBudgetForm] = useState(emptyBudgetForm);
  const [recurringForm, setRecurringForm] = useState(emptyRecurringForm);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [localCategories, setLocalCategories] = useState<string[]>(() => {
    const stored = localStorage.getItem('fintrack-custom-categories');
    return stored ? JSON.parse(stored) : [];
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<Array<{
    amount: number;
    category: string;
    date: string;
    paymentMethod: string;
    notes: string;
    valid: boolean;
    errors: string[];
  }>>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const budgetKey = `fintrack-budget-plans-${user?.id ?? 'guest'}`;
  const [budgets, setBudgets] = useState<BudgetPlan[]>(() => {
    const storedBudgets = localStorage.getItem(`fintrack-budget-plans-${user?.id ?? 'guest'}`);
    if (storedBudgets) {
      try {
        const parsed = JSON.parse(storedBudgets);
        // Remove any default "Primary budget" that was auto-generated previously
        return Array.isArray(parsed) ? parsed.filter((b: any) => b.name !== 'Primary budget') : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const { data } = useQuery<{ expenses: Expense[]; summary: { total: number; count: number; categoryBreakdown: { category: string; amount: number }[] } }>({
    queryKey: ['expenses', filters],
    queryFn: async () => (await api.get('/expenses', { params: filters })).data
  });
  const { data: recurringPaymentsData } = useQuery<{ recurringPayments: RecurringPayment[] }>({
    queryKey: ['recurring-payments'],
    queryFn: async () => (await api.get('/recurring-payments')).data
  });

  useEffect(() => {
    if (!data?.expenses) return;
    setSelectedExpenseIds((current) => current.filter((id) => data.expenses.some((expense) => expense._id === id)));
  }, [data?.expenses]);

  const invalidateExpenseQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['insights'] });
    queryClient.invalidateQueries({ queryKey: ['recurring-payments'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const createMutation = useMutation({
    mutationFn: async () => api.post('/expenses', { ...form, amount: Number(form.amount) }),
    onSuccess: () => {
      setForm(emptyForm);
      invalidateExpenseQueries();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (expenseId: string) => api.put(`/expenses/${expenseId}`, { ...form, amount: Number(form.amount) }),
    onSuccess: () => {
      setForm(emptyForm);
      setEditingExpenseId(null);
      invalidateExpenseQueries();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (expenseId: string) => api.delete(`/expenses/${expenseId}`),
    onSuccess: (_data, expenseId) => {
      if (editingExpenseId === expenseId) {
        setEditingExpenseId(null);
        setForm(emptyForm);
      }
      invalidateExpenseQueries();
    }
  });

  const monthlyAverage = useMemo(() => {
    if (!data?.summary.count) return 0;
    return data.summary.total / data.summary.count;
  }, [data]);

  const topCategory = useMemo(() => {
    const breakdown = data?.summary.categoryBreakdown || [];
    return [...breakdown].sort((a, b) => b.amount - a.amount)[0];
  }, [data]);

  const expenseCategories = useMemo(() => {
    const fromData = data?.summary.categoryBreakdown.map(c => c.category) || [];
    const allCustom = [...new Set([...fromData, ...localCategories])].filter(c => !defaultCategories.includes(c as any));
    return [...allCustom, ...defaultCategories];
  }, [data?.summary.categoryBreakdown, localCategories]);

  useEffect(() => {
    localStorage.setItem('fintrack-custom-categories', JSON.stringify(localCategories));
  }, [localCategories]);

  const sortedExpenses = useMemo(() => {
    const expenses = (data?.expenses || [])
      .filter((expense) => !expense.diaryId && expense.paymentMethod !== 'Diary Entry')
      .slice();

    switch (sortBy) {
      case 'amount-high':
        return expenses.sort((a, b) => b.amount - a.amount);
      case 'amount-low':
        return expenses.sort((a, b) => a.amount - b.amount);
      case 'category':
        return expenses.sort((a, b) => a.category.localeCompare(b.category));
      case 'oldest':
        return expenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      default:
        return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }, [data?.expenses, sortBy]);

  const allExpenseIds = useMemo(() => sortedExpenses.map((expense) => expense._id), [sortedExpenses]);
  const isAllExpensesSelected = allExpenseIds.length > 0 && selectedExpenseIds.length === allExpenseIds.length;

  const toggleExpenseSelection = (expenseId: string) => {
    setSelectedExpenseIds((current) =>
      current.includes(expenseId) ? current.filter((id) => id !== expenseId) : [...current, expenseId]
    );
  };

  const toggleSelectAllExpenses = () => {
    setSelectedExpenseIds(isAllExpensesSelected ? [] : allExpenseIds);
  };

  const cancelExpenseSelection = () => {
    setIsSelectingExpenses(false);
    setSelectedExpenseIds([]);
  };

  const bulkDeleteExpenses = async () => {
    if (!selectedExpenseIds.length) return;
    await Promise.all(selectedExpenseIds.map((id) => api.delete(`/expenses/${id}`)));
    invalidateExpenseQueries();
    cancelExpenseSelection();
  };

  const bulkUpdateCategory = async () => {
    if (!selectedExpenseIds.length) return;
    const targets = (data?.expenses || []).filter((expense) => selectedExpenseIds.includes(expense._id));
    await Promise.all(targets.map((expense) =>
      api.put(`/expenses/${expense._id}`, {
        amount: Number(expense.amount),
        category: bulkCategory,
        date: expense.date,
        paymentMethod: expense.paymentMethod,
        notes: expense.notes || ''
      })
    ));
    invalidateExpenseQueries();
    cancelExpenseSelection();
  };

  const previewExpenses = sortedExpenses.slice(0, 5);

  useEffect(() => {
    localStorage.setItem(budgetKey, JSON.stringify(budgets));
  }, [budgets, budgetKey]);

  useEffect(() => {
    if (!settings.automaticCategorizationRules || !form.notes.trim()) {
      return;
    }

    const normalizedNotes = form.notes.toLowerCase();
    const categoryMap: Record<string, typeof form.category> = {
      swiggy: 'Food',
      zomato: 'Food',
      uber: 'Travel',
      ola: 'Travel',
      electricity: 'Bills',
      rent: 'Bills',
      internet: 'Bills',
      amazon: 'Shopping',
      myntra: 'Shopping',
      subscription: 'Others'
    };

    const matchedEntry = Object.entries(categoryMap).find(([keyword]) => normalizedNotes.includes(keyword));

    if (matchedEntry && matchedEntry[1] !== form.category) {
      setForm((current) => ({ ...current, category: matchedEntry[1] }));
    }
  }, [form.category, form.notes, settings.automaticCategorizationRules]);

  const budgetSummaries = useMemo(() => {
    const totalTracked = data?.summary.total || 0;
    const categoryBreakdown = data?.summary.categoryBreakdown || [];
    const filterFrom = filters.from ? new Date(filters.from) : null;
    const filterTo = filters.to ? new Date(filters.to) : null;
    const hasDateFilters = !!(filterFrom && filterTo);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return budgets.map((budget) => {
      let spent = 0;

      if (hasDateFilters) {
        // When active filters are set, we use the global summary
        spent = totalTracked;
        if (budget.category && budget.category !== 'All Categories') {
          const categoryData = categoryBreakdown.find((cb) => cb.category === budget.category);
          spent = categoryData ? categoryData.amount : 0;
        }
      } else {
        // When viewing ALL TIME, we strictly filter for the CURRENT calendar month
        const targetExpenses = (data?.expenses || []).filter((exp) => {
          const expDate = new Date(exp.date);
          const monthMatches = expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
          const categoryMatches = !budget.category || budget.category === 'All Categories' || exp.category === budget.category;
          return monthMatches && categoryMatches;
        });
        spent = targetExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      }

      const percentage = budget.limit ? Math.min(999, Math.round((spent / budget.limit) * 100)) : 0;

      return {
        ...budget,
        spent,
        percentage,
        tone:
          percentage > 100
            ? 'border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30'
            : percentage > 80
              ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30'
              : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30'
      };
    });
  }, [budgets, data?.summary.total, data?.summary.categoryBreakdown, data?.expenses, filters.from, filters.to]);

  const startEdit = (expense: Expense) => {
    setEditingExpenseId(expense._id);
    setForm({
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date.slice(0, 10),
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || ''
    });
  };

  const resetForm = () => {
    setEditingExpenseId(null);
    setForm(emptyForm);
  };

  const handleDelete = (expenseId: string) => {
    deleteMutation.mutate(expenseId);
  };

  const saveBudget = () => {
    if (!budgetForm.name.trim() || !budgetForm.limit) {
      return;
    }

    if (editingBudgetId) {
      setBudgets((current) =>
        current.map((b) =>
          b.id === editingBudgetId
            ? {
                ...b,
                name: budgetForm.name.trim(),
                limit: Number(budgetForm.limit),
                period: budgetForm.period,
                category: budgetForm.category
              }
            : b
        )
      );
      setEditingBudgetId(null);
    } else {
      setBudgets((current) => [
        {
          id: crypto.randomUUID(),
          name: budgetForm.name.trim(),
          limit: Number(budgetForm.limit),
          period: budgetForm.period,
          category: budgetForm.category
        },
        ...current
      ]);
    }
    setBudgetForm(emptyBudgetForm);
    invalidateExpenseQueries();
  };

  const startEditBudget = (budget: BudgetPlan) => {
    setEditingBudgetId(budget.id);
    setBudgetForm({
      name: budget.name,
      limit: String(budget.limit),
      period: budget.period,
      category: budget.category || 'All Categories'
    });
  };

  const cancelEditBudget = () => {
    setEditingBudgetId(null);
    setBudgetForm(emptyBudgetForm);
  };

  const removeBudget = (budgetId: string) => {
    setBudgets((current) => current.filter((budget) => budget.id !== budgetId));
    invalidateExpenseQueries();
  };

  const createRecurringPayment = useMutation({
    mutationFn: async () =>
      api.post('/recurring-payments', {
        title: recurringForm.title.trim(),
        amount: Number(recurringForm.amount),
        frequency: recurringForm.frequency,
        nextPaymentDate: recurringForm.dueDate,
        category: 'Other',
        showOnHome: false
      }),
    onSuccess: () => {
      setRecurringForm(emptyRecurringForm);
      invalidateExpenseQueries();
    }
  });

  const deleteRecurringPayment = useMutation({
    mutationFn: async (paymentId: string) => api.delete(`/recurring-payments/${paymentId}`),
    onSuccess: () => {
      invalidateExpenseQueries();
    }
  });

  const toggleRecurringPaymentOnHome = useMutation({
    mutationFn: async (payment: RecurringPayment) =>
      api.put(`/recurring-payments/${payment._id}`, {
        showOnHome: !payment.showOnHome
      }),
    onSuccess: () => {
      invalidateExpenseQueries();
    }
  });

  const renderRows = (expenses: Expense[], expanded = false) => {
    if (!expenses.length) {
      return (
        <tr>
          <td colSpan={isSelectingExpenses ? 7 : 6} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
            No expenses match the current filters.
          </td>
        </tr>
      );
    }

    return expenses.map((expense) => (
      <tr key={expense._id} className="border-t border-slate-100 dark:border-slate-800">
        {isSelectingExpenses && (
          <td className="px-5 py-4">
            <button
              type="button"
              onClick={() => toggleExpenseSelection(expense._id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-accent hover:text-accent dark:border-slate-700 dark:text-slate-300"
              aria-label={`Select expense ${expense._id}`}
            >
              {selectedExpenseIds.includes(expense._id) ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
          </td>
        )}
        <td className="px-5 py-4">{formatDateByRegion(expense.date, settings.region)}</td>
        <td className="px-5 py-4">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {expense.category}
          </span>
        </td>
        <td className="px-5 py-4">{expense.paymentMethod}</td>
        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{expense.notes || 'No notes added'}</td>
        <td className="px-5 py-4 text-right font-semibold">{formatCurrency(expense.amount)}</td>
        <td className="px-5 py-4">
          {isSelectingExpenses ? (
            <span className="text-sm text-slate-400">—</span>
          ) : (
            <div className="flex justify-end gap-2">
              <button
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                onClick={() => {
                  startEdit(expense);
                  if (expanded) setIsExpanded(false);
                }}
                type="button"
              >
                <Edit3 size={16} />
              </button>
              <button
                className="rounded-xl border border-rose-200 p-2 text-rose-500 transition hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
                onClick={() => handleDelete(expense._id)}
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </td>
      </tr>
    ));
  };

  const handleImportFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data: preview } = await api.post('/expenses/import?dryRun=1', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setImportRows(preview.rows || []);
    setImportFileName(file.name);
    setImportFile(file);
    setShowImportModal(true);
  };

  const runImport = async () => {
    if (!importFile) return;
    const formData = new FormData();
    formData.append('file', importFile);
    setIsImporting(true);
    try {
      await api.post('/expenses/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      invalidateExpenseQueries();
      setShowImportModal(false);
      setImportRows([]);
      setImportFile(null);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader
          eyebrow="Expense tracking"
          title="Daily spending workspace"
          description="Capture a transaction, set manual budgets, manage recurring payments, and inspect recent history from one connected layout."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total tracked</p>
            <h3 className="mt-2 text-3xl font-bold">{formatCurrency(data?.summary.total || 0)}</h3>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Transactions</p>
            <h3 className="mt-2 text-3xl font-bold">{data?.summary.count || 0}</h3>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Top category</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <h3 className="text-2xl font-bold">{topCategory?.category || 'None'}</h3>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{formatCurrency(topCategory?.amount || 0)}</span>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Average transaction</p>
              <ArrowUpRight size={16} className="text-accent" />
            </div>
            <h3 className="mt-2 text-3xl font-bold">{formatCurrency(monthlyAverage)}</h3>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
          <Card className="flex h-full flex-col p-7 md:p-8">
            <SectionHeader
              eyebrow={editingExpenseId ? 'Edit expense' : 'New expense'}
              title={editingExpenseId ? 'Update transaction' : 'Record a transaction'}
              description={
                editingExpenseId
                  ? 'Edit the selected transaction here. Save changes or cancel to return to new entry mode.'
                  : 'Use this left panel to add your expense manually.'
              }
            />
            <form
              className="mt-7 flex flex-1 flex-col gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (editingExpenseId) {
                  updateMutation.mutate(editingExpenseId);
                  return;
                }
                createMutation.mutate();
              }}
            >
              <Field label="Amount">
                <Input type="number" min="0" value={form.amount} onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))} required />
              </Field>
              <Field label="Category">
                {isAddingCustom ? (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter category (e.g. Gym)"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customCategoryName.trim()) {
                          const name = customCategoryName.trim();
                          setLocalCategories(prev => [...new Set([...prev, name])]);
                          setForm(s => ({ ...s, category: name }));
                          setCustomCategoryName('');
                          setIsAddingCustom(false);
                        }
                      }}
                      className="rounded-2xl bg-accent p-3 text-white transition hover:bg-accent/90"
                    >
                      <ArrowUpRight size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustom(false);
                        setCustomCategoryName('');
                      }}
                      className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:bg-slate-50"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <Select
                    value={form.category}
                    onChange={(val) => {
                      if (val === 'ADD_NEW') {
                        setIsAddingCustom(true);
                      } else {
                        setForm((s) => ({ ...s, category: val as string }));
                      }
                    }}
                  >
                    {expenseCategories.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                    <option value="ADD_NEW">+ Add New Category...</option>
                  </Select>
                )}
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Date">
                  <Input type="date" value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} required />
                </Field>
                <Field label="Payment Method">
                  <Select value={form.paymentMethod} onChange={(val) => setForm((s) => ({ ...s, paymentMethod: val as string }))}>
                    {['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking'].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Notes">
                <Textarea rows={4} value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
              </Field>
              {!settings.automaticCategorizationRules && (
                <p className="-mt-3 text-sm text-slate-500 dark:text-slate-400">
                  <Link to="/settings?focus=automation#settings-automation" className="underline">
                    Automatic categorization is disabled in settings.
                  </Link>
                </p>
              )}
              <div className="mt-auto flex gap-3 pt-1">
                <Button className="flex-1 justify-center py-3.5" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingExpenseId
                      ? 'Save Changes'
                      : 'Save Expense'}
                </Button>
                {editingExpenseId && (
                  <button
                    className="rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                    onClick={resetForm}
                    type="button"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Card>

          <Card className="flex h-full flex-col">
            <SectionHeader
              eyebrow="Expense history"
              title="View transactions"
              description="Review your latest transactions here while keeping manual entry on the left."
              action={
                isSelectingExpenses ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={toggleSelectAllExpenses} className="rounded-2xl px-3 py-2 text-sm">
                      {isAllExpensesSelected ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Select value={bulkCategory} onChange={(val) => setBulkCategory(val as (typeof expenseCategories)[number])} className="min-w-[140px]">
                      {expenseCategories.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Select>
                    <Button onClick={bulkUpdateCategory} className="rounded-2xl px-3 py-2 text-sm" disabled={!selectedExpenseIds.length}>
                      Apply Category
                    </Button>
                    <Button variant="danger" onClick={bulkDeleteExpenses} className="rounded-2xl px-3 py-2 text-sm" disabled={!selectedExpenseIds.length}>
                      Delete Selected
                    </Button>
                    <Button variant="outline" onClick={cancelExpenseSelection} className="rounded-2xl px-3 py-2 text-sm">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <UploadCloud size={16} />
                      Import report
                    </button>
                    <button
                      className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                      onClick={() => setIsExpanded(true)}
                      type="button"
                    >
                      <Maximize2 size={16} />
                      View all
                    </button>
                    <button
                      className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                      onClick={() => setIsSelectingExpenses(true)}
                      type="button"
                    >
                      <CheckSquare size={16} />
                      Select
                    </button>
                  </div>
                )
              }
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json,.pdf,.ofx,.qfx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleImportFile(file);
                }
                event.target.value = '';
              }}
            />
            <div className="mt-6 flex-1 overflow-hidden rounded-[24px] border border-slate-100 dark:border-slate-700">
              <div className="h-full overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 dark:bg-slate-900/90 dark:text-slate-300">
                    <tr>
                      {isSelectingExpenses && <th className="px-5 py-4 w-12"></th>}
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Method</th>
                      <th className="px-5 py-4">Notes</th>
                      <th className="px-5 py-4 text-right">Amount</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900">{renderRows(previewExpenses)}</tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
          <Card className="flex h-full flex-col p-7 md:p-8">
            <SectionHeader
              eyebrow="Recurring planner"
              title="Add a recurring payment"
              description="Create a recurring payment manually in this left panel."
            />
            {settings.recurringTransactionSetup ? (
              <form
                className="mt-7 flex flex-1 flex-col gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  createRecurringPayment.mutate();
                }}
              >
                <Field label="Payment title">
                  <Input
                    value={recurringForm.title}
                    onChange={(e) => setRecurringForm((state) => ({ ...state, title: e.target.value }))}
                    placeholder="Netflix subscription"
                    required
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Amount">
                    <Input
                      type="number"
                      min="0"
                      value={recurringForm.amount}
                      onChange={(e) => setRecurringForm((state) => ({ ...state, amount: e.target.value }))}
                      placeholder="499"
                      required
                    />
                  </Field>
                  <Field label="Frequency">
                    <Select value={recurringForm.frequency} onChange={(val) => setRecurringForm((state) => ({ ...state, frequency: val as string }))}>
                      {['Monthly', 'Weekly', 'Quarterly', 'Yearly'].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Next due date">
                  <Input
                    type="date"
                    value={recurringForm.dueDate}
                    onChange={(e) => setRecurringForm((state) => ({ ...state, dueDate: e.target.value }))}
                    required
                  />
                </Field>
                <Button className="mt-auto w-full justify-center py-3.5" disabled={createRecurringPayment.isPending}>
                  {createRecurringPayment.isPending ? 'Saving...' : 'Save Recurring Payment'}
                </Button>
              </form>
            ) : (
              <div className="mt-7 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                Recurring transaction setup is disabled in settings.
              </div>
            )}
          </Card>

          <Card className="flex h-full flex-col">
            <SectionHeader eyebrow="Recurring payments" title="View recurring payments" description="Saved recurring plans stay here for quick review and cleanup." />
            <div className="mt-5 flex-1 space-y-3">
              {!settings.recurringTransactionSetup ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  Recurring transaction setup is disabled in settings.
                </div>
              ) : recurringPaymentsData?.recurringPayments.length ? (
                recurringPaymentsData.recurringPayments.map((payment) => (
                  <div
                    key={payment._id}
                    className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{payment.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {payment.frequency} · Next due {formatDateByRegion(payment.nextPaymentDate, settings.region)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleRecurringPaymentOnHome.mutate(payment)}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                          payment.showOnHome
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white'
                        }`}
                      >
                        <MonitorUp size={14} />
                        {payment.showOnHome ? 'On Home' : 'Add to Home'}
                      </button>
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                      <button
                        type="button"
                        onClick={() => deleteRecurringPayment.mutate(payment._id)}
                        className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  No recurring payments yet. Add one on the left.
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
          <Card className="flex h-full flex-col p-7 md:p-8">
            <SectionHeader
              eyebrow={editingBudgetId ? 'Edit budget' : 'Budget planner'}
              title={editingBudgetId ? 'Update budget' : 'Set a budget'}
              description={editingBudgetId ? 'Update the details of your selected budget plan.' : 'Create a budget target manually in this left panel.'}
            />
            <form
              className="mt-7 flex flex-1 flex-col gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                saveBudget();
              }}
            >
              <Field label="Budget name">
                <Input value={budgetForm.name} onChange={(e) => setBudgetForm((state) => ({ ...state, name: e.target.value }))} placeholder="Food budget" required />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Budget amount">
                  <Input
                    type="number"
                    min="0"
                    value={budgetForm.limit}
                    onChange={(e) => setBudgetForm((state) => ({ ...state, limit: e.target.value }))}
                    placeholder="15000"
                    required
                  />
                </Field>
                <Field label="Period">
                  <Select value={budgetForm.period} onChange={(val) => setBudgetForm((state) => ({ ...state, period: val as string }))}>
                    {['Monthly', 'Weekly', 'Quarterly'].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Tracked Category">
                <Select value={budgetForm.category} onChange={(val) => setBudgetForm((state) => ({ ...state, category: val as string }))}>
                  <option>All Categories</option>
                  {expenseCategories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <div className="mt-auto flex gap-3 pt-1">
                <Button className="flex-1 justify-center py-3.5" type="submit">
                  {editingBudgetId ? 'Update Budget' : 'Save Budget'}
                </Button>
                {editingBudgetId && (
                  <button
                    className="rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                    onClick={cancelEditBudget}
                    type="button"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Card>

          <Card className="flex h-full flex-col p-7 md:p-8">
            <SectionHeader eyebrow="Budget summary" title="Set budgets" description="Saved budget plans appear here with quick progress against tracked spending." />
            {!settings.budgetAlerts && (
              <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                Budget alerts are disabled in settings, so this panel stays informational only.
              </div>
            )}
            <div className="mt-6 flex-1 space-y-4">
              {budgetSummaries.length ? (
                budgetSummaries.map((budget) => (
                  <div key={budget.id} className={`rounded-3xl border p-4 ${budget.tone}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                          {budget.period} budget · {budget.category || 'All Categories'}
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{budget.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditBudget(budget)}
                          className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeBudget(budget.id)}
                          className="rounded-xl border border-rose-200 p-2 text-rose-500 transition hover:bg-rose-100 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(budget.limit)}</p>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                        {budget.percentage}% used
                      </p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/70 dark:bg-slate-800">
                      <div 
                        className="h-2 rounded-full bg-accent transition-all duration-500" 
                        style={{ width: `${Math.min(100, budget.percentage)}%` }} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  No active budgets yet. Add one on the left.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm md:p-8">
          <div className="mx-auto flex h-full max-w-7xl flex-col rounded-[28px] bg-white p-6 shadow-panel dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
              <SectionHeader
                eyebrow="All transactions"
                title="Expanded expense history"
                description="Use detailed filters and sorting here without crowding the main page."
              />
              <div className="flex items-center gap-2">
                {!isSelectingExpenses ? (
                  <button
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                    onClick={() => setIsSelectingExpenses(true)}
                    type="button"
                  >
                    <CheckSquare size={16} />
                    Select
                  </button>
                ) : (
                  <>
                    <Button variant="outline" onClick={toggleSelectAllExpenses} className="rounded-2xl px-3 py-2 text-sm">
                      {isAllExpensesSelected ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Select value={bulkCategory} onChange={(val) => setBulkCategory(val as (typeof expenseCategories)[number])} className="min-w-[140px]">
                      {expenseCategories.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Select>
                    <Button onClick={bulkUpdateCategory} className="rounded-2xl px-3 py-2 text-sm" disabled={!selectedExpenseIds.length}>
                      Apply Category
                    </Button>
                    <Button variant="danger" onClick={bulkDeleteExpenses} className="rounded-2xl px-3 py-2 text-sm" disabled={!selectedExpenseIds.length}>
                      Delete Selected
                    </Button>
                    <Button variant="outline" onClick={cancelExpenseSelection} className="rounded-2xl px-3 py-2 text-sm">
                      Cancel
                    </Button>
                  </>
                )}
                <button
                  className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                  onClick={() => setIsExpanded(false)}
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <Field label="Category">
                <Select value={filters.category} onChange={(val) => setFilters((s) => ({ ...s, category: val as string }))}>
                  <option value="">All Categories</option>
                  {expenseCategories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="From">
                <Input type="date" value={filters.from} onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))} />
              </Field>
              <Field label="To">
                <Input type="date" value={filters.to} onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))} />
              </Field>
              <Field label="Sort By">
                <Select value={sortBy} onChange={(val) => setSortBy(val as string)}>
                  <option value="latest">Latest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="amount-high">Amount high to low</option>
                  <option value="amount-low">Amount low to high</option>
                  <option value="category">Category A to Z</option>
                </Select>
              </Field>
            </div>

            <div className="mt-6 flex-1 overflow-hidden rounded-[24px] border border-slate-100 dark:border-slate-800">
              <div className="h-full overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-slate-400 dark:bg-slate-950">
                    <tr>
                      {isSelectingExpenses && <th className="px-5 py-4 w-12"></th>}
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Method</th>
                      <th className="px-5 py-4">Notes</th>
                      <th className="px-5 py-4 text-right">Amount</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900">{renderRows(sortedExpenses, true)}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm md:p-8">
          <div className="mx-auto flex h-full max-w-3xl flex-col rounded-[28px] bg-white p-6 shadow-panel dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
              <SectionHeader
                eyebrow="Import expenses"
                title="Review your report before import"
                description={importFileName ? `File: ${importFileName}` : 'Upload a CSV report.'}
              />
              <button
                className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                onClick={() => setShowImportModal(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex-1 space-y-4 overflow-auto">
              <div className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Rows detected</p>
                <p className="mt-2 text-3xl font-bold">{importRows.length}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Valid: {importRows.filter((row) => row.valid).length} · Invalid: {importRows.filter((row) => !row.valid).length}
                </p>
              </div>

              {importRows.filter((row) => !row.valid).length > 0 && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                  Some rows have issues (missing date/amount or duplicates). They will be skipped.
                </div>
              )}

              <div className="overflow-hidden rounded-[24px] border border-slate-100 dark:border-slate-800">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 dark:bg-slate-900/90 dark:text-slate-300">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Method</th>
                      <th className="px-5 py-3">Notes</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900">
                    {importRows.slice(0, 8).map((row, index) => (
                      <tr key={`${row.date}-${row.amount}-${index}`} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-5 py-3">{row.date || '-'}</td>
                        <td className="px-5 py-3">{row.category}</td>
                        <td className="px-5 py-3">{row.paymentMethod}</td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row.notes || '-'}</td>
                        <td className="px-5 py-3 text-right font-semibold">{formatCurrency(row.amount || 0)}</td>
                        <td className="px-5 py-3">
                          {row.valid ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Ready</span>
                          ) : (
                            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Skipped</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800">
              <p className="text-xs text-slate-500">Only valid rows will be imported.</p>
              <div className="flex gap-3">
                <button
                  className="rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                  onClick={() => setShowImportModal(false)}
                  type="button"
                >
                  Cancel
                </button>
                <Button
                  className="px-6 py-3.5"
                  onClick={runImport}
                  disabled={isImporting || importRows.filter((row) => row.valid).length === 0}
                >
                  {isImporting ? 'Importing...' : `Import ${importRows.filter((row) => row.valid).length} rows`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
