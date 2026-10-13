/**
 * Input Validation & Sanitization Utilities
 * Following OWASP best practices for input validation
 */

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX =
/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Phone number validation (international format)
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

// Account number format (alphanumeric with hyphens)
const ACCOUNT_NUMBER_REGEX = /^[A-Z0-9-]{5,50}$/;

// Meter number format
const METER_NUMBER_REGEX = /^[A-Z0-9-]{5,50}$/;

// Alphanumeric with spaces and common punctuation
const SAFE_TEXT_REGEX = /^[a-zA-Z0-9\s.,'-]+$/;

// Numeric with decimals
const NUMERIC_REGEX = /^\d+(\.\d{1,2})?$/;

/**
 * Sanitize string input to prevent XSS attacks
 * Removes HTML tags and dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return input.
  trim().
  replace(/[<>]/g, '') // Remove angle brackets
  .replace(/javascript:/gi, '') // Remove javascript: protocol
  .replace(/on\w+\s*=/gi, '') // Remove event handlers
  .substring(0, 1000); // Limit length to prevent DoS
}

/**
 * Sanitize HTML content (for display purposes)
 * More aggressive than sanitizeString
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') return '';

  return input.
  replace(/&/g, '&amp;').
  replace(/</g, '&lt;').
  replace(/>/g, '&gt;').
  replace(/"/g, '&quot;').
  replace(/'/g, '&#x27;').
  replace(/\//g, '&#x2F;').
  substring(0, 5000);
}

/**
 * Validate email address
 */
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const sanitized = sanitizeString(email);

  if (sanitized.length < 5 || sanitized.length > 254) {
    return { valid: false, error: 'Email must be between 5 and 254 characters' };
  }

  if (!EMAIL_REGEX.test(sanitized)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' };
  }

  // Check for at least one uppercase, one lowercase, one number, one special char
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
    return {
      valid: false,
      error:
      'Password must contain uppercase, lowercase, number, and special character'
    };
  }

  return { valid: true };
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string): {
  valid: boolean;
  error?: string;
} {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  const sanitized = sanitizeString(phone).replace(/[\s()-]/g, '');

  if (sanitized.length < 10 || sanitized.length > 15) {
    return {
      valid: false,
      error: 'Phone number must be between 10 and 15 digits'
    };
  }

  if (!PHONE_REGEX.test(sanitized)) {
    return { valid: false, error: 'Invalid phone number format' };
  }

  return { valid: true };
}

/**
 * Validate account number
 */
export function validateAccountNumber(accountNo: string): {
  valid: boolean;
  error?: string;
} {
  if (!accountNo || typeof accountNo !== 'string') {
    return { valid: false, error: 'Account number is required' };
  }

  const sanitized = sanitizeString(accountNo).toUpperCase();

  if (sanitized.length < 5 || sanitized.length > 50) {
    return {
      valid: false,
      error: 'Account number must be between 5 and 50 characters'
    };
  }

  if (!ACCOUNT_NUMBER_REGEX.test(sanitized)) {
    return {
      valid: false,
      error: 'Account number can only contain letters, numbers, and hyphens'
    };
  }

  return { valid: true };
}

/**
 * Validate meter number
 */
export function validateMeterNumber(meterNo: string): {
  valid: boolean;
  error?: string;
} {
  if (!meterNo || typeof meterNo !== 'string') {
    return { valid: false, error: 'Meter number is required' };
  }

  const sanitized = sanitizeString(meterNo).toUpperCase();

  if (sanitized.length < 5 || sanitized.length > 50) {
    return {
      valid: false,
      error: 'Meter number must be between 5 and 50 characters'
    };
  }

  if (!METER_NUMBER_REGEX.test(sanitized)) {
    return {
      valid: false,
      error: 'Meter number can only contain letters, numbers, and hyphens'
    };
  }

  return { valid: true };
}

/**
 * Validate customer name
 */
