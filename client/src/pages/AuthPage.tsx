import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field, Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

const GoogleLogo = () => (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.88c2.27-2.09 3.56-5.18 3.56-8.64Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.88-3A7.18 7.18 0 0 1 12 19.33a7.13 7.13 0 0 1-6.7-4.92H1.3v3.1A12 12 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.3 14.41A7.2 7.2 0 0 1 4.9 12c0-.84.14-1.65.4-2.41V6.5H1.3A12 12 0 0 0 0 12c0 1.94.46 3.77 1.3 5.5l4-3.09Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.76c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.16 15.24 0 12 0A12 12 0 0 0 1.3 6.5l4 3.09A7.13 7.13 0 0 1 12 4.76Z"
    />
  </svg>
);

export const AuthPage = ({ mode }: { mode: 'login' | 'signup' }) => {
  const navigate = useNavigate();
  const { login, token } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [googleErrorMessage, setGoogleErrorMessage] = useState('');
  const googleTokenClientRef = useRef<GoogleTokenClient | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (token) {
      navigate('/welcome', { replace: true });
    }
  }, [token, navigate]);

  const authMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage('');
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const payload =
        mode === 'login'
          ? { email: form.email.trim(), password: form.password }
          : { ...form, email: form.email.trim() };
      const { data } = await api.post(endpoint, payload);
      return data;
    },
    onSuccess: (data) => {
      login(data);
      navigate('/welcome');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    }
  });

  const googleAuthMutation = useMutation({
    mutationFn: async (payload: { credential?: string; accessToken?: string }) => {
      setErrorMessage('');
      setGoogleErrorMessage('');
      const { data } = await api.post('/auth/google', payload);
      return data;
    },
    onSuccess: (data) => {
      login(data);
      navigate('/welcome');
    },
    onError: (error: Error) => {
      setGoogleErrorMessage(error.message);
    }
  });

  useEffect(() => {
    if (mode !== 'login' || !googleClientId) {
      return;
    }

    let isCancelled = false;
    let script: HTMLScriptElement | null = document.querySelector('script[data-google-identity="true"]');

    const initializeGoogleClient = () => {
      if (isCancelled || !window.google?.accounts?.oauth2) {
        return;
      }

      googleTokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        callback: (response) => {
          if (!response.access_token) {
            setGoogleErrorMessage(response.error_description || response.error || 'Google sign-in failed');
            return;
          }

          googleAuthMutation.mutate({ accessToken: response.access_token });
        }
      });
    };

    const handleScriptError = () => {
      if (!isCancelled) {
        setGoogleErrorMessage('Unable to load Google sign-in right now');
      }
    };

    if (window.google?.accounts?.oauth2) {
      initializeGoogleClient();
      return () => {
        isCancelled = true;
      };
    }

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      document.head.appendChild(script);
    }

    script.addEventListener('load', initializeGoogleClient);
    script.addEventListener('error', handleScriptError);

    return () => {
      isCancelled = true;
      script?.removeEventListener('load', initializeGoogleClient);
      script?.removeEventListener('error', handleScriptError);
    };
  }, [googleClientId, googleAuthMutation, mode]);

  const handleGoogleSignIn = () => {
    setGoogleErrorMessage('');
    setErrorMessage('');

    if (!googleClientId) {
      setGoogleErrorMessage('Google sign-in is not configured yet');
      return;
    }

    if (!googleTokenClientRef.current) {
      setGoogleErrorMessage('Google sign-in is still loading. Try again in a moment.');
      return;
    }

    googleTokenClientRef.current.requestAccessToken();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <Card className="mx-auto w-full max-w-xl p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">{mode === 'login' ? 'Welcome back' : 'Create account'}</p>
          <h2 className="mt-4 text-4xl font-extrabold text-ink dark:text-white">
            {mode === 'login' ? 'Log in to FinTrack' : 'Start your finance workspace'}
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Access your FinTrack workspace immediately after authentication.</p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              authMutation.mutate();
            }}
          >
            {mode === 'signup' && (
              <Field label="Full Name">
                <Input value={form.name} onChange={(e) => setForm((state) => ({ ...state, name: e.target.value }))} required />
              </Field>
            )}
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm((state) => ({ ...state, email: e.target.value }))} required />
            </Field>
            <Field label="Password">
              <Input type="password" value={form.password} onChange={(e) => setForm((state) => ({ ...state, password: e.target.value }))} required />
            </Field>
            {mode === 'login' && (
              <div className="flex justify-end">
                <Link className="text-sm font-semibold text-accent" to="/forgot-password">
                  Forgot password?
                </Link>
              </div>
            )}
            <Button className="w-full justify-center" disabled={authMutation.isPending}>
              {authMutation.isPending ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </Button>
            {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}
          </form>
          {mode === 'login' && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span>Or continue with Google</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleAuthMutation.isPending}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#dadce0] bg-white px-4 text-[14px] font-medium text-[#1f1f1f] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <GoogleLogo />
                <span>Sign in with Google</span>
              </button>
              {googleAuthMutation.isPending && <p className="text-sm text-slate-500 dark:text-slate-400">Signing you in with Google...</p>}
              {googleErrorMessage && <p className="text-sm text-rose-600">{googleErrorMessage}</p>}
            </div>
          )}
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login' ? 'Need an account?' : 'Already registered?'}{' '}
            <Link className="font-semibold text-accent" to={mode === 'login' ? '/signup' : '/login'}>
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};
