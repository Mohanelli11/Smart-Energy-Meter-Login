import React, { useState } from 'react';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon } from
'lucide-react';
import {
  validateCustomerName,
  validatePhoneNumber,
  validateLocation,
  validateSelectOption,
  validateAccountNumber,
  validateMeterNumber,
  validateNumeric,
  validateTextArea,
  validateEmail,
  sanitizeString } from
'../utils/validation';
import { checkFormRateLimit } from '../utils/rateLimiter';
import { logSecurityEvent } from '../utils/security';
interface AddMeterFormProps {
  onMeterAdded: (meter: any) => void;
}
export function AddMeterForm({ onMeterAdded }: AddMeterFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerName: '',
    location: '',
    phoneNumber: '',
    idNumber: '',
    accountNumber: '',
    customerType: '',
    email: '',
    transformer: '',
    tariffRate: '',
    meterType: '',
    meterNumber: '',
    comments: '',
    authorized: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitError, setRateLimitError] = useState('');
  const handleChange = (
  e: React.ChangeEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>

  {
    const { id, value, type } = e.target;
    const val =
    type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({
      ...formData,
      [id]: val
    });
    if (errors[id]) {
      setErrors({
        ...errors,
        [id]: ''
      });
    }
  };
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const nameVal = validateCustomerName(formData.customerName);
    if (!nameVal.valid) newErrors.customerName = nameVal.error!;
    const locVal = validateLocation(formData.location);
    if (!locVal.valid) newErrors.location = locVal.error!;
    const phoneVal = validatePhoneNumber(formData.phoneNumber);
    if (!phoneVal.valid) newErrors.phoneNumber = phoneVal.error!;
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID number is required';
    } else if (!/^[A-Z0-9-]{5,20}$/i.test(formData.idNumber)) {
      newErrors.idNumber = 'Invalid ID number format';
    }
    const accVal = validateAccountNumber(formData.accountNumber);
    if (!accVal.valid) newErrors.accountNumber = accVal.error!;
    const typeVal = validateSelectOption(formData.customerType, [
    'tier-zero',
    'existing']
    );
    if (!typeVal.valid) newErrors.customerType = typeVal.error!;
    const emailVal = validateEmail(formData.email);
    if (!emailVal.valid) newErrors.email = emailVal.error!;
    const transVal = validateSelectOption(formData.transformer, [
    'TR-001',
    'TR-002',
    'TR-003',
    'TR-004']
    );
    if (!transVal.valid) newErrors.transformer = transVal.error!;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    const tariffVal = validateNumeric(formData.tariffRate, 0, 1000);
    if (!tariffVal.valid) newErrors.tariffRate = tariffVal.error!;
    const meterTypeVal = validateSelectOption(formData.meterType, [
    'prepaid-single',
    'prepaid-three',
    'postpaid-single',
    'postpaid-three']
    );
    if (!meterTypeVal.valid) newErrors.meterType = meterTypeVal.error!;
    const meterNumVal = validateMeterNumber(formData.meterNumber);
    if (!meterNumVal.valid) newErrors.meterNumber = meterNumVal.error!;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.authorized) {
      newErrors.authorized = 'You must authorize the meter addition';
    }
    const commentsVal = validateTextArea(formData.comments, 500);
    if (!commentsVal.valid) newErrors.comments = commentsVal.error!;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3 || !validateStep3()) return;
    setRateLimitError('');
    setIsSubmitting(true);
    const userId = 'current-user';
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
    const sanitizedData = {
      customerName: sanitizeString(formData.customerName),
      phoneNumber: sanitizeString(formData.phoneNumber),
      location: sanitizeString(formData.location),
      idNumber: sanitizeString(formData.idNumber),
      transformer: sanitizeString(formData.transformer),
      customerType: sanitizeString(formData.customerType),
      email: sanitizeString(formData.email),
      meterType: sanitizeString(formData.meterType),
      accountNumber: sanitizeString(formData.accountNumber).toUpperCase(),
      meterNumber: sanitizeString(formData.meterNumber).toUpperCase(),
      tariffRate: sanitizeString(formData.tariffRate),
      comments: sanitizeString(formData.comments)
    };
    const isPrepaid = sanitizedData.meterType.includes('prepaid');
    const newMeter = {
      accountNo: sanitizedData.accountNumber,
      customerName: sanitizedData.customerName,
      meterNo: sanitizedData.meterNumber,
      location: sanitizedData.location,
      consumption: '0.00',
      balance: isPrepaid ? '0.00' : '0.00',
      status: 'Active' as const,
      type: isPrepaid ? 'prepaid' : 'postpaid',
      phoneNumber: sanitizedData.phoneNumber,
      idNumber: sanitizedData.idNumber,
      email: sanitizedData.email,
      transformer: sanitizedData.transformer,
      customerType: sanitizedData.customerType,
      tariffRate: sanitizedData.tariffRate,
      comments: sanitizedData.comments
    };
    onMeterAdded(newMeter);
    logSecurityEvent('METER_ADDED', {
      accountNo: sanitizedData.accountNumber,
      meterType: sanitizedData.meterType
    });
    alert(`Meter added successfully for ${sanitizedData.customerName}!`);
    setFormData({
      customerName: '',
      location: '',
      phoneNumber: '',
      idNumber: '',
      accountNumber: '',
      customerType: '',
      email: '',
      transformer: '',
      tariffRate: '',
      meterType: '',
      meterNumber: '',
      comments: '',
      authorized: false
    });
    setStep(1);
    setIsSubmitting(false);
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
    <div className="bg-white p-6 rounded-lg shadow max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add New Meter</h2>
        <p className="text-gray-500">
          Complete the 3-step verification process to add a new meter to the
          system.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
          <div
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 z-0 transition-all duration-300"
            style={{
              width: `${(step - 1) / 2 * 100}%`
            }}>
          </div>

          {[1, 2, 3].map((num) =>
          <div key={num} className="relative z-10 flex flex-col items-center">
              <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors duration-300 ${step >= num ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
              
                {step > num ? <CheckCircleIcon className="h-6 w-6" /> : num}
              </div>
              <span
              className={`mt-2 text-sm font-medium ${step >= num ? 'text-blue-600' : 'text-gray-400'}`}>
              
                {num === 1 ?
              'Customer Details' :
              num === 2 ?
              'Device Attachment' :
              'Authorization'}
              </span>
            </div>
          )}
        </div>
      </div>

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
        {/* Step 1: Customer Details */}
        {step === 1 &&
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-semibold border-b pb-2">
              Step 1: Customer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                className="block text-gray-700 mb-2"
                htmlFor="customerName">
                
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                type="text"
                id="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.customerName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="John Doe" />
              
                {renderFieldError('customerName')}
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
                placeholder="Nairobi West" />
              
                {renderFieldError('location')}
              </div>
              <div>
                <label
                className="block text-gray-700 mb-2"
                htmlFor="phoneNumber">
                
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                type="tel"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="+254712345678" />
              
                {renderFieldError('phoneNumber')}
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="idNumber">
                  ID Number <span className="text-red-500">*</span>
                </label>
                <input
                type="text"
                id="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.idNumber ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="12345678" />
              
                {renderFieldError('idNumber')}
              </div>
              <div>
                <label
                className="block text-gray-700 mb-2"
                htmlFor="accountNumber">
                
                  House No. / Account No.{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                type="text"
                id="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.accountNumber ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="MET-1234-2023" />
              
                {renderFieldError('accountNumber')}
              </div>
              <div>
                <label
                className="block text-gray-700 mb-2"
                htmlFor="customerType">
                
                  Type of Customer <span className="text-red-500">*</span>
                </label>
                <select
                id="customerType"
                value={formData.customerType}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.customerType ? 'border-red-500' : 'border-gray-300'}`}>
                
                  <option value="">Select Type</option>
                  <option value="tier-zero">Tier Zero (New Connection)</option>
                  <option value="existing">Existing Power</option>
                </select>
                {renderFieldError('customerType')}
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  Customer Email <span className="text-red-500">*</span>
                </label>
                <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="customer@example.com" />
              
                {renderFieldError('email')}
              </div>
              <div>
                <label
                className="block text-gray-700 mb-2"
                htmlFor="transformer">
                
                  Transformer Serving Meter{' '}
                  <span className="text-red-500">*</span>
                </label>
                <select
                id="transformer"
                value={formData.transformer}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.transformer ? 'border-red-500' : 'border-gray-300'}`}>
                
                  <option value="">Select Transformer</option>
                  <option value="TR-001">TR-001 (Nairobi West)</option>
                  <option value="TR-002">TR-002 (Kasarani)</option>
                  <option value="TR-003">TR-003 (Ruiru)</option>
                  <option value="TR-004">TR-004 (Thika)</option>
                </select>
                {renderFieldError('transformer')}
              </div>
            </div>
          </div>
        }

        {/* Step 2: Device Attachment */}
        {step === 2 &&
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-semibold border-b pb-2">
              Step 2: Device Attachment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                type="text"
                value={formData.customerName}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
              
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Account No.</label>
                <input
                type="text"
                value={formData.accountNumber}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
              
              </div>
              <div>
                <label
                className="block text-gray-700 mb-2"
                htmlFor="tariffRate">
                
                  Tariff to be Allocated (Ksh/kWh){' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                type="number"
                step="0.01"
                id="tariffRate"
                value={formData.tariffRate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tariffRate ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="15.50" />
              
                {renderFieldError('tariffRate')}
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="meterType">
                  Meter Type <span className="text-red-500">*</span>
                </label>
                <select
                id="meterType"
                value={formData.meterType}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.meterType ? 'border-red-500' : 'border-gray-300'}`}>
                
                  <option value="">Select Meter Type</option>
                  <option value="prepaid-single">Prepaid - Single Phase</option>
                  <option value="prepaid-three">Prepaid - Three Phase</option>
                  <option value="postpaid-single">
                    Postpaid - Single Phase
                  </option>
                  <option value="postpaid-three">Postpaid - Three Phase</option>
                </select>
                {renderFieldError('meterType')}
              </div>
              <div className="md:col-span-2">
                <label
                className="block text-gray-700 mb-2"
                htmlFor="meterNumber">
                
                  Meter Serial Number <span className="text-red-500">*</span>
                </label>
                <input
                type="text"
                id="meterNumber"
                value={formData.meterNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.meterNumber ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="ESP-1234-001" />
              
                {renderFieldError('meterNumber')}
              </div>
            </div>
          </div>
        }

        {/* Step 3: Authorization */}
        {step === 3 &&
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-semibold border-b pb-2">
              Step 3: Authorization
            </h3>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">
                Summary of Meter Addition
              </h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>
                  <strong>Customer:</strong> {formData.customerName} (
                  {formData.idNumber})
                </li>
                <li>
                  <strong>Account:</strong> {formData.accountNumber}
                </li>
                <li>
                  <strong>Meter Serial:</strong> {formData.meterNumber} (
                  {formData.meterType})
                </li>
                <li>
                  <strong>Location:</strong> {formData.location} (Transformer:{' '}
                  {formData.transformer})
                </li>
              </ul>
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="comments">
                Authorization Comments
              </label>
              <textarea
              id="comments"
              rows={4}
              value={formData.comments}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.comments ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter any authorization notes or comments here...">
            </textarea>
              {renderFieldError('comments')}
            </div>

            <div className="flex items-start mt-4">
              <div className="flex items-center h-5">
                <input
                id="authorized"
                type="checkbox"
                checked={formData.authorized}
                onChange={handleChange}
                className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${errors.authorized ? 'border-red-500' : ''}`} />
              
              </div>
              <div className="ml-3 text-sm">
                <label
                htmlFor="authorized"
                className="font-medium text-gray-700">
                
                  I authorize this meter to be added to the system
                </label>
                <p className="text-gray-500">
                  By checking this box, you confirm that all details have been
                  verified.
                </p>
                {renderFieldError('authorized')}
              </div>
            </div>
          </div>
        }

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-500 flex items-center">
            <span className="mr-1">🔒</span> Secure 2FA verification process
          </div>

          <div className="flex space-x-4">
            {step > 1 &&
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center">
              
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Back
              </button>
            }

            {step < 3 ?
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
              
                Next Step
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button> :

            <button
              type="submit"
              disabled={isSubmitting || !formData.authorized}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center">
              
                {isSubmitting ?
              <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </> :

              <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Complete & Add Meter
                  </>
              }
              </button>
            }
          </div>
        </div>
      </form>
    </div>);

}