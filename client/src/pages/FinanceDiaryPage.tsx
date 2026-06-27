import { BookOpen, Plus, Users, Wallet, ArrowRight, Search, Filter, MoreHorizontal, Calendar, ChevronRight, X, Trash2, Edit2, CheckCircle2, IndianRupee, Tag, FileText, CheckSquare, Square, Check, Share2, Download, GripVertical } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { useDiaries, Diary } from '../hooks/useDiaries';
import { useExpenses } from '../hooks/useExpenses';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import type { ExpenseCategory, StandardExpenseCategory } from '../lib/types';

type CategorySelect = ExpenseCategory | 'Custom';
type DiaryExpenseSort = 'manual' | 'latest' | 'oldest' | 'amount-high' | 'amount-low' | 'category' | 'note';

interface ExpenseForm {
  amount: string;
  category: CategorySelect;
  customCategory: string;
  notes: string;
  optionalNote?: string;
  date?: string;
  involvedMembers: string[];
  splitType: 'equal' | 'custom';
  customSplits: Record<string, string>;
  id?: string;
}

export const FinanceDiaryPage = () => {
  const { diaries, isLoading, createDiary, deleteDiary, updateDiary } = useDiaries();
  const { expenses: allExpenses, createExpense, updateExpense, deleteExpense } = useExpenses();

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManualExpenseModal, setShowManualExpenseModal] = useState(false);
  const [showEditDiaryModal, setShowEditDiaryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExpenseDetailModal, setShowExpenseDetailModal] = useState(false);
  const [detailExpense, setDetailExpense] = useState<any | null>(null);

  // Create Modal State
  const [newDiaryName, setNewDiaryName] = useState('');
  const [newDiaryMembers, setNewDiaryMembers] = useState<string[]>(['']);
  const [editDiaryName, setEditDiaryName] = useState('');
  const [editDiaryMembers, setEditDiaryMembers] = useState<string[]>(['']);

  // Manual Expense State
  const [manualForm, setManualForm] = useState<ExpenseForm>({
    amount: '',
    category: 'Travel',
    customCategory: '',
    notes: '',
    optionalNote: '',
    date: '',
    involvedMembers: [],
    splitType: 'equal',
    customSplits: {}
  });

  // Edit Expense State
  const [editingForm, setEditingForm] = useState<ExpenseForm | null>(null);

  const [isSelectingDiaryExpenses, setIsSelectingDiaryExpenses] = useState(false);
  const [selectedDiaryExpenseIds, setSelectedDiaryExpenseIds] = useState<string[]>([]);
  const [bulkDiaryCategory, setBulkDiaryCategory] = useState<CategorySelect>('Travel');
  const [diaryExpenseSort, setDiaryExpenseSort] = useState<DiaryExpenseSort>('latest');
  const [draggedDiaryExpenseId, setDraggedDiaryExpenseId] = useState<string | null>(null);
  const [diaryExpenseOrders, setDiaryExpenseOrders] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem('fintrack-diary-expense-orders') || '{}');
    } catch {
      return {};
    }
  });

  const diaryCategories: StandardExpenseCategory[] = ['Travel', 'Food', 'Shopping', 'Bills', 'Others', 'Hotel', 'Sightseeing'];
  const isStandardCategory = (value: string): value is StandardExpenseCategory => diaryCategories.includes(value as StandardExpenseCategory);

  const extraCategories = useMemo(() => {
    const fromExpenses = [
      ...(allExpenses || []),
      ...(selectedDiary?.expenses || [])
    ];
    const set = new Set<string>();
    fromExpenses.forEach((expense: any) => {
      const raw = typeof expense?.category === 'string' ? expense.category.trim() : '';
      if (!raw) return;
      if (raw === 'Custom') return;
      if (isStandardCategory(raw)) return;
      set.add(raw);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allExpenses, selectedDiary?.expenses]);

  const categoryOptions = useMemo(() => [...diaryCategories, ...extraCategories], [diaryCategories, extraCategories]);

  const handleCreateDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiaryName.trim()) return;
    const members = newDiaryMembers.filter(m => m.trim() !== '');
    await createDiary({ name: newDiaryName, members });
    setShowCreateModal(false);
    setNewDiaryName('');
    setNewDiaryMembers(['']);
  };

  const handleAddMemberField = () => setNewDiaryMembers([...newDiaryMembers, '']);
  const handleMemberChange = (index: number, value: string) => {
    const next = [...newDiaryMembers];
    next[index] = value;
    setNewDiaryMembers(next);
  };

  const handleEditDiaryMemberChange = (index: number, value: string) => {
    const next = [...editDiaryMembers];
    next[index] = value;
    setEditDiaryMembers(next);
  };

  const handleAddEditMemberField = () => setEditDiaryMembers([...editDiaryMembers, '']);
  const handleRemoveEditMember = (index: number) => {
    const next = editDiaryMembers.filter((_, i) => i !== index);
    setEditDiaryMembers(next.length ? next : ['']);
  };

  const handleOpenEditDiary = (diary: Diary) => {
    setEditDiaryName(diary.name);
    setEditDiaryMembers(diary.members.length ? [...diary.members] : ['']);
    setShowEditDiaryModal(true);
  };

  const handleUpdateDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiary) return;
    const nextName = editDiaryName.trim();
    if (!nextName) return;
    const members = editDiaryMembers.map((m) => m.trim()).filter((m) => m);
    await updateDiary({
      id: selectedDiary._id,
      updates: { name: nextName, members }
    });
    setSelectedDiary((prev) =>
      prev
        ? {
          ...prev,
          name: nextName,
          members
        }
        : prev
    );
    setShowEditDiaryModal(false);
  };

  useEffect(() => {
    setSelectedDiaryExpenseIds([]);
    setIsSelectingDiaryExpenses(false);
  }, [selectedDiary?._id]);

  useEffect(() => {
    if (!selectedDiary || !selectedDiary.members?.length || !selectedDiary.expenses?.length) return;

    const diaryMembers = selectedDiary.members;
    const isSameMembers = (members: string[]) => {
      if (members.length !== diaryMembers.length) return false;
      const set = new Set(members);
      return diaryMembers.every((m) => set.has(m));
    };

    const normalize = async () => {
      const expensesToFix = selectedDiary.expenses?.filter((expense: any) => {
        if (!Array.isArray(expense.involvedMembers)) return false;
        return !isSameMembers(expense.involvedMembers);
      }) || [];

      if (!expensesToFix.length) return;

      const nextExpenseMap = new Map<string, any>();
      expensesToFix.forEach((expense: any) => {
        nextExpenseMap.set(expense._id, {
          ...expense,
          involvedMembers: diaryMembers
        });
      });

      setSelectedDiary((prev) => {
        if (!prev || !prev.expenses) return prev;
        return {
          ...prev,
          expenses: prev.expenses.map((expense: any) => nextExpenseMap.get(expense._id) ?? expense)
        };
      });

      await Promise.all(
        expensesToFix.map((expense: any) => {
          const updated = nextExpenseMap.get(expense._id);
          return updateExpense({
            id: expense._id,
            updates: {
              involvedMembers: updated.involvedMembers
            }
          });
        })
      );
    };

    void normalize();
  }, [selectedDiary, updateExpense]);

  const handleAddManualExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiary || !manualForm.amount) return;
    if (manualForm.category === 'Custom' && !manualForm.customCategory.trim()) return;

    const membersToSave = manualForm.splitType === 'equal'
      ? selectedDiary.members
      : manualForm.customSplits;

    // Ensure all values are numbers for custom splits
    const finalInvolvedMembers = manualForm.splitType === 'custom'
      ? Object.fromEntries(Object.entries(manualForm.customSplits).map(([m, val]) => [m, Number(val) || 0]))
      : membersToSave;

    const finalCategory = manualForm.category === 'Custom'
      ? manualForm.customCategory.trim()
      : manualForm.category;

    const expenseDate = manualForm.date
      ? new Date(`${manualForm.date}T00:00:00`).toISOString()
      : new Date().toISOString();

    await createExpense({
      amount: Number(manualForm.amount),
      category: finalCategory,
      notes: manualForm.notes,
      optionalNote: manualForm.optionalNote || '',
      diaryId: selectedDiary._id,
      involvedMembers: finalInvolvedMembers,
      date: expenseDate,
      paymentMethod: 'Diary Entry'
    });

    setShowManualExpenseModal(false);
    setManualForm({ amount: '', category: 'Travel', customCategory: '', notes: '', optionalNote: '', date: '', involvedMembers: [], splitType: 'equal', customSplits: {} });
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForm) return;
    if (editingForm.category === 'Custom' && !editingForm.customCategory.trim()) return;

    try {
      const finalCategory = editingForm.category === 'Custom'
        ? editingForm.customCategory.trim()
        : editingForm.category;

      const finalInvolvedMembers = editingForm.splitType === 'custom'
        ? Object.fromEntries(Object.entries(editingForm.customSplits).map(([m, val]) => [m, Number(val) || 0]))
        : (editingForm.involvedMembers || []);

      await updateExpense({
        id: editingForm.id!,
        updates: {
          amount: Number(editingForm.amount),
          category: finalCategory,
          notes: editingForm.notes,
          optionalNote: editingForm.optionalNote || '',
          date: editingForm.date,
          involvedMembers: finalInvolvedMembers
        }
      });

      setShowEditModal(false);
      setEditingForm(null);
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Delete this transaction from your diary?')) return;
    await deleteExpense(id);
  };

  const toggleManualMember = (member: string) => {
    setManualForm(prev => {
      const next = prev.involvedMembers.includes(member)
        ? prev.involvedMembers.filter(m => m !== member)
        : [...prev.involvedMembers, member];
      return { ...prev, involvedMembers: next };
    });
  };

  const toggleEditingMember = (member: string) => {
    if (!editingForm) return;
    setEditingForm(prev => {
      if (!prev) return null;
      const next = prev.involvedMembers.includes(member)
        ? prev.involvedMembers.filter(m => m !== member)
        : [...prev.involvedMembers, member];
      return { ...prev, involvedMembers: next };
    });
  };

  const toggleAllManualMembers = () => {
    if (!selectedDiary) return;
    setManualForm(prev => {
      const allSelected = prev.involvedMembers.length === selectedDiary.members.length;
      return {
        ...prev,
        involvedMembers: allSelected ? [] : [...selectedDiary.members]
      };
    });
  };

  const toggleAllEditingMembers = () => {
    if (!selectedDiary || !editingForm) return;
    setEditingForm(prev => {
      if (!prev) return null;
      const allSelected = prev.involvedMembers.length === selectedDiary.members.length;
      return {
        ...prev,
        involvedMembers: allSelected ? [] : [...selectedDiary.members]
      };
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  // --- Views ---

  if (view === 'detail' && selectedDiary) {
    const diary = diaries.find(d => d._id === selectedDiary._id) || selectedDiary;
    const total = diary.expenses?.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0) || 0;
    const diaryExpenses = diary.expenses || [];
    const savedDiaryExpenseOrder = diaryExpenseOrders[diary._id] || [];
    const diaryExpenseIds = diaryExpenses.map((expense: any) => expense._id);
    const orderedDiaryExpenseIds = [
      ...savedDiaryExpenseOrder.filter((id) => diaryExpenseIds.includes(id)),
      ...diaryExpenseIds.filter((id) => !savedDiaryExpenseOrder.includes(id))
    ];
    const manualOrderRank = new Map(orderedDiaryExpenseIds.map((id, index) => [id, index]));
    const sortedDiaryExpenses = diaryExpenses.slice().sort((a: any, b: any) => {
      switch (diaryExpenseSort) {
        case 'manual':
          return (manualOrderRank.get(a._id) ?? Number.MAX_SAFE_INTEGER) - (manualOrderRank.get(b._id) ?? Number.MAX_SAFE_INTEGER);
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-high':
          return (Number(b.amount) || 0) - (Number(a.amount) || 0);
        case 'amount-low':
          return (Number(a.amount) || 0) - (Number(b.amount) || 0);
        case 'category':
          return String(a.category || '').localeCompare(String(b.category || ''));
        case 'note':
          return String(a.notes || '').localeCompare(String(b.notes || ''));
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
    const isAllDiaryExpensesSelected = sortedDiaryExpenses.length > 0 && selectedDiaryExpenseIds.length === sortedDiaryExpenses.length;

    const getExpenseSplit = (expense: any) => {
      const amount = Number(expense?.amount) || 0;
      const inv = expense.involvedMembers;
      if (Array.isArray(inv)) {
        const members = diary.members.length > 0 ? diary.members : (inv.length > 0 ? inv : diary.members);
        const share = members.length > 0 ? amount / members.length : 0;
        return {
          members,
          amounts: Object.fromEntries(members.map((member: string) => [member, share]))
        };
      }

      if (inv && typeof inv === 'object') {
        const entries = Object.entries(inv).map(([member, amount]) => [member, Number(amount) || 0]);
        const amounts = Object.fromEntries(entries);
        const members = Object.keys(amounts);
        const total = members.reduce((sum, member) => sum + (amounts[member] || 0), 0);
        const shouldFallbackToEqual =
          diary.members.length > 0 && (!Number.isFinite(total) || Math.abs(total - amount) > 0.01);

        if (shouldFallbackToEqual) {
          const share = diary.members.length > 0 ? amount / diary.members.length : 0;
          return {
            members: diary.members,
            amounts: Object.fromEntries(diary.members.map((member: string) => [member, share]))
          };
        }

        return {
          members,
          amounts
        };
      }

      const fallbackShare = diary.members.length > 0 ? amount / diary.members.length : 0;
      return {
        members: diary.members,
        amounts: Object.fromEntries(diary.members.map((member: string) => [member, fallbackShare]))
      };
    };

    const toggleDiaryExpenseSelection = (expenseId: string) => {
      setSelectedDiaryExpenseIds((current) =>
        current.includes(expenseId) ? current.filter((id) => id !== expenseId) : [...current, expenseId]
      );
    };

    const toggleSelectAllDiaryExpenses = () => {
      setSelectedDiaryExpenseIds(isAllDiaryExpensesSelected ? [] : sortedDiaryExpenses.map((expense) => expense._id));
    };

    const saveDiaryExpenseOrder = (nextOrder: string[]) => {
      const nextOrders = {
        ...diaryExpenseOrders,
        [diary._id]: nextOrder
      };
      setDiaryExpenseOrders(nextOrders);
      localStorage.setItem('fintrack-diary-expense-orders', JSON.stringify(nextOrders));
    };

    const moveDiaryExpense = (targetExpenseId: string) => {
      if (!draggedDiaryExpenseId || draggedDiaryExpenseId === targetExpenseId) return;

      const nextOrder = sortedDiaryExpenses.map((expense) => expense._id);
      const fromIndex = nextOrder.indexOf(draggedDiaryExpenseId);
      const toIndex = nextOrder.indexOf(targetExpenseId);
      if (fromIndex === -1 || toIndex === -1) return;

      const [movedId] = nextOrder.splice(fromIndex, 1);
      nextOrder.splice(toIndex, 0, movedId);
      saveDiaryExpenseOrder(nextOrder);
      setDiaryExpenseSort('manual');
      setDraggedDiaryExpenseId(null);
    };

    const diarySortLabels: Record<DiaryExpenseSort, string> = {
      manual: 'Custom order',
      latest: 'Latest first',
      oldest: 'Oldest first',
      'amount-high': 'Amount high to low',
      'amount-low': 'Amount low to high',
      category: 'Category A to Z',
      note: 'Note A to Z'
    };
    const activeDiarySortLabel = diarySortLabels[diaryExpenseSort];

    const bulkDeleteDiaryExpenses = async () => {
      if (!selectedDiaryExpenseIds.length) return;
      await Promise.all(selectedDiaryExpenseIds.map((id) => deleteExpense(id)));
      setSelectedDiaryExpenseIds([]);
      setIsSelectingDiaryExpenses(false);
    };

    const bulkUpdateDiaryCategory = async () => {
      if (!selectedDiaryExpenseIds.length) return;
      await Promise.all(
        selectedDiaryExpenseIds.map((id) =>
          updateExpense({
            id,
            updates: { category: bulkDiaryCategory }
          })
        )
      );
      setSelectedDiaryExpenseIds([]);
      setIsSelectingDiaryExpenses(false);
    };

    const downloadDiaryCsv = () => {
      if (!sortedDiaryExpenses.length) return;

      const headers = ['Order', 'Date', 'Note', 'Category', 'Amount', 'Split Details'];
      const rows = sortedDiaryExpenses.map((expense, index) => {
        const split = getExpenseSplit(expense);
        const splitText = split.members.map(m => `${m}: ₹${Math.round(split.amounts[m])}`).join(' | ');
        return [
          index + 1,
          format(new Date(expense.date), 'yyyy-MM-dd'),
          expense.notes || '',
          expense.category,
          expense.amount,
          splitText
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${diary.name.replace(/\s+/g, '_')}_Finance_Diary.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    const downloadDiaryPdf = () => {
      if (typeof window === 'undefined') return;

      const rows = sortedDiaryExpenses.map((expense, index) => {
        const split = getExpenseSplit(expense);
        return {
          order: index + 1,
          date: format(new Date(expense.date), 'dd MMM yyyy'),
          notes: expense.notes || 'Expense',
          category: expense.category,
          amount: `₹${Number(expense.amount).toLocaleString()}`,
          splits: split.members.map(m => `${m}: ₹${Math.round(split.amounts[m]).toLocaleString()}`).join(', ')
        };
      }) || [];

      const html = `
        <html>
          <head>
            <title>${diary.name} - Report</title>
            <style>
              body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
              .header { margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
              h1 { margin: 0; font-size: 28px; color: #0f172a; }
              .meta { color: #64748b; font-size: 14px; margin-top: 8px; }
              .summary-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 24px; margin-bottom: 40px; }
              .card { padding: 20px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
              .card-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
              .card-value { font-size: 24px; font-weight: 800; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { text-align: left; padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
              td { padding: 16px 8px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
              .amount { font-weight: bold; }
              .splits { font-size: 11px; color: #64748b; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${diary.name}</h1>
              <div class="meta">Generated on ${format(new Date(), 'dd MMMM yyyy HH:mm')}</div>
              <div class="meta">Entry order: ${activeDiarySortLabel}</div>
            </div>

            <div class="summary-grid">
              <div class="card">
                <div class="card-title">Total Trip Spend</div>
                <div class="card-value">₹${total.toLocaleString()}</div>
              </div>
              <div class="card">
                <div class="card-title">Number of Entries</div>
                <div class="card-value">${sortedDiaryExpenses.length}</div>
              </div>
            </div>

            <div class="card" style="margin-bottom: 40px;">
              <div class="card-title">Member Breakdown</div>
              <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 10px;">
                ${diary.members.map(m => `
                  <div>
                    <div style="font-weight: bold;">${m}</div>
                    <div style="color: #64748b;">₹${Math.round(balances[m]).toLocaleString()}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th width="15%">Date</th>
                  <th width="30%">Description / Category</th>
                  <th width="15%">Amount</th>
                  <th width="40%">Split Details</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(row => `
                  <tr>
                    <td><div style="font-size: 11px; color: #64748b;">#${row.order}</div>${row.date}</td>
                    <td>
                      <div style="font-weight: bold;">${row.notes}</div>
                      <div style="font-size: 11px; color: #64748b;">${row.category}</div>
                    </td>
                    <td class="amount">${row.amount}</td>
                    <td class="splits">${row.splits}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to download the PDF report');
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };

    const shareDiarySummary = async () => {
      const orderedEntries = sortedDiaryExpenses.map((expense, index) => {
        const split = getExpenseSplit(expense);
        const splitText = split.members.map(m => `${m}: ₹${Math.round(split.amounts[m]).toLocaleString()}`).join(', ');
        return `${index + 1}. ${format(new Date(expense.date), 'dd MMM yyyy')} - ${expense.notes || 'Expense'} - ₹${Number(expense.amount || 0).toLocaleString()} (${expense.category}) [${splitText}]`;
      }).join('\n');

      const summaryText = `📊 Finance Diary: ${diary.name}\n` +
        `💰 Total Cost: ₹${total.toLocaleString()}\n` +
        `↕️ Entry Order: ${activeDiarySortLabel}\n` +
        `👥 Members:\n` +
        diary.members.map(m => `  - ${m}: ₹${Math.round(balances[m]).toLocaleString()}`).join('\n') +
        (orderedEntries ? `\n\nTransactions:\n${orderedEntries}` : '') +
        `\n\nGenerated via FinTrack`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: diary.name,
            text: summaryText,
          });
        } catch (err) {
          console.error('Error sharing:', err);
        }
      } else {
        try {
          await navigator.clipboard.writeText(summaryText);
          alert('Diary summary copied to clipboard!');
        } catch (err) {
          console.error('Clipboard error:', err);
        }
      }
    };

    // Calculate Splits
    const balances: Record<string, number> = {};
    diary.members.forEach(m => balances[m] = 0);

    diary.expenses?.forEach(expense => {
      const split = getExpenseSplit(expense);
      split.members.forEach((member: string) => {
        if (balances[member] !== undefined) {
          balances[member] += split.amounts[member] || 0;
        }
      });
    });

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-ink dark:text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setView('list')}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-accent hover:border-accent transition-all shadow-sm"
            >
              <ArrowRight className="rotate-180" size={20} />
            </button>
            <div>
              <h1 className="text-4xl font-black tracking-tight">{diary.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex -space-x-2">
                  {diary.members.map((m, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-950 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold text-white uppercase dark:bg-accent" title={m}>
                      {m[0]}
                    </div>
                  ))}
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  {diary.members.length} Members Split
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/50 dark:bg-white/5 p-1.5 rounded-[22px] border border-slate-200/50 dark:border-white/5 shadow-sm">
              <Button
                variant="ghost"
                onClick={() => handleOpenEditDiary(diary)}
                size="sm"
                className="rounded-xl h-9 px-3 gap-2 text-[11px] font-bold uppercase tracking-wider"
              >
                <Edit2 size={14} /> Edit
              </Button>
              <span className="w-px h-4 bg-slate-200 dark:bg-white/10" />
              <Button
                variant="ghost"
                onClick={downloadDiaryCsv}
                size="sm"
                className="rounded-xl h-9 px-3 gap-2 text-[11px] font-bold uppercase tracking-wider"
              >
                <Download size={14} /> CSV
              </Button>
              <Button
                variant="ghost"
                onClick={downloadDiaryPdf}
                size="sm"
                className="rounded-xl h-9 px-3 gap-2 text-[11px] font-bold uppercase tracking-wider"
              >
                <FileText size={14} /> PDF
              </Button>
              <Button
                variant="ghost"
                onClick={shareDiarySummary}
                size="sm"
                className="rounded-xl h-9 px-3 gap-2 text-[11px] font-bold uppercase tracking-wider"
              >
                <Share2 size={14} /> Share
              </Button>
            </div>

            <Button
              onClick={() => {
                setManualForm(prev => ({ ...prev, involvedMembers: [...diary.members] }));
                setShowManualExpenseModal(true);
              }}
              className="rounded-2xl px-6 h-11 gap-2 bg-slate-950 text-white dark:bg-accent shadow-lg shadow-accent/20"
            >
              <Plus size={18} /> Add Entry
            </Button>

            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this entire diary? This cannot be undone.')) {
                  deleteDiary(diary._id);
                  setView('list');
                }
              }}
              className="rounded-2xl w-14 h-14 p-0 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white dark:bg-red-500/20 dark:hover:bg-red-600 transition-all shadow-lg shadow-red-500/10"
            >
              <Trash2 size={24} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-[32px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">Diary Expenses</h3>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{diary.expenses?.length || 0} Entries</span>
                </div>
                {isSelectingDiaryExpenses ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={toggleSelectAllDiaryExpenses} className="rounded-2xl px-3 py-2 text-sm">
                      {isAllDiaryExpensesSelected ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Select value={bulkDiaryCategory} onChange={(val) => setBulkDiaryCategory(val as CategorySelect)} className="min-w-[150px]">
                      {categoryOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Select>
                    <Button onClick={bulkUpdateDiaryCategory} className="rounded-2xl px-3 py-2 text-sm" disabled={!selectedDiaryExpenseIds.length}>
                      Apply Category
                    </Button>
                    <Button variant="danger" onClick={bulkDeleteDiaryExpenses} className="rounded-2xl px-3 py-2 text-sm" disabled={!selectedDiaryExpenseIds.length}>
                      Delete Selected
                    </Button>
                    <Button variant="outline" onClick={() => { setIsSelectingDiaryExpenses(false); setSelectedDiaryExpenseIds([]); }} className="rounded-2xl px-3 py-2 text-sm">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={diaryExpenseSort} onChange={(val) => setDiaryExpenseSort(val as DiaryExpenseSort)} className="min-w-[180px]">
                      <option value="manual">Custom order</option>
                      <option value="latest">Latest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="amount-high">Amount high to low</option>
                      <option value="amount-low">Amount low to high</option>
                      <option value="category">Category A to Z</option>
                      <option value="note">Note A to Z</option>
                    </Select>
                    <Button variant="outline" onClick={() => setIsSelectingDiaryExpenses(true)} className="rounded-2xl px-4 py-2 text-sm">
                      Select
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {sortedDiaryExpenses.length === 0 ? (
                  <div className="py-24 text-center space-y-4 bg-slate-50 dark:bg-white/5 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-white/5">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <FileText size={32} />
                    </div>
                    <div>
                      <p className="font-bold">No entries yet</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add manual trip expenses or link from history</p>
                    </div>
                  </div>
                ) : (
                  sortedDiaryExpenses.map((expense) => {
                    const split = getExpenseSplit(expense);
                    const safeAmount = Number(expense?.amount) || 0;
                    const isSelected = selectedDiaryExpenseIds.includes(expense._id);

                    return (
                      <div
                        key={expense._id}
                        onDragOver={(event) => {
                          if (!draggedDiaryExpenseId) return;
                          event.preventDefault();
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          moveDiaryExpense(expense._id);
                        }}
                        onClick={() => {
                          if (isSelectingDiaryExpenses) {
                            toggleDiaryExpenseSelection(expense._id);
                            return;
                          }
                          setDetailExpense(expense);
                          setShowExpenseDetailModal(true);
                        }}
                        className={clsx(
                          "flex items-center justify-between p-6 rounded-[28px] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-accent/40 transition-all shadow-sm cursor-pointer",
                          draggedDiaryExpenseId === expense._id && "opacity-50",
                          isSelected && "border-accent/60 ring-2 ring-accent/20"
                        )}
                      >
                        <div className="flex items-center gap-5">
                          {!isSelectingDiaryExpenses && (
                            <button
                              type="button"
                              draggable
                              onDragStart={(event) => {
                                event.stopPropagation();
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData('text/plain', expense._id);
                                setDraggedDiaryExpenseId(expense._id);
                              }}
                              onDragEnd={() => setDraggedDiaryExpenseId(null)}
                              onClick={(event) => event.stopPropagation()}
                              className="flex h-10 w-8 cursor-grab items-center justify-center rounded-xl text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing dark:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-300"
                              aria-label="Drag to reorder entry"
                              title="Drag to reorder"
                            >
                              <GripVertical size={18} />
                            </button>
                          )}
                          {isSelectingDiaryExpenses && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDiaryExpenseSelection(expense._id);
                              }}
                              className={clsx(
                                "flex h-8 w-8 items-center justify-center rounded-lg border transition",
                                isSelected ? "border-slate-950 bg-slate-950 text-white dark:border-accent dark:bg-accent" : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300"
                              )}
                              aria-label={`Select expense ${expense._id}`}
                            >
                              {isSelected ? <Check size={16} /> : <Square size={16} />}
                            </button>
                          )}
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-slate-950 group-hover:text-white transition-colors dark:group-hover:bg-accent">
                            <Wallet size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-lg leading-tight">{expense.notes || 'Expense'}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-xs text-slate-400 font-medium">{format(new Date(expense.date), 'dd MMM yyyy')}</span>
                              <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                              <div className="flex items-center gap-1.5">
                                <Users size={12} className="text-slate-400" />
                                <div className="flex -space-x-1.5">
                                  {split.members.map((m: string, i: number) => (
                                    <div key={i} className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/20 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-slate-600 dark:text-white uppercase" title={m}>
                                      {m[0]}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {split.members.map((member: string) => (
                                <div
                                  key={member}
                                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
                                >
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/70 text-[9px] font-black">
                                    {member[0]}
                                  </span>
                                  <span>{member}</span>
                                  <span className="text-[9px] font-black opacity-80">₹{Math.round(split.amounts[member] || 0).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-black tracking-tight">₹{safeAmount.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1.5">{expense.category}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                if (isSelectingDiaryExpenses) return;
                                e.stopPropagation();
                                const isCustom = typeof expense.involvedMembers === 'object' && !Array.isArray(expense.involvedMembers);

                                const normalizedCategory = isStandardCategory(expense.category)
                                  ? expense.category
                                  : String(expense.category || 'Custom');

                                setEditingForm({
                                  id: expense._id,
                                  amount: String(safeAmount),
                                  category: normalizedCategory,
                                  customCategory: normalizedCategory === 'Custom' ? String(expense.category || '') : '',
                                  notes: expense.notes,
                                  optionalNote: expense.optionalNote || '',
                                  date: expense.date,
                                  involvedMembers: Array.isArray(expense.involvedMembers) ? [...expense.involvedMembers] : [],
                                  splitType: isCustom ? 'custom' : 'equal',
                                  customSplits: isCustom ? Object.fromEntries(Object.entries(expense.involvedMembers).map(([m, v]) => [m, String(v)])) : {}
                                });
                                setShowEditModal(true);
                              }}
                              className={clsx(
                                "w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 transition-all",
                                isSelectingDiaryExpenses ? "opacity-40 cursor-not-allowed" : "hover:text-accent hover:bg-accent/10"
                              )}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                if (isSelectingDiaryExpenses) return;
                                e.stopPropagation();
                                handleDeleteExpense(expense._id);
                              }}
                              className={clsx(
                                "w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 transition-all",
                                isSelectingDiaryExpenses ? "opacity-40 cursor-not-allowed" : "hover:text-red-500 hover:bg-red-500/10"
                              )}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-950 dark:bg-accent rounded-[32px] p-8 text-white shadow-2xl shadow-accent/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />

              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-2">Total Trip Cost</p>
              <h2 className="text-5xl font-black tracking-tight mb-10">₹{total.toLocaleString()}</h2>

              <div className="flex flex-wrap gap-3 mb-8">
                <div className="rounded-full bg-white/10 border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest">
                  {diary.expenses?.length || 0} Entries
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="p-6 rounded-[24px] bg-white/10 backdrop-blur-md border border-white/10">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={14} /> Split Accuracy Verified
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed font-medium">Global shares are calculated based on individual transaction involvement.</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 px-1 mb-4">Individual Breakdown</p>
                  {diary.members.map((member, i) => (
                    <div key={member} className="flex items-center justify-between py-3 px-4 rounded-[20px] hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-black">
                          {member[0]}
                        </div>
                        <span className="font-bold tracking-tight">{member}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-lg">₹{Math.round(balances[member]).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Expense Modal */}
        {showManualExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] shadow-3xl border border-white/40 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300">
              <form onSubmit={handleAddManualExpense}>
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black">Add Expense</h3>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Record this transaction and split it among members</p>
                  </div>
                  <button type="button" onClick={() => setShowManualExpenseModal(false)} className="w-12 h-12 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Amount</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          required
                          type="number"
                          autoFocus
                          value={manualForm.amount}
                          onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                          placeholder="0"
                          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-black text-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Category</label>
                      <div className="relative">
                        <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                          required
                          value={manualForm.category}
                          onChange={(e) => {
                            const nextCategory = e.target.value as CategorySelect;
                            setManualForm({
                              ...manualForm,
                              category: nextCategory,
                              customCategory: nextCategory === 'Custom' ? manualForm.customCategory : ''
                            });
                          }}
                          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-bold appearance-none cursor-pointer"
                        >
                          {categoryOptions.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat === 'Hotel' ? 'Hotels' : cat}
                            </option>
                          ))}
                          <option value="Custom">Custom</option>
                        </select>
                      </div>
                      {manualForm.category === 'Custom' && (
                        <div className="relative">
                          <input
                            required
                            value={manualForm.customCategory}
                            onChange={(e) => setManualForm({ ...manualForm, customCategory: e.target.value })}
                            placeholder="Enter custom category"
                            className="w-full pl-6 pr-6 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-bold"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Description</label>
                    <div className="relative">
                      <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        value={manualForm.notes}
                        onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                        placeholder="What was this for?"
                        className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Date (Optional)</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="date"
                        value={manualForm.date || ''}
                        onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Optional Note</label>
                    <div className="relative">
                      <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        value={manualForm.optionalNote || ''}
                        onChange={(e) => setManualForm({ ...manualForm, optionalNote: e.target.value })}
                        placeholder="Extra details (optional)"
                        className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Split Configuration</label>
                      <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setManualForm({ ...manualForm, splitType: 'equal', involvedMembers: [...diary.members] })}
                          className={clsx(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            manualForm.splitType === 'equal' ? "bg-white dark:bg-slate-800 shadow-sm text-accent" : "text-slate-500"
                          )}
                        >
                          Equal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const initialCustom = {} as Record<string, string>;
                            diary.members.forEach(m => initialCustom[m] = '');
                            setManualForm({ ...manualForm, splitType: 'custom', customSplits: initialCustom });
                          }}
                          className={clsx(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            manualForm.splitType === 'custom' ? "bg-white dark:bg-slate-800 shadow-sm text-accent" : "text-slate-500"
                          )}
                        >
                          Custom
                        </button>
                      </div>
                    </div>

                    {manualForm.splitType === 'equal' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Involved Members</p>
                          <button
                            type="button"
                            onClick={toggleAllManualMembers}
                            className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline"
                          >
                            {manualForm.involvedMembers.length === diary.members.length ? "Deselect All" : "Select All Members"}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {diary.members.map((member) => (
                            <div
                              key={member}
                              onClick={() => toggleManualMember(member)}
                              className={clsx(
                                "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all active:scale-95",
                                manualForm.involvedMembers.includes(member)
                                  ? "bg-accent/5 border-accent/40 shadow-sm"
                                  : "bg-slate-50 dark:bg-white/5 border-transparent grayscale opacity-60"
                              )}
                            >
                              <div className={clsx(
                                "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                manualForm.involvedMembers.includes(member) ? "bg-slate-950 text-white dark:bg-accent" : "bg-slate-200 dark:bg-white/10 text-transparent"
                              )}>
                                <Check size={14} strokeWidth={3} />
                              </div>
                              <span className="font-bold text-sm tracking-tight">{member}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {diary.members.map((member) => (
                          <div key={member} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-black">
                                {member[0]}
                              </div>
                              <span className="font-bold text-sm">{member}</span>
                            </div>
                            <div className="relative w-32">
                              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                              <input
                                type="number"
                                placeholder="0"
                                value={manualForm.customSplits[member] || ''}
                                onChange={(e) => {
                                  const nextSplits = { ...manualForm.customSplits, [member]: e.target.value };
                                  const nextTotal = Object.values(nextSplits).reduce((sum, val) => sum + (Number(val) || 0), 0);
                                  setManualForm({
                                    ...manualForm,
                                    customSplits: nextSplits,
                                    amount: nextTotal > 0 ? String(nextTotal) : manualForm.amount
                                  });
                                }}
                                className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:outline-none focus:border-accent text-right font-black"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-8 bg-slate-50 dark:bg-white/5 flex gap-4">
                  <Button variant="outline" type="button" onClick={() => setShowManualExpenseModal(false)} className="flex-1 rounded-[24px] h-16">Cancel</Button>
                  <Button
                    type="submit"
                    disabled={manualForm.involvedMembers.length === 0}
                    className="flex-[2] rounded-[24px] h-16 bg-slate-950 dark:bg-accent text-white shadow-2xl shadow-accent/20 font-black"
                  >
                    Record & Split
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Expense Modal */}
        {showEditModal && editingForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] shadow-3xl border border-white/40 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300">
              <form onSubmit={handleUpdateExpense}>
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black">Edit Expense</h3>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Update entry details and cost split</p>
                  </div>
                  <button type="button" onClick={() => setShowEditModal(false)} className="w-12 h-12 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Amount</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          required
                          type="number"
                          value={editingForm.amount}
                          onChange={(e) => setEditingForm({ ...editingForm, amount: e.target.value })}
                          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-black text-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Category</label>
                      <div className="relative">
                        <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                          required
                          value={editingForm.category}
                          onChange={(e) => {
                            const nextCategory = e.target.value as CategorySelect;
                            setEditingForm({
                              ...editingForm,
                              category: nextCategory,
                              customCategory: nextCategory === 'Custom' ? editingForm.customCategory : ''
                            });
                          }}
                          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-bold appearance-none cursor-pointer"
                        >
                          {categoryOptions.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat === 'Hotel' ? 'Hotels' : cat}
                            </option>
                          ))}
                          <option value="Custom">Custom</option>
                        </select>
                      </div>
                      {editingForm.category === 'Custom' && (
                        <div className="relative">
                          <input
                            required
                            value={editingForm.customCategory}
                            onChange={(e) => setEditingForm({ ...editingForm, customCategory: e.target.value })}
                            placeholder="Enter custom category"
                            className="w-full pl-6 pr-6 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-bold"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Description</label>
                    <div className="relative">
                      <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        value={editingForm.notes}
                        onChange={(e) => setEditingForm({ ...editingForm, notes: e.target.value })}
                        placeholder="What was this for?"
                        className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        type="date"
                        value={editingForm.date ? format(new Date(editingForm.date), 'yyyy-MM-dd') : ''}
                        onChange={(e) => setEditingForm({ ...editingForm, date: e.target.value })}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Optional Note</label>
                    <div className="relative">
                      <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        value={editingForm.optionalNote || ''}
                        onChange={(e) => setEditingForm({ ...editingForm, optionalNote: e.target.value })}
                        placeholder="Extra details (optional)"
                        className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Split Configuration</label>
                      <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setEditingForm({ ...editingForm!, splitType: 'equal', involvedMembers: [...diary.members] })}
                          className={clsx(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            editingForm.splitType === 'equal' ? "bg-white dark:bg-slate-800 shadow-sm text-accent" : "text-slate-500"
                          )}
                        >
                          Equal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const initialCustom = {} as Record<string, string>;
                            diary.members.forEach(m => {
                              // If current involvedMembers is already an object, pre-fill it
                              if (typeof editingForm.involvedMembers === 'object' && !Array.isArray(editingForm.involvedMembers)) {
                                initialCustom[m] = String(editingForm.involvedMembers[m] || '');
                              } else {
                                initialCustom[m] = '';
                              }
                            });
                            setEditingForm({ ...editingForm!, splitType: 'custom', customSplits: initialCustom });
                          }}
                          className={clsx(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            editingForm.splitType === 'custom' ? "bg-white dark:bg-slate-800 shadow-sm text-accent" : "text-slate-500"
                          )}
                        >
                          Custom
                        </button>
                      </div>
                    </div>

                    {editingForm.splitType === 'equal' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Involved Members</p>
                          <button
                            type="button"
                            onClick={toggleAllEditingMembers}
                            className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline"
                          >
                            {Array.isArray(editingForm.involvedMembers) && editingForm.involvedMembers.length === diary.members.length ? "Deselect All" : "Select All Members"}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {diary.members.map((member) => (
                            <div
                              key={member}
                              onClick={() => toggleEditingMember(member)}
                              className={clsx(
                                "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all active:scale-95",
                                Array.isArray(editingForm.involvedMembers) && editingForm.involvedMembers.includes(member)
                                  ? "bg-accent/5 border-accent/40 shadow-sm"
                                  : "bg-slate-50 dark:bg-white/5 border-transparent grayscale opacity-60"
                              )}
                            >
                              <div className={clsx(
                                "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                Array.isArray(editingForm.involvedMembers) && editingForm.involvedMembers.includes(member) ? "bg-slate-950 text-white dark:bg-accent" : "bg-slate-200 dark:bg-white/10 text-transparent"
                              )}>
                                <Check size={14} strokeWidth={3} />
                              </div>
                              <span className="font-bold text-sm tracking-tight">{member}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {diary.members.map((member) => (
                          <div key={member} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-black">
                                {member[0]}
                              </div>
                              <span className="font-bold text-sm">{member}</span>
                            </div>
                            <div className="relative w-32">
                              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                              <input
                                type="number"
                                placeholder="0"
                                value={editingForm.customSplits[member] || ''}
                                onChange={(e) => {
                                  const nextSplits = { ...editingForm!.customSplits, [member]: e.target.value };
                                  const nextTotal = Object.values(nextSplits).reduce((sum, val) => sum + (Number(val) || 0), 0);
                                  setEditingForm({
                                    ...editingForm!,
                                    customSplits: nextSplits,
                                    amount: nextTotal > 0 ? String(nextTotal) : editingForm!.amount
                                  });
                                }}
                                className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:outline-none focus:border-accent text-right font-black"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-8 bg-slate-50 dark:bg-white/5 flex gap-4">
                  <Button variant="outline" type="button" onClick={() => setShowEditModal(false)} className="flex-1 rounded-[24px] h-16">Cancel</Button>
                  <Button
                    type="submit"
                    disabled={editingForm.involvedMembers.length === 0}
                    className="flex-[2] rounded-[24px] h-16 bg-slate-950 dark:bg-accent text-white shadow-2xl shadow-accent/20 font-black"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Diary Modal */}
        {showEditDiaryModal && selectedDiary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] shadow-3xl border border-white/40 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300">
              <form onSubmit={handleUpdateDiary}>
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black">Edit Diary</h3>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Update the diary name and members</p>
                  </div>
                  <button type="button" onClick={() => setShowEditDiaryModal(false)} className="w-12 h-12 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Diary Name</label>
                    <input
                      required
                      value={editDiaryName}
                      onChange={(e) => setEditDiaryName(e.target.value)}
                      className="w-full pl-6 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Members</label>
                      <button
                        type="button"
                        onClick={handleAddEditMemberField}
                        className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline"
                      >
                        Add member
                      </button>
                    </div>
                    <div className="space-y-3">
                      {editDiaryMembers.map((member, index) => (
                        <div key={`${member}-${index}`} className="flex items-center gap-3">
                          <input
                            value={member}
                            onChange={(e) => handleEditDiaryMemberChange(index, e.target.value)}
                            placeholder="Member name"
                            className="flex-1 pl-6 pr-6 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveEditMember(index)}
                            className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors"
                            aria-label="Remove member"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 dark:bg-white/5 flex gap-4">
                  <Button variant="outline" type="button" onClick={() => setShowEditDiaryModal(false)} className="flex-1 rounded-[24px] h-16">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-[2] rounded-[24px] h-16 bg-slate-950 dark:bg-accent text-white shadow-2xl shadow-accent/20 font-black">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Expense Detail Modal */}
        {showExpenseDetailModal && detailExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-3xl border border-white/40 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black">Transaction Details</h3>
                  <p className="text-slate-500 text-sm mt-1 font-medium">{format(new Date(detailExpense.date), 'dd MMM yyyy')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseDetailModal(false);
                    setDetailExpense(null);
                  }}
                  className="w-12 h-12 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between rounded-3xl border border-slate-100 dark:border-white/5 p-6 bg-slate-50 dark:bg-white/5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Amount</p>
                    <p className="text-3xl font-black mt-2">₹{Number(detailExpense?.amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category</p>
                    <p className="text-sm font-black mt-2 uppercase">{detailExpense.category}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Description</p>
                  <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 p-4">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {detailExpense.notes?.trim() ? detailExpense.notes : "No description added."}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Optional Note</p>
                  <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 p-4">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {detailExpense.optionalNote?.trim() ? detailExpense.optionalNote : "No optional note added."}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Member Split</p>
                  <div className="flex flex-wrap gap-2">
                    {getExpenseSplit(detailExpense).members.map((member: string) => {
                      const share = getExpenseSplit(detailExpense).amounts[member] || 0;
                      return (
                        <div
                          key={member}
                          className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/70 text-[9px] font-black">
                            {member[0]}
                          </span>
                          <span>{member}</span>
                          <span className="text-[9px] font-black opacity-80">₹{Math.round(share).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-ink dark:text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Finance Diaries</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Turn group trip expenses into organized memories</p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="rounded-[24px] px-8 h-14 gap-2 bg-slate-950 text-white dark:bg-accent hover:scale-[1.03] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 font-bold"
          >
            <Plus size={20} /> Create New Diary
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {diaries?.map((diary) => (
          <div
            key={diary._id}
            onClick={() => {
              setSelectedDiary(diary);
              setView('detail');
            }}
            className="group relative cursor-pointer"
          >
            <div className="absolute inset-x-4 -bottom-4 h-12 bg-accent opacity-0 group-hover:opacity-20 blur-3xl transition-all duration-500 rounded-full" />
            <div className="relative glass-panel rounded-[40px] p-8 border border-white/70 dark:border-white/5 hover:border-accent/40 transition-all duration-500 transform hover:-translate-y-3 group-hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/15 transition-all duration-500" />

              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 rounded-[24px] bg-slate-950 text-white flex items-center justify-center shadow-xl shadow-accent/20 group-hover:scale-110 transition-transform duration-500 dark:bg-accent">
                  <BookOpen size={32} strokeWidth={2.5} />
                </div>
                <div className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/5">
                  {format(new Date(diary.createdAt), 'MMM yyyy')}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-black leading-tight tracking-tight transition-colors group-hover:text-slate-900 dark:group-hover:text-accent">{diary.name}</h3>

                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {diary.members.slice(0, 3).map((m, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        {m[0]}
                      </div>
                    ))}
                    {diary.members.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                        +{diary.members.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{diary.members.length} Members</span>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1 ml-0.5">Total Expenses</p>
                  <p className="text-3xl font-black tracking-tight">₹{(diary.expenses?.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0) || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 group-hover:text-accent group-hover:bg-accent/10 group-hover:rotate-12 transition-all duration-300">
                  <ChevronRight size={24} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowCreateModal(true)}
          className="group relative border-3 border-dashed border-slate-200 dark:border-white/5 rounded-[40px] p-8 flex flex-col items-center justify-center gap-6 hover:border-accent/40 hover:bg-accent/5 transition-all duration-500 min-h-[300px]"
        >
          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 group-hover:text-accent group-hover:scale-110 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-accent/10">
            <Plus size={40} strokeWidth={3} />
          </div>
          <div className="text-center">
            <p className="text-lg font-black">New Memory</p>
            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest max-w-[150px] leading-relaxed">Click to start your trip finance diary</p>
          </div>
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] shadow-3xl border border-white/40 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={handleCreateDiary}>
              <div className="p-10 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="text-3xl font-black tracking-tight">Create Diary</h3>
                  <p className="text-slate-500 font-medium text-sm mt-1">Set up your trip or shared expense group</p>
                </div>
                <button type="button" onClick={() => setShowCreateModal(false)} className="w-12 h-12 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">Diary Name</label>
                  <input
                    autoFocus
                    required
                    value={newDiaryName}
                    onChange={(e) => setNewDiaryName(e.target.value)}
                    placeholder="e.g., Jaipur with Friends"
                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-bold text-lg"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Members</label>
                    <button type="button" onClick={handleAddMemberField} className="text-xs font-black text-accent hover:underline flex items-center gap-1">
                      <Plus size={14} /> Add Member
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {newDiaryMembers.map((member, i) => (
                      <div key={i} className="relative group">
                        <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          required
                          value={member}
                          onChange={(e) => handleMemberChange(i, e.target.value)}
                          placeholder={`Member #${i + 1} name`}
                          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-accent transition-all font-semibold"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-10 bg-slate-50 dark:bg-white/5 flex gap-4">
                <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)} className="flex-1 rounded-[24px] h-16 text-lg">Cancel</Button>
                <Button type="submit" className="flex-[2] rounded-[24px] h-16 bg-slate-950 dark:bg-accent text-white shadow-2xl shadow-accent/20 text-lg font-black">
                  Construct Diary
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
