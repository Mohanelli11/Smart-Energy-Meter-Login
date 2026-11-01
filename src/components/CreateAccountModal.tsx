import React, { useState } from 'react';
import { XIcon, UserPlusIcon, AlertCircleIcon } from 'lucide-react';
import { ASSIGNABLE_ROLES, Role, type NewAccountInput } from '../features/authentication/types';
import { checkPasswordPolicy, isValidPhone, normalizePhone, PASSWORD_HINT, PHONE_HINT } from '../utils/passwordPolicy';
interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: (account: NewAccountInput) => Promise<{ ok: true } | { ok: false; error: string }>;
  isAdmin: boolean;
}
export function CreateAccountModal({
  isOpen,
  onClose,
  onCreateAccount,
  isAdmin
}: CreateAccountModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: Role.ENGINEER as string
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (!isOpen) return null;
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-full mr-3">
                <AlertCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Access Denied</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700">
              
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-6">
            <p className="text-gray-700">
              Only administrators can create new accounts. Please contact the
              system administrator.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              
              Close
            </button>
          </div>
        </div>
      </div>);

  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    // Quick feedback only: the server re-validates everything.
    if (!formData.name.trim() || !formData.email || !formData.phoneNumber || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!isValidPhone(formData.phoneNumber)) {
      setError(`Enter the phone number in international format. ${PHONE_HINT}`);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const policy = checkPasswordPolicy(formData.password);
    if (!policy.ok) {
      setError(policy.error!);
      return;
    }
    setSubmitting(true);
    const result = await onCreateAccount({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      name: formData.name.trim(),
      role: formData.role as Role,
      phoneNumber: normalizePhone(formData.phoneNumber)
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Reset form
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      role: Role.ENGINEER
    });
    onClose();
  };
  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
  {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
    setError('');
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <UserPlusIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Create New Account
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {error &&
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        }

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="name">
                
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
                required />
              
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="email">
                
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
                required />
              
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="phoneNumber">
                
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+254700000000"
                required />
              
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="password">
                
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Choose a strong password"
                autoComplete="new-password"
                maxLength={128}
                required />
              <p className="mt-1 text-xs text-gray-500">{PASSWORD_HINT}</p>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="confirmPassword">
                
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Re-enter password"
                autoComplete="new-password"
                maxLength={128}
                required />
              
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="role">
                
                Account Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                
                {ASSIGNABLE_ROLES.map((r) =>
                <option key={r.value} value={r.value}>{r.label}</option>
                )}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
              
              {submitting ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>);

}