import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Expense } from '../lib/types';

export const useExpenses = (filters = {}) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      const { data } = await api.get('/expenses', { params: filters });
      return data;
    }
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (newExpense: Partial<Expense>) => {
      const { data } = await api.post('/expenses', newExpense);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['diaries'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Expense> }) => {
      const { data } = await api.put(`/expenses/${id}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['diaries'] });
    }
  });

  return {
    expenses: data?.expenses || [],
    summary: data?.summary || {},
    isLoading,
    createExpense: createExpenseMutation.mutateAsync,
    updateExpense: updateExpenseMutation.mutateAsync,
    deleteExpense: useMutation({
      mutationFn: async (id: string) => {
        const { data } = await api.delete(`/expenses/${id}`);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['diaries'] });
      }
    }).mutateAsync
  };
};
