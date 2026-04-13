import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field, Input } from '../components/ui/Input';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage('');
      setSuccessMessage('');

      if (form.password !== form.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (form.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const { data } = await api.post('/auth/forgot-password', {
        email: form.email,
        password: form.password
      });

      return data;
    },
    onSuccess: (data: { message: string }) => {
      setSuccessMessage(data.message);
      window.setTimeout(() => navigate('/login'), 1200);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <Card className="mx-auto w-full max-w-xl p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">Reset access</p>
          <h1 className="mt-4 text-4xl font-extrabold text-ink dark:text-white">Reset your password</h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Enter your email and choose a new password for your FinTrack account.</p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              resetPasswordMutation.mutate();
            }}
          >
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((state) => ({ ...state, email: e.target.value }))}
                required
              />
            </Field>
            <Field label="New Password">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((state) => ({ ...state, password: e.target.value }))}
                required
              />
            </Field>
            <Field label="Confirm Password">
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((state) => ({ ...state, confirmPassword: e.target.value }))}
                required
              />
            </Field>
            <Button className="w-full justify-center" disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? 'Updating password...' : 'Reset Password'}
            </Button>
            {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
          </form>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Remembered your password?{' '}
            <Link className="font-semibold text-accent" to="/login">
              Back to login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};
