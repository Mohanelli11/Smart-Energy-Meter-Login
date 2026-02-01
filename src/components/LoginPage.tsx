import React from 'react';
import { LoginForm } from './LoginForm';
interface LoginPageProps {
  onLogin: (userData: any) => void;
  userAccounts: Array<{
    email: string;
    password: string;
    name: string;
    role: string;
  }>;
}
export function LoginPage({ onLogin, userAccounts }: LoginPageProps) {
  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-gray-50">
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <LoginForm onLogin={onLogin} userAccounts={userAccounts} />
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
              <div className="bg-blue-100 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">

                  <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"></path>
                  <path d="m6 17 3.93-4.73c.3-.36.25-.92-.08-1.23L6.4 8.2a2 2 0 0 1-.69-2.65L7 3"></path>
                  <path d="M9 19h6"></path>
                  <path d="m15 8.7 1.75-2.8A1 1 0 0 0 16 4.5h-1.06a1 1 0 0 0-.93.65L13 7"></path>
                  <path d="M16 19h3c.6 0 1-.4 1-1v-1a3 3 0 0 0-3-3h-1"></path>
                </svg>
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