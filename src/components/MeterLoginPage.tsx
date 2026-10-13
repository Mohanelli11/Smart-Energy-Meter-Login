import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ZapIcon, LockIcon, LogInIcon, EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { useAuth } from '../features/authentication/hooks/useAuth';
import { ApiError } from '../services/api/client';

export function MeterLoginPage() {
  const navigate = useNavigate();
  const { meterLogin, user } = useAuth();
  const [accountNo, setAccountNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await meterLogin(accountNo.trim().toUpperCase(), password);
      setPassword('');
      navigate('/meter', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <ZapIcon className="h-8 w-8 text-blue-600" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Meter Login</h1>
            <p className="text-gray-600 mt-2">Access your individual meter dashboard</p>
          </div>

          <div aria-live="polite" role="status">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="meter-account" className="block text-sm font-medium text-gray-700 mb-2">
                Account number
              </label>
              <input
                id="meter-account"
                type="text"
                value={accountNo}
                onChange={(e) => {
                  setAccountNo(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., MET-1234-2023"
                autoComplete="username"
                maxLength={50}
                required
              />
            </div>

            <div>
              <label htmlFor="meter-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="meter-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  maxLength={128}
                  required
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2Icon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" /> : <LogInIcon className="h-5 w-5 mr-2" aria-hidden="true" />}
              {submitting ? 'Signing in…' : 'Access Meter Dashboard'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => navigate(user ? '/dashboard' : '/login')} className="text-sm text-blue-600 hover:text-blue-700">
              {user ? '← Back to Admin Dashboard' : '← Back to staff sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
