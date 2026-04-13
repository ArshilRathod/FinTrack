import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const WelcomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate('/', { replace: true });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="welcome-screen relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10 text-slate-950 dark:text-slate-50">
      <div className="welcome-screen__blur welcome-screen__blur--one" />
      <div className="welcome-screen__blur welcome-screen__blur--two" />
      <div className="welcome-screen__blur welcome-screen__blur--three" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">
        <p className="text-xs uppercase tracking-[0.38em] text-slate-700/80 dark:text-slate-300/80">{user?.name ? `Welcome, ${user.name.split(' ')[0]}` : 'FinTrack session ready'}</p>
        <h1 className="mt-10 text-4xl font-extrabold tracking-tight text-slate-950/90 dark:text-white/90 sm:text-6xl md:text-7xl">
          <span className="welcome-word inline-block">Welcome to FinTrack</span>
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-700/75 dark:text-slate-300/80 sm:text-base">
          Your finance workspace is ready with expenses, loans, insights, and education so you can move straight into the experience.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-600/75 dark:text-slate-400/80">Entering automatically...</p>
        </div>
      </div>
    </div>
  );
};
