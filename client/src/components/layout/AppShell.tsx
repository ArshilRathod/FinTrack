import { Bell, LogOut, Menu, PanelLeftOpen, RefreshCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { useNotifications } from '../../hooks/useNotifications';
import { Sidebar } from './Sidebar';

export const AppShell = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { unreadCount } = useNotifications();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="min-h-screen lg:flex">
      {sidebarVisible && <Sidebar onHide={() => setSidebarVisible(false)} />}
      <div className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 rounded-[24px] border border-white/70 bg-white/88 px-4 py-3 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 dark:border-slate-800 dark:bg-slate-900/88">
            <div className="min-w-0">
              <h2 className="text-xl font-bold leading-tight text-ink sm:text-2xl dark:text-white">
                Welcome back, {user?.name?.split(' ')[0]}
              </h2>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
              {!sidebarVisible && (
                <button
                  className="hidden rounded-2xl border border-slate-200 p-3 dark:border-slate-700 lg:block"
                  onClick={() => setSidebarVisible(true)}
                  type="button"
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              <button className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700 lg:hidden" onClick={() => setOpen((value) => !value)}>
                <Menu size={18} />
              </button>
              <button
                className="rounded-2xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={async () => {
                  if (isRefreshing) return;
                  setIsRefreshing(true);
                  try {
                    await Promise.all([
                      queryClient.refetchQueries({ queryKey: ['notifications'] }),
                      queryClient.refetchQueries({ queryKey: ['expenses'] })
                    ]);
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                type="button"
                aria-label="Refresh notifications"
                title="Refresh notifications"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <Link
                to="/notifications"
                className="relative rounded-2xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="View notifications"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white border-2 border-white dark:border-slate-900">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <button
                className="rounded-2xl bg-slate-950 p-3 text-white transition hover:-translate-y-0.5 dark:bg-accent dark:text-white dark:hover:bg-[#129286]"
                onClick={logout}
                type="button"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
          {open && (
            <div className="mb-6 rounded-[28px] bg-slate-950 p-4 lg:hidden" ref={mobileMenuRef}>
              <Sidebar mobile onHide={() => setOpen(false)} />
            </div>
          )}
          <Outlet />
        </div>
      </div>
    </div>
  );
};
