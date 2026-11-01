import React, { useEffect, useState } from 'react';
import { PhoneIcon, KeyIcon, LockIcon, CheckCircleIcon, ArrowLeftIcon, AlertTriangleIcon, InfoIcon, Loader2Icon } from 'lucide-react';
import * as authService from '../features/authentication/services/auth.service';
import { toApiError } from '../services/api/client';
import { checkPasswordPolicy, isValidPhone, normalizePhone, PASSWORD_HINT, PHONE_HINT } from '../utils/passwordPolicy';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

const inputClass =
  'block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
const primaryButton =
  'w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors';

export function ForgotPasswordPage({ onBackToLogin }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [resendIn, setResendIn] = useState(0);

  // Code-expiry countdown
  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [step, timeLeft]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  // Auto-redirect on success
  useEffect(() => {
    if (step !== 4) return;
    const id = setTimeout(onBackToLogin, 4000);
    return () => clearTimeout(id);
  }, [step, onBackToLogin]);

  const run = async (fn: () => Promise<void>) => {
    setError('');
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      if (!isValidPhone(phone)) {
        setError(`Enter your phone number in international format. ${PHONE_HINT}`);
        return;
      }
      const res = await authService.requestPasswordReset(normalizePhone(phone));
      setTimeLeft(res.expiresInSeconds);
      setResendIn(res.resendAfterSeconds);
      setOtp('');
      setStep(2);
    });

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendCode();
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (!/^\d{6}$/.test(otp)) {
        setError('Enter the 6-digit code.');
        return;
      }
      setResetToken(await authService.verifyResetCode(normalizePhone(phone), otp));
      setStep(3);
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const policy = checkPasswordPolicy(newPassword);
      if (!policy.ok) {
        setError(policy.error!);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      await authService.confirmPasswordReset(resetToken, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
      setStep(4);
    });
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  const spinner = busy ? <Loader2Icon className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" /> : null;

  return (
    <div className="max-w-md w-full">
      <div className="mb-6">
        <button onClick={onBackToLogin} className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
          Back to Login
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>
        <p className="text-gray-600">
          {step === 1 && 'Enter your registered phone number to receive a verification code.'}
          {step === 2 && 'Enter the 6-digit code sent to your phone.'}
          {step === 3 && 'Create a new secure password.'}
          {step === 4 && 'Password reset successful!'}
        </p>
      </div>

      <div aria-live="polite" role="status">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {step === 1 && (
        <form onSubmit={handlePhoneSubmit} className="space-y-6" noValidate>
          <div>
            <label htmlFor="reset-phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="reset-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError('');
                }}
                className={inputClass}
                placeholder="+254700000000"
                autoComplete="tel"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">{PHONE_HINT}</p>
          </div>
          <button type="submit" disabled={busy} className={primaryButton}>
            {spinner}
            Send code
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleOtpSubmit} className="space-y-6" noValidate>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
            <InfoIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-blue-800">
              If an account exists for that number, we've sent a verification code by SMS. Never share this code with anyone.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="reset-otp" className="block text-sm font-medium text-gray-700">
                Verification code
              </label>
              <span className={`text-sm font-medium ${timeLeft < 60 ? 'text-red-600' : 'text-gray-500'}`}>
                {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'Code expired'}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                className={`${inputClass} text-center tracking-widest text-lg`}
                placeholder="000000"
                required
                maxLength={6}
              />
            </div>
          </div>
          <button type="submit" disabled={busy || timeLeft === 0} className={primaryButton}>
            {spinner}
            Verify code
          </button>
          <div className="text-center">
            <button
              type="button"
              disabled={busy || resendIn > 0}
              onClick={() => void sendCode()}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendIn > 0 ? `Send a new code in ${resendIn}s` : "Didn't receive the code? Send a new one"}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handlePasswordSubmit} className="space-y-6" noValidate>
          <div>
            <label htmlFor="reset-new" className="block text-sm font-medium text-gray-700 mb-2">
              New password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="reset-new"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                className={inputClass}
                placeholder="New password"
                autoComplete="new-password"
                required
                maxLength={128}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">{PASSWORD_HINT}</p>
          </div>
          <div>
            <label htmlFor="reset-confirm" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm new password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="reset-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                className={inputClass}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                required
                maxLength={128}
              />
            </div>
          </div>
          <button type="submit" disabled={busy} className={primaryButton}>
            {spinner}
            Reset password
          </button>
        </form>
      )}

      {step === 4 && (
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircleIcon className="h-8 w-8 text-green-600" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password updated</h2>
          <p className="text-gray-600 mb-8">
            Your password has been reset and you've been signed out of other devices. You'll be taken to the login page shortly.
          </p>
          <button onClick={onBackToLogin} className={primaryButton}>
            Return to login now
          </button>
        </div>
      )}
    </div>
  );
}
