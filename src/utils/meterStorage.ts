// Meter storage utilities for localStorage persistence

import { resolveCoordinatesSync } from './geocoding';

export interface MeterReport {
  timestamp: string;
  voltage: number;
  current: number;
  powerFactor: number;
  frequency: number;
  consumption: number;
  signalStrength: string;
  status: 'online' | 'offline';
}

export interface Meter {
  accountNo: string;
  customerName: string;
  meterNo: string;
  location: string;
  consumption: string;
  balance: string;
  status: 'Active' | 'Low Balance' | 'Disconnected' | 'Pending Bill' | 'Overdue';
  type?: 'prepaid' | 'postpaid';
  phoneNumber?: string;
  transformer?: string;
  customerType?: string;
  tariffRate?: string;
  comments?: string;
  lastReport?: MeterReport;
  /** Geographic coordinates for map display */
  latitude?: number;
  longitude?: number;
  /** Human-readable resolved address from the geocoder */
  geoAddress?: string;
}

const PREPAID_STORAGE_KEY = 'motech_prepaid_meters';
const POSTPAID_STORAGE_KEY = 'motech_postpaid_meters';

// Generate a realistic GSM meter report
export function generateMeterReport(): MeterReport {
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    voltage: 220 + Math.random() * 20,
    current: 5 + Math.random() * 15,
    powerFactor: 0.85 + Math.random() * 0.15,
    frequency: 49.8 + Math.random() * 0.4,
    consumption: 10 + Math.random() * 15,
    signalStrength: ['Excellent', 'Good', 'Fair', 'Poor'][
    Math.floor(Math.random() * 4)],

    status: Math.random() > 0.1 ? 'online' : 'offline'
  };
}

// Save prepaid meters to localStorage
export function savePrepaidMeters(meters: Meter[]): void {
  try {
    localStorage.setItem(PREPAID_STORAGE_KEY, JSON.stringify(meters));
  } catch (error) {
    console.error('Failed to save prepaid meters:', error);
  }
}

// Load prepaid meters from localStorage
export function loadPrepaidMeters(): Meter[] | null {
  try {
    const data = localStorage.getItem(PREPAID_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load prepaid meters:', error);
    return null;
  }
}

// Save postpaid meters to localStorage
export function savePostpaidMeters(meters: Meter[]): void {
  try {
    localStorage.setItem(POSTPAID_STORAGE_KEY, JSON.stringify(meters));
  } catch (error) {
    console.error('Failed to save postpaid meters:', error);
  }
}

// Load postpaid meters from localStorage
export function loadPostpaidMeters(): Meter[] | null {
  try {
    const data = localStorage.getItem(POSTPAID_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load postpaid meters:', error);
    return null;
  }
}

// Get all meters (prepaid + postpaid)
export function getAllMeters(): Meter[] {
  const prepaid = loadPrepaidMeters() || [];
  const postpaid = loadPostpaidMeters() || [];
  return [...prepaid, ...postpaid];
}

// Clear all meter data (for testing/reset)
export function clearAllMeters(): void {
  localStorage.removeItem(PREPAID_STORAGE_KEY);
  localStorage.removeItem(POSTPAID_STORAGE_KEY);
}

/**
 * Backfill latitude/longitude on any meter that doesn't yet have coordinates.
 * Existing coordinates are preserved. Returns a new array.
 */
export function withCoordinates(meters: Meter[]): Meter[] {
  return meters.map((meter) => {
    if (
    typeof meter.latitude === 'number' &&
    typeof meter.longitude === 'number')
    {
      return meter;
    }
    const coords = resolveCoordinatesSync(
      meter.location,
      meter.meterNo || meter.accountNo
    );
    return {
      ...meter,
      latitude: coords.latitude,
      longitude: coords.longitude
    };
  });
}