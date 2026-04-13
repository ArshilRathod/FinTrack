import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'budget' | 'subscription' | 'loan';
  severity: 'info' | 'warning' | 'critical';
}

interface NotificationsContextType {
  allNotifications: NotificationItem[];
  unread: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  dismissed: Set<string>;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  getNavPath: (type: NotificationItem['type']) => string;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);



export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id ?? 'guest';
  const BUDGET_KEY = `fintrack-budget-plans-${userId}`;
  const DISMISSED_KEY_USER = `fintrack-dismissed-notifications-${userId}`;

  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`fintrack-dismissed-notifications-${userId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const { settings } = useSettings();

  const { data: apiData, isLoading } = useQuery<{ notifications: NotificationItem[] }>({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: settings.notifications,
  });

  const { data: expensesData } = useQuery<{ summary: { total: number } }>({
    queryKey: ['expenses'],
    queryFn: async () => {
      try {
        return (await api.get('/expenses')).data;
      } catch {
        return { summary: { total: 0 } };
      }
    },
    enabled: settings.notifications && settings.budgetAlerts
  });

  const allNotifications = useMemo(() => {
    if (!settings.notifications) return [];
    const result: NotificationItem[] = [...(apiData?.notifications || [])];
    const filtered = result.filter((item) => {
      if (item.type === 'budget' && !settings.budgetAlerts) return false;
      if (item.type === 'loan' && !settings.billPaymentReminders) return false;
      if (item.type === 'subscription' && !settings.recurringTransactionSetup) return false;
      return true;
    });

    if (expensesData && settings.budgetAlerts) {
      const storedBudgets = localStorage.getItem(BUDGET_KEY);
      if (storedBudgets) {
        try {
          const budgets = JSON.parse(storedBudgets);
          const totalTracked = expensesData.summary.total || 0;
          budgets.forEach((budget: any) => {
            if (budget.limit && budget.limit > 0) {
              const percentage = (totalTracked / budget.limit) * 100;
              if (percentage >= 90) {
                filtered.push({
                  id: `local-budget-${budget.id}`,
                  title: 'Manual Budget Alert',
                  message: `${budget.name} has used ${Math.round(percentage)}% of its limit.`,
                  type: 'budget',
                  severity: percentage >= 100 ? 'critical' : 'warning'
                });
              }
            }
          });
        } catch {
          // ignore
        }
      }
    }

    return filtered;
  }, [apiData, expensesData, settings.notifications, settings.budgetAlerts, settings.billPaymentReminders, settings.recurringTransactionSetup, BUDGET_KEY]);

  const unread = useMemo(
    () => allNotifications.filter((n) => !dismissed.has(n.id)),
    [allNotifications, dismissed]
  );

  const markAsRead = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(DISMISSED_KEY_USER, JSON.stringify([...next]));
      return next;
    });
  }, [DISMISSED_KEY_USER]);

  const markAsUnread = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.delete(id);
      localStorage.setItem(DISMISSED_KEY_USER, JSON.stringify([...next]));
      return next;
    });
  }, [DISMISSED_KEY_USER]);

  const getNavPath = (type: NotificationItem['type']) => {
    switch (type) {
      case 'loan':
        return '/loans';
      case 'subscription':
        return '/expenses';
      case 'budget':
      default:
        return '/expenses';
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        allNotifications,
        unread,
    unreadCount: unread.length,
    isLoading: settings.notifications ? isLoading : false,
        dismissed,
        markAsRead,
        markAsUnread,
        getNavPath
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return context;
};
