import React, { useEffect, useState } from 'react';
import { PhoneIcon, KeyIcon, LockIcon, CheckCircleIcon, ArrowLeftIcon, AlertTriangleIcon, InfoIcon } from 'lucide-react';
interface ForgotPasswordPageProps {
  userAccounts: Array<{
    email: string;
    password: string;
    name: string;
    role: string;
    phoneNumber?: string;
  }>;
  onPasswordChange: (phone: string, newPassword: string) => void;
  onBackToLogin: () => void;
}
export function ForgotPasswordPage({
  userAccounts,
  onPasswordChange,
  onBackToLogin
}: ForgotPasswordPageProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  // Timer for OTP
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (step === 2 && timeLeft === 0) {
      setError('OTP has expired. Please request a new one.');
      setGeneratedOtp('');
    }
  }, [step, timeLeft]);
  // Auto-redirect on success
  useEffect(() => {
    if (step === 4) {
      const timerId = setTimeout(() => {
        onBackToLogin();
      }, 3000);
      return () => clearTimeout(timerId);
    }
  }, [step, onBackToLogin]);
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const account = userAccounts.find((acc) => acc.phoneNumber === phone);
    if (!account) {
      setError('No account found with this phone number.');
      return;
    }
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setTimeLeft(300); // Reset timer
    setStep(2);
  };
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!generatedOtp || timeLeft === 0) {
      setError('OTP has expired. Please go back and request a new one.');
      return;
    }
    if (otp !== generatedOtp) {
      setError('Invalid OTP code. Please try again.');
      return;
    }
    setStep(3);
  };
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    onPasswordChange(phone, newPassword);
    setStep(4);
  };
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  return <div className="max-w-md w-full">
      <div className="mb-6">
        <button onClick={onBackToLogin} className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors">
          
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Login
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Reset Password
        </h1>
        <p className="text-gray-600">
          {step === 1 && 'Enter your registered phone number to receive an OTP.'}
          {step === 2 && 'Enter the 6-digit code sent to your phone.'}
          {step === 3 && 'Create a new secure password.'}
          {step === 4 && 'Password reset successful!'}
        </p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>}

      {/* STEP 1: Phone Entry */}
      {step === 1 && <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input type="tel" value={phone} onChange={(e) => {
            setPhone(e.target.value);
            setError('');
          }} className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., +254700000000" required />
            
            </div>
          </div>
          <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          
            Send OTP
          </button>
        </form>}

      {/* STEP 2: OTP Verification */}
      {step === 2 && <form onSubmit={handleOtpSubmit} className="space-y-6">
          {/* Simulated SMS Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start mb-6">
            <InfoIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-900 font-medium">
                Simulated SMS Message
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Your MoTech verification code is:{' '}
                <strong className="text-lg tracking-wider">
                  {generatedOtp}
                </strong>
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <span className={`text-sm font-medium ${timeLeft < 60 ? 'text-red-600' : 'text-gray-500'}`}>
              
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input type="text" value={otp} onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
            setError('');
          }} className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest text-lg" placeholder="000000" required maxLength={6} />
            
            </div>
          </div>
          <button type="submit" disabled={timeLeft === 0} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
          
            Verify Code
          </button>
          <div className="text-center">
            <button type="button" onClick={() => {
          setStep(1);
          setOtp('');
        }} className="text-sm text-blue-600 hover:text-blue-800">
            
              Didn't receive the code? Try again
            </button>
          </div>
        </form>}

      {/* STEP 3: New Password */}
      {step === 3 && <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input type="password" value={newPassword} onChange={(e) => {
            setNewPassword(e.target.value);
            setError('');
          }} className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Minimum 6 characters" required minLength={6} />
            
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input type="password" value={confirmPassword} onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError('');
          }} className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Re-enter new password" required minLength={6} />
            
            </div>
          </div>
          <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          
            Reset Password
          </button>
        </form>}

      {/* STEP 4: Success */}
      {step === 4 && <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Password Updated!
          </h2>
          <p className="text-gray-600 mb-8">
            Your password has been successfully reset. You will be redirected to
            the login page shortly.
          </p>
          <button onClick={onBackToLogin} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          
            Return to Login Now
          </button>
        </div>}
    </div>;
}