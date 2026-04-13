import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

export interface Diary {
  _id: string;
  name: string;
  members: string[];
  totalAmount?: number;
  expenseCount?: number;
  expenses?: any[];
  date?: string;
  createdAt: string;
}

export const useDiaries = () => {
  const queryClient = useQueryClient();

  const { data: diaries = [], isLoading } = useQuery<Diary[]>({
    queryKey: ['diaries'],
    queryFn: async () => {
      const { data } = await api.get('/diaries');
      return data;
    }
  });

  const createDiaryMutation = useMutation({
    mutationFn: async (newDiary: { name: string; members: string[] }) => {
      const { data } = await api.post('/diaries', newDiary);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] });
    }
  });

  const updateDiaryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Diary> }) => {
      const { data } = await api.put(`/diaries/${id}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] });
    }
  });

  const deleteDiaryMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/diaries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] });
    }
  });

  const addExpensesToDiaryMutation = useMutation({
    mutationFn: async ({ diaryId, expenseIds }: { diaryId: string; expenseIds: string[] }) => {
      const { data } = await api.post(`/diaries/${diaryId}/expenses`, { expenseIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });

  return {
    diaries,
    isLoading,
    createDiary: createDiaryMutation.mutateAsync,
    updateDiary: updateDiaryMutation.mutateAsync,
    deleteDiary: deleteDiaryMutation.mutateAsync,
    addExpensesToDiary: addExpensesToDiaryMutation.mutateAsync,
    isCreating: createDiaryMutation.isPending
  };
};
