import React, { useState } from 'react';
import { ZapIcon, LockIcon, LogInIcon } from 'lucide-react';
interface MeterLoginPageProps {
  onMeterLogin: (accountNo: string, password: string) => void;
  onBackToAdmin: () => void;
}
export function MeterLoginPage({
  onMeterLogin,
  onBackToAdmin
}: MeterLoginPageProps) {
  const [accountNo, setAccountNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== '@Testing') {
      setError('Incorrect password. The password for all meters is @Testing');
      return;
    }
    onMeterLogin(accountNo, password);
  };
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <ZapIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Meter Login</h1>
            <p className="text-gray-600 mt-2">
              Access your individual meter dashboard
            </p>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input type="text" value={accountNo} onChange={(e) => {
              setAccountNo(e.target.value);
              setError('');
            }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., MET-1234-2023" required />
              
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input type="password" value={password} onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter password" required />
                
              </div>
            </div>

            <button type="submit" className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              
              <LogInIcon className="h-5 w-5 mr-2" />
              Access Meter Dashboard
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={onBackToAdmin} className="text-sm text-blue-600 hover:text-blue-700">
              
              ← Back to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>;
}