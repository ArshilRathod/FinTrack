import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export type AiInsightItem = {
  title: string;
  description: string;
  tone: 'critical' | 'warning' | 'positive' | 'info';
};

export type AiInsightsResponse = {
  expenseInsights: AiInsightItem[];
  savingsInsights: AiInsightItem[];
  investmentInsights: AiInsightItem[];
  generatedAt: string;
  source: 'gemini';
};

export const useAiInsights = () =>
  useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => (await api.get<AiInsightsResponse>('/insights/ai')).data,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: false
  });
