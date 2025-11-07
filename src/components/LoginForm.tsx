import React, { useState } from 'react';
import { UserIcon, LockIcon, LogInIcon } from 'lucide-react';
interface LoginFormProps {
  onLogin: (userData: any) => void;
  userAccounts: Array<{
    email: string;
    password: string;
    name: string;
    role: string;
  }>;
}
export function LoginForm({
  onLogin,
  userAccounts
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Find user account
    const account = userAccounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());
    // Check if email exists
    if (!account) {
      setError('Access denied. This email is not authorized to access the system.');
      return;
    }
    // Check if password is correct
    if (account.password !== password) {
      setError('Incorrect password. Please try again.');
      return;
    }
    // Successful login
    onLogin({
      email: account.email,
      password: account.password,
      name: account.name,
      accountType: Math.random() > 0.5 ? 'prepaid' : 'postpaid'
    });
  };
  return <div className="max-w-md w-full">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
        <p className="text-gray-600 mt-2">
          Sign in to your energy monitoring account
        </p>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UserIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input type="email" value={email} onChange={e => {
          setEmail(e.target.value);
          setError('');
        }} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Email Address" required />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LockIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input type="password" value={password} onChange={e => {
          setPassword(e.target.value);
          setError('');
        }} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Password" required />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </a>
          </div>
        </div>
        <div>
          <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LogInIcon className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
            </span>
            Sign in
          </button>
        </div>
      </form>
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Need an account?
            </span>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-center text-sm text-gray-600">
            Contact your administrator to create an account
          </p>
        </div>
      </div>
    </div>;
}