import { AlertTriangle, Bell, CheckCheck, CreditCard, FileText, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useNotifications } from '../hooks/useNotifications';
import { useSettings } from '../hooks/useSettings';

const getIcon = (type: string) => {
  switch (type) {
    case 'budget':
      return <Wallet size={22} />;
    case 'subscription':
      return <FileText size={22} />;
    case 'loan':
      return <CreditCard size={22} />;
    default:
      return <AlertTriangle size={22} />;
  }
};

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200';
    case 'critical':
      return 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-200';
    default:
      return 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/50 dark:bg-blue-500/10 dark:text-blue-200';
  }
};

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { allNotifications, unread, unreadCount, isLoading, dismissed, markAsRead, markAsUnread, getNavPath } = useNotifications();
  const { settings } = useSettings();

  const disabledNoticeItems = [
    !settings.budgetAlerts && 'Budget alerts are disabled in settings.',
    !settings.billPaymentReminders && 'Bill payment reminders are disabled in settings.',
    !settings.recurringTransactionSetup && 'Subscription reminders are disabled in settings.',
    !settings.largeTransactionAlerts && 'Large transaction alerts are disabled in settings.',
    !settings.weeklySpendingSummary && 'Weekly spending summary is disabled in settings.',
    !settings.monthlyFinancialReport && 'Monthly financial report is disabled in settings.'
  ].filter(Boolean) as string[];

  const handleNotificationClick = (type: 'budget' | 'subscription' | 'loan', id: string) => {
    if (!dismissed.has(id)) markAsRead(id);
    navigate(getNavPath(type));
  };

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader
          eyebrow="Alerts & Reminders"
          title="Notifications"
          description="Stay on top of your budget limits, upcoming subscriptions, and loan EMIs. Click a notification to go to its section."
          action={
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white">
                  {unreadCount} unread
                </span>
              )}
              <Bell size={30} className="text-accent" />
            </div>
          }
        />
      </Card>

      {!settings.notifications && (
        <Card className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
          <Link to="/settings?focus=alerts#settings-alerts" className="font-semibold underline">
            Notifications are disabled in settings. Enable them to view alerts and reminders here.
          </Link>
        </Card>
      )}

      {settings.notifications && disabledNoticeItems.length > 0 && (
        <Card className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
          {disabledNoticeItems.map((item) => (
            <p key={item} className="mt-1 first:mt-0">
              <Link to="/settings?focus=alerts#settings-alerts" className="underline">
                {item}
              </Link>
            </p>
          ))}
        </Card>
      )}

      {settings.notifications && isLoading ? (
        <div className="text-slate-400">Loading notifications...</div>
      ) : settings.notifications && allNotifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <Bell size={48} className="mb-4 opacity-20" />
          <p className="font-semibold">All clear!</p>
          <p className="mt-1 text-sm">No active notifications right now.</p>
        </Card>
      ) : settings.notifications ? (
        <div className="grid gap-4">
          {allNotifications.map((notification) => {
            const isRead = dismissed.has(notification.id);
            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.type, notification.id)}
                className={`group relative cursor-pointer rounded-[28px] border p-6 transition-all hover:scale-[1.005] ${
                  isRead
                    ? 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-900'
                    : getSeverityClass(notification.severity)
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold ${isRead ? 'text-base line-through opacity-60' : 'text-lg'}`}>
                      {notification.title}
                    </h3>
                    <p className="mt-1 text-sm opacity-80">{notification.message}</p>
                    <p className="mt-2 text-xs opacity-50">
                      Tap to go to {notification.type === 'loan' ? 'EMI & Loans' : 'Expense Tracking'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      isRead ? markAsUnread(notification.id) : markAsRead(notification.id);
                    }}
                    className="shrink-0 flex items-center gap-2 rounded-full border border-current/30 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/20 hover:scale-105"
                  >
                    <CheckCheck size={13} />
                    {isRead ? 'Mark as unread' : 'Mark as read'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
