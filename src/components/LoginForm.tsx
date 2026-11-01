import React, { useState } from 'react';
import { UserIcon, LockIcon, LogInIcon, AlertTriangleIcon, EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { validateEmail, sanitizeString } from '../utils/validation';
import { useAuth } from '../features/authentication/hooks/useAuth';
import { ApiError } from '../services/api/client';

interface LoginFormProps {
  /** Called after a successful sign-in. */
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export function LoginForm({ onSuccess, onForgotPassword }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const clearErrors = () => {
    setError('');
    setLocked(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    clearErrors();

    const cleanEmail = sanitizeString(email);
    const emailCheck = validateEmail(cleanEmail);
    if (!emailCheck.valid) {
      setError(emailCheck.error ?? 'Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      // Credentials are verified by the server; nothing about accounts or passwords exists in the browser.
      await login(cleanEmail, password, remember);
      setPassword('');
      onSuccess?.();
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      setLocked(apiErr?.status === 429);
      setError(apiErr?.message ?? 'Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100';

  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
        <p className="text-gray-600 mt-2">Sign in to your energy monitoring account</p>
      </div>

      {/* Announced to screen readers whenever it changes */}
      <div aria-live="polite" role="status">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              {locked && <AlertTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" aria-hidden="true" />}
              <div>
                {locked && <p className="text-sm font-semibold text-red-800">Account temporarily locked</p>}
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearErrors();
              }}
              className={fieldClass}
              placeholder="you@example.com"
              required
              maxLength={254}
              disabled={locked || submitting}
              autoComplete="username"
              aria-invalid={error ? true : undefined}
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearErrors();
              }}
              className={`${fieldClass} pr-10`}
              placeholder="Password"
              required
              maxLength={128}
              disabled={locked || submitting}
              autoComplete="current-password"
              aria-invalid={error ? true : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOffIcon className="h-5 w-5" aria-hidden="true" /> : <EyeIcon className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={locked || submitting}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Keep me signed in on this device
            </label>
          </div>
          <div className="text-sm">
            <button type="button" className="font-medium text-blue-600 hover:text-blue-500" onClick={() => onForgotPassword?.()}>
              Forgot your password?
            </button>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={locked || submitting}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              {submitting ? (
                <Loader2Icon className="h-5 w-5 text-blue-200 animate-spin" aria-hidden="true" />
              ) : (
                <LogInIcon className="h-5 w-5 text-blue-300 group-hover:text-blue-200" aria-hidden="true" />
              )}
            </span>
            {locked ? 'Account locked' : submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Need an account?</span>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">Contact your administrator to create an account</p>
        <p className="mt-3 text-center text-sm text-gray-600">
          Customer with a meter account?{' '}
          <a href="/meter-login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in with your account number
          </a>
        </p>
      </div>
    </div>
  );
}
