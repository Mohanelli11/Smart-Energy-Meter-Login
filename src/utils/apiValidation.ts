/**
 * API Request Validation
 * Validates data before sending to API endpoints
 */

/**
 * Validate meter reading data
 */
export function validateMeterReading(reading: any): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!reading.timestamp) errors.push('timestamp is required');
  if (typeof reading.voltage !== 'number') errors.push('voltage must be a number');
  if (typeof reading.current !== 'number') errors.push('current must be a number');
  if (typeof reading.powerFactor !== 'number') errors.push('powerFactor must be a number');
  if (typeof reading.frequency !== 'number') errors.push('frequency must be a number');

  // Value ranges
  if (reading.voltage < 0 || reading.voltage > 500) {
    errors.push('voltage must be between 0 and 500V');
  }
  if (reading.current < 0 || reading.current > 1000) {
    errors.push('current must be between 0 and 1000A');
  }
  if (reading.powerFactor < 0 || reading.powerFactor > 1) {
    errors.push('powerFactor must be between 0 and 1');
  }
  if (reading.frequency < 45 || reading.frequency > 65) {
    errors.push('frequency must be between 45 and 65Hz');
  }

  // Optional fields validation
  if (reading.temperature !== undefined) {
    if (typeof reading.temperature !== 'number' || reading.temperature < -40 || reading.temperature > 125) {
      errors.push('temperature must be between -40 and 125°C');
    }
  }
  if (reading.signalStrength !== undefined) {
    if (typeof reading.signalStrength !== 'number' || reading.signalStrength < -120 || reading.signalStrength > 0) {
      errors.push('signalStrength must be between -120 and 0 dBm');
    }
  }
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate meter command
 */
export function validateMeterCommand(command: any): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];
  const validCommands = ['disconnect', 'reconnect', 'update_tariff', 'update_config', 'reboot'];
  if (!command.command) {
    errors.push('command is required');
  } else if (!validCommands.includes(command.command)) {
    errors.push(`command must be one of: ${validCommands.join(', ')}`);
  }

  // Validate command-specific params
  if (command.command === 'update_tariff') {
    if (!command.params || typeof command.params.rate !== 'number') {
      errors.push('update_tariff requires params.rate (number)');
    } else if (command.params.rate < 0 || command.params.rate > 1000) {
      errors.push('tariff rate must be between 0 and 1000');
    }
  }
  if (command.scheduledAt) {
    const scheduledDate = new Date(command.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      errors.push('scheduledAt must be a valid ISO 8601 date');
    }
  }
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}