export function validateCustomerName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Customer name is required' };
  }

  const sanitized = sanitizeString(name);

  if (sanitized.length < 2 || sanitized.length > 100) {
    return {
      valid: false,
      error: 'Customer name must be between 2 and 100 characters'
    };
  }

  if (!SAFE_TEXT_REGEX.test(sanitized)) {
    return { valid: false, error: 'Customer name contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Validate location
 */
export function validateLocation(location: string): {
  valid: boolean;
  error?: string;
} {
  if (!location || typeof location !== 'string') {
    return { valid: false, error: 'Location is required' };
  }

  const sanitized = sanitizeString(location);

  if (sanitized.length < 2 || sanitized.length > 200) {
    return {
      valid: false,
      error: 'Location must be between 2 and 200 characters'
    };
  }

  if (!SAFE_TEXT_REGEX.test(sanitized)) {
    return { valid: false, error: 'Location contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Validate numeric value (tariff rate, consumption, etc.)
 */
export function validateNumeric(
value: string,
min = 0,
max = 999999)
: {valid: boolean;error?: string;} {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: 'Value is required' };
  }

  if (!NUMERIC_REGEX.test(value)) {
    return { valid: false, error: 'Value must be a valid number' };
  }

  const num = parseFloat(value);

  if (isNaN(num)) {
    return { valid: false, error: 'Value must be a valid number' };
  }

  if (num < min || num > max) {
    return { valid: false, error: `Value must be between ${min} and ${max}` };
  }

  return { valid: true };
}

/**
 * Validate text area input (comments, etc.)
 */
export function validateTextArea(
text: string,
maxLength = 1000)
: {valid: boolean;error?: string;} {
  if (!text) {
    return { valid: true }; // Optional field
  }

  if (typeof text !== 'string') {
    return { valid: false, error: 'Invalid input type' };
  }

  const sanitized = sanitizeString(text);

  if (sanitized.length > maxLength) {
    return {
      valid: false,
      error: `Text must be less than ${maxLength} characters`
    };
  }

  return { valid: true };
}

/**
 * Validate AI chat message
 */
export function validateChatMessage(message: string): {
  valid: boolean;
  error?: string;
} {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }

  const sanitized = sanitizeString(message);

  if (sanitized.length < 1) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (sanitized.length > 500) {
    return { valid: false, error: 'Message must be less than 500 characters' };
  }

  return { valid: true };
}

/**
 * Validate select/dropdown value against allowed options
 */
export function validateSelectOption(
value: string,
allowedOptions: string[])
: {valid: boolean;error?: string;} {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: 'Selection is required' };
  }

  if (!allowedOptions.includes(value)) {
    return { valid: false, error: 'Invalid selection' };
  }

  return { valid: true };
}

/**
 * Comprehensive form validation for meter addition
 */
export interface MeterFormData {
  customerName: string;
  phoneNumber: string;
  location: string;
  transformer: string;
  customerType: string;
  meterType: string;
  accountNumber: string;
  meterNumber: string;
  tariffRate: string;
  comments: string;
}

export function validateMeterForm(data: MeterFormData): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Validate each field
  const nameValidation = validateCustomerName(data.customerName);
  if (!nameValidation.valid) errors.customerName = nameValidation.error!;

  const phoneValidation = validatePhoneNumber(data.phoneNumber);
  if (!phoneValidation.valid) errors.phoneNumber = phoneValidation.error!;

  const locationValidation = validateLocation(data.location);
  if (!locationValidation.valid) errors.location = locationValidation.error!;

  const transformerValidation = validateSelectOption(data.transformer, [
  'TR-001',
  'TR-002',
  'TR-003',
  'TR-004']
  );
  if (!transformerValidation.valid)
  errors.transformer = transformerValidation.error!;

  const customerTypeValidation = validateSelectOption(data.customerType, [
  'tier-zero',
  'existing']
  );
  if (!customerTypeValidation.valid)
  errors.customerType = customerTypeValidation.error!;

  const meterTypeValidation = validateSelectOption(data.meterType, [
  'prepaid-single',
  'prepaid-three',
  'postpaid-single',
  'postpaid-three']
  );
  if (!meterTypeValidation.valid) errors.meterType = meterTypeValidation.error!;

  const accountValidation = validateAccountNumber(data.accountNumber);
  if (!accountValidation.valid) errors.accountNumber = accountValidation.error!;

  const meterValidation = validateMeterNumber(data.meterNumber);
  if (!meterValidation.valid) errors.meterNumber = meterValidation.error!;

  const tariffValidation = validateNumeric(data.tariffRate, 0, 1000);
  if (!tariffValidation.valid) errors.tariffRate = tariffValidation.error!;

  const commentsValidation = validateTextArea(data.comments, 500);
  if (!commentsValidation.valid) errors.comments = commentsValidation.error!;

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}