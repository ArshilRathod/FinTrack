import { Bell, BookOpen } from 'lucide-react';
import { BrainCircuit, CreditCard, GraduationCap, Home, PanelLeftClose, Settings, UserCircle2, WalletCards, Scale } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/expenses', label: 'Expense Tracking', icon: WalletCards },
  { to: '/loans', label: 'EMI & Loans', icon: CreditCard },
  { to: '/diary', label: 'Finance Diary', icon: BookOpen },
  { to: '/education', label: 'Finance Education', icon: GraduationCap },
  { to: '/comparisons', label: 'Comparisons', icon: Scale },
  { to: '/insights', label: 'Insights', icon: BrainCircuit },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/profile', label: 'Profile', icon: UserCircle2 }
];

export const Sidebar = ({ mobile = false, onHide }: { mobile?: boolean; onHide?: () => void }) => {
  const { unreadCount } = useNotifications();

  return (
    <aside
      className={`${
        mobile
          ? 'flex w-full max-h-[75vh] overflow-y-auto rounded-[28px]'
          : 'sticky top-0 hidden h-screen w-72 rounded-r-[28px] lg:flex'
      } flex-col justify-between border-r border-white/10 bg-slate-950 px-6 py-8 text-white shadow-panel`}
    >
      <div>
        <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-black p-5">
          <p className="text-sm uppercase tracking-[0.28em] text-white font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>FinTrack</p>
          {!mobile && onHide && (
            <button
              className="rounded-2xl border border-white/10 p-2 text-white transition hover:bg-white/10"
              onClick={onHide}
              type="button"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>
        <nav className="mt-8 space-y-2">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-white hover:bg-white/10'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

        </nav>
      </div>
    </aside>
  );
};
