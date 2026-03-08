import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { ForgotPasswordPage } from './ForgotPasswordPage';
interface LoginPageProps {
  onLogin: (userData: any) => void;
  onPasswordChange: (phone: string, newPassword: string) => void;
  userAccounts: Array<{
    email: string;
    password: string;
    name: string;
    role: string;
    phoneNumber?: string;
  }>;
}
export function LoginPage({
  onLogin,
  onPasswordChange,
  userAccounts
}: LoginPageProps) {
  const [view, setView] = useState<'login' | 'forgot-password'>('login');
  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-gray-50">
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        {view === 'login' ?
        <LoginForm
          onLogin={onLogin}
          onForgotPassword={() => setView('forgot-password')}
          userAccounts={userAccounts} /> :


        <ForgotPasswordPage
          userAccounts={userAccounts}
          onPasswordChange={onPasswordChange}
          onBackToLogin={() => setView('login')} />

        }
      </div>
      <div className="w-full md:w-1/2 bg-blue-50 flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">
            Smart Energy Monitoring System
          </h2>
          <p className="text-gray-600 mb-4">
            Track your energy usage in real-time, manage your billing, and make
            smarter energy decisions.
          </p>
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <div className="flex items-center mb-4">
              <div className="rounded-full overflow-hidden flex-shrink-0">
                <img
                  src="/image_639ac6c2.png"
                  alt="MoTech Electrical and Electronics Engineering Solutions"
                  className="h-14 w-14 object-cover rounded-full" />

              </div>
              <h3 className="ml-4 text-xl font-medium text-gray-900">
                Prepaid & Postpaid Energy Management
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Please sign in to access your smart meter controls, view usage
              statistics, and manage your prepaid or postpaid energy account.
            </p>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">
                  Features:
                </span>
              </div>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-green-500 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">

                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Prepaid meter token recharge
                </li>
                <li className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-green-500 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">

                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Postpaid billing management
                </li>
                <li className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-green-500 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">

                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Real-time usage monitoring
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>);

}