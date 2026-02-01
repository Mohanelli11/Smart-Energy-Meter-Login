import React, { useState } from 'react';
import { AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import {
  validateMeterForm,
  MeterFormData,
  sanitizeString } from
'../utils/validation';
import { checkFormRateLimit } from '../utils/rateLimiter';
import { logSecurityEvent } from '../utils/security';
interface AddMeterFormProps {
  onMeterAdded: (meter: any) => void;
}
export function AddMeterForm({ onMeterAdded }: AddMeterFormProps) {
  const [formData, setFormData] = useState<MeterFormData>({
    customerName: '',
    phoneNumber: '',
    location: '',
    transformer: '',
    customerType: '',
    meterType: '',
    accountNumber: '',
    meterNumber: '',
    tariffRate: '',
    comments: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitError, setRateLimitError] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setRateLimitError('');
    setIsSubmitting(true);
    // Check rate limiting
    const userId = 'current-user'; // In production, use actual user ID
    const rateLimit = checkFormRateLimit('add-meter', userId);
    if (!rateLimit.allowed) {
      setRateLimitError(rateLimit.error!);
      setIsSubmitting(false);
      logSecurityEvent('FORM_RATE_LIMITED', {
        formType: 'add-meter',
        userId,
        resetIn: rateLimit.resetIn
      });
      return;
    }
    // Validate all fields
    const validation = validateMeterForm(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      logSecurityEvent('FORM_VALIDATION_FAILED', {
        formType: 'add-meter',
        errors: Object.keys(validation.errors)
      });
      return;
    }
    // Sanitize all inputs
    const sanitizedData = {
      customerName: sanitizeString(formData.customerName),
      phoneNumber: sanitizeString(formData.phoneNumber),
      location: sanitizeString(formData.location),
      transformer: sanitizeString(formData.transformer),
      customerType: sanitizeString(formData.customerType),
      meterType: sanitizeString(formData.meterType),
      accountNumber: sanitizeString(formData.accountNumber).toUpperCase(),
      meterNumber: sanitizeString(formData.meterNumber).toUpperCase(),
      tariffRate: sanitizeString(formData.tariffRate),
      comments: sanitizeString(formData.comments)
    };
    // Determine if prepaid or postpaid based on meterType
    const isPrepaid = sanitizedData.meterType.includes('prepaid');
    // Create meter object
    const newMeter = {
      accountNo: sanitizedData.accountNumber,
      customerName: sanitizedData.customerName,
      meterNo: sanitizedData.meterNumber,
      location: sanitizedData.location,
      consumption: '0.00',
      balance: isPrepaid ? '0.00' : '0.00',
      status: isPrepaid ? 'Active' as const : 'Active' as const,
      type: isPrepaid ? 'prepaid' : 'postpaid',
      phoneNumber: sanitizedData.phoneNumber,
      transformer: sanitizedData.transformer,
      customerType: sanitizedData.customerType,
      tariffRate: sanitizedData.tariffRate,
      comments: sanitizedData.comments
    };
    // Call the callback to add meter
    onMeterAdded(newMeter);
    logSecurityEvent('METER_ADDED', {
      accountNo: sanitizedData.accountNumber,
      meterType: sanitizedData.meterType
    });
    alert(
      `Meter for ${sanitizedData.customerName} (${sanitizedData.meterType}) with account number ${sanitizedData.accountNumber} has been added successfully!`
    );
    // Reset form
    setFormData({
      customerName: '',
      phoneNumber: '',
      location: '',
      transformer: '',
      customerType: '',
      meterType: '',
      accountNumber: '',
      meterNumber: '',
      tariffRate: '',
      comments: ''
    });
    setIsSubmitting(false);
  };
  const handleChange = (
  e: React.ChangeEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>

  {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value
    });
    // Clear error for this field
    if (errors[id]) {
      setErrors({
        ...errors,
        [id]: ''
      });
    }
  };
  const renderFieldError = (fieldName: string) => {
    if (!errors[fieldName]) return null;
    return (
      <p className="mt-1 text-sm text-red-600 flex items-center">
        <AlertTriangleIcon className="h-4 w-4 mr-1" />
        {errors[fieldName]}
      </p>);

  };
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-6">Add New Meter</h2>

      {/* Rate Limit Error */}
      {rateLimitError &&
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Submission Limit Reached
              </p>
              <p className="text-sm text-red-700 mt-1">{rateLimitError}</p>
            </div>
          </div>
        </div>
      }

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="customerName">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="customerName"
              value={formData.customerName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.customerName ? 'border-red-500' : 'border-gray-300'}`}
              required
              maxLength={100}
              disabled={isSubmitting} />

            {renderFieldError('customerName')}
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="phoneNumber">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
              required
              maxLength={15}
              disabled={isSubmitting}
              placeholder="+254712345678" />

            {renderFieldError('phoneNumber')}
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="location">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
              required
              maxLength={200}
              disabled={isSubmitting} />

            {renderFieldError('location')}
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="transformer">
              Transformer <span className="text-red-500">*</span>
            </label>
            <select
              id="transformer"
              value={formData.transformer}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.transformer ? 'border-red-500' : 'border-gray-300'}`}
              required
              disabled={isSubmitting}>

              <option value="">Select Transformer</option>
              <option value="TR-001">TR-001 (Nairobi West)</option>
              <option value="TR-002">TR-002 (Kasarani)</option>
              <option value="TR-003">TR-003 (Ruiru)</option>
              <option value="TR-004">TR-004 (Thika)</option>
            </select>
            {renderFieldError('transformer')}
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="customerType">
              Customer Type <span className="text-red-500">*</span>
            </label>
            <select
              id="customerType"
              value={formData.customerType}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.customerType ? 'border-red-500' : 'border-gray-300'}`}
              required
              disabled={isSubmitting}>

              <option value="">Select Type</option>
              <option value="tier-zero">Tier Zero (New Connection)</option>
              <option value="existing">Existing Power</option>
            </select>
            {renderFieldError('customerType')}
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="meterType">
              Meter Type <span className="text-red-500">*</span>
            </label>
            <select
              id="meterType"
              value={formData.meterType}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.meterType ? 'border-red-500' : 'border-gray-300'}`}
              required
              disabled={isSubmitting}>

              <option value="">Select Meter Type</option>
              <option value="prepaid-single">Prepaid - Single Phase</option>
              <option value="prepaid-three">Prepaid - Three Phase</option>
              <option value="postpaid-single">Postpaid - Single Phase</option>
              <option value="postpaid-three">Postpaid - Three Phase</option>
            </select>
            {renderFieldError('meterType')}
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="accountNumber">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.accountNumber ? 'border-red-500' : 'border-gray-300'}`}
              required
              maxLength={50}
              disabled={isSubmitting}
              placeholder="MET-1234-2023" />

            {renderFieldError('accountNumber')}
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="meterNumber">
              Meter Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="meterNumber"
              value={formData.meterNumber}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.meterNumber ? 'border-red-500' : 'border-gray-300'}`}
              required
              maxLength={50}
              disabled={isSubmitting}
              placeholder="ESP-1234-001" />

            {renderFieldError('meterNumber')}
          </div>
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="tariffRate">
              Tariff Rate (Ksh/kWh) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              id="tariffRate"
              value={formData.tariffRate}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tariffRate ? 'border-red-500' : 'border-gray-300'}`}
              required
              min="0"
              max="1000"
              disabled={isSubmitting}
              placeholder="15.50" />

            {renderFieldError('tariffRate')}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="comments">
            Comments
          </label>
          <textarea
            id="comments"
            rows={3}
            value={formData.comments}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.comments ? 'border-red-500' : 'border-gray-300'}`}
            maxLength={500}
            disabled={isSubmitting}
            placeholder="Optional notes about this meter...">
          </textarea>
          {renderFieldError('comments')}
        </div>

        {/* Security Notice */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            🔒 All inputs are validated and sanitized for security. Submissions
            are rate-limited to prevent abuse.
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                customerName: '',
                phoneNumber: '',
                location: '',
                transformer: '',
                customerType: '',
                meterType: '',
                accountNumber: '',
                meterNumber: '',
                tariffRate: '',
                comments: ''
              });
              setErrors({});
            }}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">

            Clear
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center">

            {isSubmitting ?
            <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </> :

            <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Add Meter
              </>
            }
          </button>
        </div>
      </form>
    </div>);

}