import { Meter, MeterReport } from './meterStorage';

// Types for AI Analysis
export interface ConsumptionTrend {
  date: string;
  actual: number;
  predicted?: number;
  lowerBound?: number;
  upperBound?: number;
}
export interface RevenueInsight {
  totalRevenue: number;
  averagePerCustomer: number;
  projectedRevenue: number;
  growthRate: number;
  topCustomers: {
    name: string;
    amount: number;
    type: string;
  }[];
}
export interface DiagnosticIssue {
  meterId: string;
  customerName: string;
  location: string;
  severity: 'critical' | 'warning' | 'info';
  issue: string;
  recommendation: string;
  steps: string[];
  timestamp: string;
}
export interface AIAnalysisResult {
  consumptionTrends: ConsumptionTrend[];
  revenueInsights: RevenueInsight;
  diagnostics: DiagnosticIssue[];
  lastUpdated: string;
}

// Helper to generate historical data based on current totals (Simulation)
const generateHistoricalData = (meters: Meter[], days: number): ConsumptionTrend[] => {
  const data: ConsumptionTrend[] = [];
  const today = new Date();

  // Calculate total current consumption
  const totalCurrentConsumption = meters.reduce((sum, m) => sum + parseFloat(m.consumption || '0'), 0);
  const avgDailyConsumption = totalCurrentConsumption / 30; // Assume current total is roughly monthly or accumulated

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Add some randomness and seasonality
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const seasonality = isWeekend ? 1.1 : 0.95; // Higher consumption on weekends
    const randomFactor = 0.8 + Math.random() * 0.4;
    const dailyValue = avgDailyConsumption / 30 * seasonality * randomFactor * (meters.length || 1) * 10; // Scaling for visibility

    data.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      actual: parseFloat(dailyValue.toFixed(2))
    });
  }
  return data;
};

// 1. Consumption Analysis & Prediction
export const analyzeConsumption = (meters: Meter[]): ConsumptionTrend[] => {
  // Generate 30 days of historical data
  const history = generateHistoricalData(meters, 30);

  // Calculate simple exponential smoothing for prediction (next 7 days)
  const alpha = 0.3; // Smoothing factor
  let lastSmoothed = history[history.length - 1].actual;
  const predictions: ConsumptionTrend[] = [];
  const lastDate = new Date();
  for (let i = 1; i <= 7; i++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);

    // Simple forecast
    const forecast = lastSmoothed; // In simple exponential smoothing, flat forecast

    // Add trend component (linear regression slope from last 7 days)
    const recentHistory = history.slice(-7);
    const slope = (recentHistory[recentHistory.length - 1].actual - recentHistory[0].actual) / 7;
    const predictedValue = forecast + slope * i;
    const uncertainty = predictedValue * 0.1 * i; // Increasing uncertainty

    predictions.push({
      date: nextDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      actual: 0,
      // No actual data for future
      predicted: parseFloat(predictedValue.toFixed(2)),
      lowerBound: parseFloat((predictedValue - uncertainty).toFixed(2)),
      upperBound: parseFloat((predictedValue + uncertainty).toFixed(2))
    });
  }
  return [...history, ...predictions];
};

// 2. Revenue Analysis
export const analyzeRevenue = (meters: Meter[], transactions: any[]): RevenueInsight => {
  // Calculate total revenue from transactions
  const totalRevenue = transactions.reduce((sum, t) => {
    return sum + parseFloat(t.amount.replace(/,/g, ''));
  }, 0);

  // Calculate average per customer
  const customerCount = meters.length || 1;
  const averagePerCustomer = totalRevenue / customerCount;

  // Identify top customers
  const customerSpending = new Map<string, number>();
  transactions.forEach(t => {
    const current = customerSpending.get(t.customerName) || 0;
    customerSpending.set(t.customerName, current + parseFloat(t.amount.replace(/,/g, '')));
  });
  const topCustomers = Array.from(customerSpending.entries()).map(([name, amount]) => ({
    name,
    amount,
    type: meters.find(m => m.customerName === name)?.type || 'unknown'
  })).sort((a, b) => b.amount - a.amount).slice(0, 5);

  // Simple projection (assume 5% growth next month)
  const projectedRevenue = totalRevenue * 1.05;
  return {
    totalRevenue,
    averagePerCustomer,
    projectedRevenue,
    growthRate: 5.2,
    // Mock growth rate
    topCustomers
  };
};

// 3. Meter Diagnostics & Troubleshooting
export const runDiagnostics = (meters: Meter[]): DiagnosticIssue[] => {
  const issues: DiagnosticIssue[] = [];
  meters.forEach(meter => {
    // Check if meter has a report
    if (!meter.lastReport) {
      // If no report and status is active, might be a comms issue
      if (meter.status === 'Active') {
        issues.push({
          meterId: meter.meterNo,
          customerName: meter.customerName,
          location: meter.location,
          severity: 'warning',
          issue: 'No Communication',
          recommendation: 'Check Communication Module',
          steps: ['Verify power supply to the meter', 'Check GSM/NB-IoT antenna connection', 'Verify SIM card status and balance', 'Restart the communication module'],
          timestamp: new Date().toISOString()
        });
      }
      return;
    }
    const report = meter.lastReport;

    // Check Voltage
    if (report.voltage < 200 || report.voltage > 250) {
      issues.push({
        meterId: meter.meterNo,
        customerName: meter.customerName,
        location: meter.location,
        severity: 'critical',
        issue: `Voltage Out of Range (${report.voltage.toFixed(1)}V)`,
        recommendation: 'Inspect Power Supply',
        steps: ['Measure input voltage at the terminals', 'Check for loose neutral connection', 'Verify transformer tap settings', 'Check for phase imbalance'],
        timestamp: report.timestamp
      });
    }

    // Check Signal Strength
    if (report.signalStrength === 'Poor') {
      issues.push({
        meterId: meter.meterNo,
        customerName: meter.customerName,
        location: meter.location,
        severity: 'warning',
        issue: 'Weak Signal Strength',
        recommendation: 'Improve Antenna Placement',
        steps: ['Check for obstructions near the antenna', 'Reposition antenna to a higher elevation', 'Inspect antenna cable for damage', 'Consider installing a high-gain external antenna'],
        timestamp: report.timestamp
      });
    }

    // Check Power Factor
    if (report.powerFactor < 0.85) {
      issues.push({
        meterId: meter.meterNo,
        customerName: meter.customerName,
        location: meter.location,
        severity: 'info',
        issue: `Low Power Factor (${report.powerFactor.toFixed(2)})`,
        recommendation: 'Check Inductive Loads',
        steps: ['Identify heavy inductive loads (motors, pumps)', 'Check capacitor bank status if available', 'Advise customer on load management'],
        timestamp: report.timestamp
      });
    }
  });
  return issues.sort((a, b) => {
    const severityWeight = {
      critical: 3,
      warning: 2,
      info: 1
    };
    return severityWeight[b.severity] - severityWeight[a.severity];
  });
};