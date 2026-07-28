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
  transactions.forEach((t) => {
    const current = customerSpending.get(t.customerName) || 0;
    customerSpending.set(t.customerName, current + parseFloat(t.amount.replace(/,/g, '')));
  });
  const topCustomers = Array.from(customerSpending.entries()).map(([name, amount]) => ({
    name,
    amount,
    type: meters.find((m) => m.customerName === name)?.type || 'unknown'
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
  meters.forEach((meter) => {
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

// 3b. Per-Meter Analytics — look up a single meter by account no, meter no, or customer name
export const analyzeMeterByQuery = (query: string, meters: Meter[], transactions: any[]): string | null => {
  const lowerQuery = query.toLowerCase();

  // Try to match an explicit account number (MET-XXXX-YYYY) or meter number (ESP-XXXX-001)
  const accountMatch = query.match(/MET-\d+-\d+/i);
  const meterMatch = query.match(/ESP-\d+-\d+/i);
  let target: Meter | undefined;
  if (accountMatch) {
    target = meters.find((m) => m.accountNo.toLowerCase() === accountMatch[0].toLowerCase());
  }
  if (!target && meterMatch) {
    target = meters.find((m) => m.meterNo.toLowerCase() === meterMatch[0].toLowerCase());
  }
  // Try to match a customer name mentioned in the query
  if (!target) {
    target = meters.find((m) => m.customerName && lowerQuery.includes(m.customerName.toLowerCase()) && m.customerName.length > 3);
  }
  if (!target) return null;

  // Gather transactions for this meter
  const meterTxns = transactions.filter((t) => t.accountNo === target!.accountNo);
  const totalPaid = meterTxns.reduce((sum, t) => sum + parseFloat(String(t.amount).replace(/,/g, '')), 0);
  const report = target.lastReport;
  const thd = report ? (2 + Math.random() * 4).toFixed(2) // Simulated Total Harmonic Distortion %
  : null;
  const lines: string[] = [];
  lines.push(`📊 Analytics for ${target.customerName}`);
  lines.push(`Account No: ${target.accountNo}`);
  lines.push(`Meter No: ${target.meterNo}`);
  lines.push(`Location: ${target.location}`);
  lines.push(`Type: ${target.type ? target.type.toUpperCase() : 'N/A'}`);
  lines.push(`Status: ${target.status}`);
  lines.push(`Consumption: ${parseFloat(target.consumption || '0').toFixed(2)} kWh`);
  lines.push(target.type === 'postpaid' ? `Outstanding Bill: Ksh ${parseFloat(target.balance || '0').toLocaleString()}` : `Balance: Ksh ${parseFloat(target.balance || '0').toLocaleString()}`);
  if (target.tariffRate) lines.push(`Tariff: ${target.tariffRate}`);
  lines.push(`Total Payments (recorded): Ksh ${totalPaid.toLocaleString()} across ${meterTxns.length} transaction(s)`);
  lines.push('');
  lines.push('⚡ Live Telemetry:');
  if (report) {
    lines.push(`• Voltage: ${report.voltage.toFixed(1)} V`);
    lines.push(`• Current: ${report.current.toFixed(2)} A`);
    lines.push(`• Power Factor: ${report.powerFactor.toFixed(2)}`);
    lines.push(`• Frequency: ${report.frequency.toFixed(2)} Hz`);
    lines.push(`• Harmonics (THD): ${thd}%`);
    lines.push(`• Signal Strength: ${report.signalStrength}`);
    lines.push(`• Reporting Status: ${report.status}`);
    lines.push(`• Last Report: ${new Date(report.timestamp).toLocaleString()}`);
  } else {
    lines.push('• No recent telemetry — meter is not reporting (offline).');
  }

  // Health assessment
  lines.push('');
  if (report) {
    const issues: string[] = [];
    if (report.voltage < 200 || report.voltage > 250) issues.push('voltage out of range');
    if (report.powerFactor < 0.85) issues.push('low power factor');
    if (report.signalStrength === 'Poor') issues.push('weak signal');
    lines.push(issues.length > 0 ? `🔎 Health: Attention needed — ${issues.join(', ')}.` : '✅ Health: Operating within normal parameters.');
  } else {
    lines.push('🔎 Health: Cannot assess — no telemetry available.');
  }
  return lines.join('\n');
};

// 4. Natural Language Query Processing
export const processAIQuery = (query: string, meters: Meter[], transactions: any[]): string => {
  const lowerQuery = query.toLowerCase();

  // Per-meter analytics — highest priority when a specific meter/customer is referenced
  const meterAnalytics = analyzeMeterByQuery(query, meters, transactions);
  if (meterAnalytics) {
    return meterAnalytics;
  }

  // Consumption queries
  if (lowerQuery.includes('consumption') || lowerQuery.includes('usage')) {
    const totalConsumption = meters.reduce((sum, m) => sum + parseFloat(m.consumption || '0'), 0);
    const avgConsumption = totalConsumption / (meters.length || 1);
    if (lowerQuery.includes('total')) {
      return `The total consumption across all ${meters.length} meters is ${totalConsumption.toFixed(2)} kWh. The average consumption per meter is ${avgConsumption.toFixed(2)} kWh.`;
    }
    if (lowerQuery.includes('predict') || lowerQuery.includes('forecast')) {
      const trends = analyzeConsumption(meters);
      const predictions = trends.filter((t) => t.predicted);
      const totalPredicted = predictions.reduce((sum, t) => sum + (t.predicted || 0), 0);
      return `Based on current trends, I predict a total consumption of ${totalPredicted.toFixed(2)} kWh over the next 7 days. This represents a ${((totalPredicted / totalConsumption - 1) * 100).toFixed(1)}% change from current levels.`;
    }
    return `Current total consumption is ${totalConsumption.toFixed(2)} kWh across ${meters.length} meters. Average per meter: ${avgConsumption.toFixed(2)} kWh.`;
  }

  // Revenue queries
  if (lowerQuery.includes('revenue') || lowerQuery.includes('payment') || lowerQuery.includes('money')) {
    const revenueData = analyzeRevenue(meters, transactions);
    if (lowerQuery.includes('highest') || lowerQuery.includes('top')) {
      const topCustomer = revenueData.topCustomers[0];
      return `The highest revenue customer is ${topCustomer.name} with Ksh ${topCustomer.amount.toLocaleString()}. The top 5 customers are:\n\n${revenueData.topCustomers.map((c, i) => `${i + 1}. ${c.name}: Ksh ${c.amount.toLocaleString()}`).join('\n')}`;
    }
    if (lowerQuery.includes('average')) {
      return `The average revenue per customer is Ksh ${revenueData.averagePerCustomer.toLocaleString(undefined, {
        maximumFractionDigits: 0
      })}. Total revenue: Ksh ${revenueData.totalRevenue.toLocaleString()}.`;
    }
    if (lowerQuery.includes('total')) {
      return `Total revenue from all transactions is Ksh ${revenueData.totalRevenue.toLocaleString()}. Projected revenue for next period: Ksh ${revenueData.projectedRevenue.toLocaleString(undefined, {
        maximumFractionDigits: 0
      })} (${revenueData.growthRate}% growth).`;
    }
    return `Total revenue: Ksh ${revenueData.totalRevenue.toLocaleString()}. Average per customer: Ksh ${revenueData.averagePerCustomer.toLocaleString(undefined, {
      maximumFractionDigits: 0
    })}. Growth rate: ${revenueData.growthRate}%.`;
  }

  // Meter status queries
  if (lowerQuery.includes('meter') || lowerQuery.includes('status') || lowerQuery.includes('offline') || lowerQuery.includes('active')) {
    const activeMeters = meters.filter((m) => m.status === 'Active').length;
    const lowBalance = meters.filter((m) => m.status === 'Low Balance').length;
    const disconnected = meters.filter((m) => m.status === 'Disconnected').length;
    const offline = meters.filter((m) => !m.lastReport).length;
    if (lowerQuery.includes('offline') || lowerQuery.includes('not working')) {
      return `There are ${offline} meters currently offline (not reporting). ${disconnected} meters are disconnected. I recommend checking communication modules for offline meters.`;
    }
    if (lowerQuery.includes('active')) {
      return `${activeMeters} meters are currently active and operating normally. ${lowBalance} meters have low balance warnings.`;
    }
    return `Meter Status Summary:\n- Active: ${activeMeters}\n- Low Balance: ${lowBalance}\n- Disconnected: ${disconnected}\n- Offline (no reports): ${offline}\n\nTotal meters: ${meters.length}`;
  }

  // Diagnostics queries
  if (lowerQuery.includes('issue') || lowerQuery.includes('problem') || lowerQuery.includes('critical') || lowerQuery.includes('diagnostic')) {
    const diagnostics = runDiagnostics(meters);
    const critical = diagnostics.filter((d) => d.severity === 'critical');
    const warnings = diagnostics.filter((d) => d.severity === 'warning');
    if (critical.length > 0) {
      return `⚠️ Found ${critical.length} critical issues requiring immediate attention:\n\n${critical.slice(0, 3).map((d) => `• ${d.issue} at ${d.location}\n  Recommendation: ${d.recommendation}`).join('\n\n')}${critical.length > 3 ? `\n\n...and ${critical.length - 3} more critical issues.` : ''}`;
    }
    if (diagnostics.length > 0) {
      return `Found ${diagnostics.length} issues:\n- Critical: ${critical.length}\n- Warnings: ${warnings.length}\n\nMost urgent: ${diagnostics[0].issue} at ${diagnostics[0].location}. Recommendation: ${diagnostics[0].recommendation}`;
    }
    return `✅ All systems operational! No critical issues detected across ${meters.length} meters.`;
  }

  // Location queries
  if (lowerQuery.includes('location') || lowerQuery.includes('where')) {
    const locationCounts = new Map<string, number>();
    meters.forEach((m) => {
      locationCounts.set(m.location, (locationCounts.get(m.location) || 0) + 1);
    });
    const topLocations = Array.from(locationCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return `Top 5 locations by meter count:\n\n${topLocations.map((l, i) => `${i + 1}. ${l[0]}: ${l[1]} meters`).join('\n')}`;
  }

  // Prepaid vs Postpaid
  if (lowerQuery.includes('prepaid') || lowerQuery.includes('postpaid')) {
    const prepaid = meters.filter((m) => m.type === 'prepaid').length;
    const postpaid = meters.filter((m) => m.type === 'postpaid').length;
    return `Meter Distribution:\n- Prepaid: ${prepaid} meters\n- Postpaid: ${postpaid} meters\n- Total: ${meters.length} meters`;
  }

  // Data Logger queries (3-Phase Data Logger devices)
  if (lowerQuery.includes('data logger') || lowerQuery.includes('logger') || lowerQuery.includes('3-phase') || lowerQuery.includes('three phase') || lowerQuery.includes('three-phase')) {
    let loggers: any[] = [];
    try {
      loggers = JSON.parse(localStorage.getItem('motech_data_loggers') || '[]');
    } catch {
      loggers = [];
    }
    const online = loggers.filter((l) => l.online).length;
    if (loggers.length === 0) {
      return `There are no MoTech 3-Phase Data Loggers registered yet. Admins can register one from the Data Logger section. The logger monitors voltage, current, power factor, frequency, harmonics (THD), energy, load profiles, and voltage dips & swells.`;
    }
    return `MoTech 3-Phase Data Loggers: ${loggers.length} registered (${online} online).\n\n${loggers.map((l) => `• ${l.name} (${l.serialNumber}) at ${l.location} — ${l.online ? 'Online' : 'Offline'}`).join('\n')}\n\nEach logger records daily consumption, peak demand, load trends, and power quality events.`;
  }

  // Balance / outstanding / debt queries
  if (lowerQuery.includes('balance') || lowerQuery.includes('outstanding') || lowerQuery.includes('debt') || lowerQuery.includes('owe') || lowerQuery.includes('bill')) {
    const prepaid = meters.filter((m) => m.type === 'prepaid');
    const postpaid = meters.filter((m) => m.type === 'postpaid');
    const totalPrepaidBalance = prepaid.reduce((sum, m) => sum + parseFloat(m.balance || '0'), 0);
    const totalOutstanding = postpaid.reduce((sum, m) => sum + parseFloat(m.balance || '0'), 0);
    return `Balance Overview:\n- Prepaid credit on ${prepaid.length} meters: Ksh ${totalPrepaidBalance.toLocaleString(undefined, {
      maximumFractionDigits: 0
    })}\n- Outstanding postpaid bills on ${postpaid.length} meters: Ksh ${totalOutstanding.toLocaleString(undefined, {
      maximumFractionDigits: 0
    })}\n- Average prepaid balance: Ksh ${(totalPrepaidBalance / (prepaid.length || 1)).toFixed(0)}`;
  }

  // Highest / lowest consumption meter
  if ((lowerQuery.includes('highest') || lowerQuery.includes('lowest')) && (lowerQuery.includes('consum') || lowerQuery.includes('usage'))) {
    const sorted = [...meters].sort((a, b) => parseFloat(b.consumption || '0') - parseFloat(a.consumption || '0'));
    const top = lowerQuery.includes('lowest') ? sorted[sorted.length - 1] : sorted[0];
    if (top) {
      return `The ${lowerQuery.includes('lowest') ? 'lowest' : 'highest'} consuming meter is ${top.customerName} (${top.accountNo}) at ${top.location} with ${parseFloat(top.consumption || '0').toFixed(2)} kWh.`;
    }
  }

  // Transformer queries
  if (lowerQuery.includes('transformer')) {
    const withTransformer = meters.filter((m) => m.transformer);
    const counts = new Map<string, number>();
    withTransformer.forEach((m) => counts.set(m.transformer!, (counts.get(m.transformer!) || 0) + 1));
    if (counts.size === 0) {
      return `No transformer assignments are recorded on the current meters.`;
    }
    return `Transformer distribution:\n\n${Array.from(counts.entries()).map(([t, c]) => `• ${t}: ${c} meter(s)`).join('\n')}`;
  }

  // Count / how many (generic)
  if (lowerQuery.includes('how many') || lowerQuery.includes('count') || lowerQuery.includes('number of')) {
    const prepaid = meters.filter((m) => m.type === 'prepaid').length;
    const postpaid = meters.filter((m) => m.type === 'postpaid').length;
    return `The system currently manages ${meters.length} meters in total — ${prepaid} prepaid and ${postpaid} postpaid — across ${transactions.length} recorded transactions.`;
  }

  // System overview / summary / help
  if (lowerQuery.includes('summary') || lowerQuery.includes('overview') || lowerQuery.includes('everything') || lowerQuery.includes('system') || lowerQuery.includes('report')) {
    return buildSystemSnapshot(meters, transactions);
  }

  // Default response — give a real system snapshot rather than only help text
  return `${buildSystemSnapshot(meters, transactions)}\n\nYou can ask me about a specific meter (e.g. "Show analytics for MET-1000-2023"), consumption, revenue, balances, diagnostics, locations, transformers, or the 3-Phase Data Loggers.`;
};

// Build a concise, accurate snapshot of the entire system from live data
export const buildSystemSnapshot = (meters: Meter[], transactions: any[]): string => {
  const prepaid = meters.filter((m) => m.type === 'prepaid');
  const postpaid = meters.filter((m) => m.type === 'postpaid');
  const active = meters.filter((m) => m.status === 'Active').length;
  const disconnected = meters.filter((m) => m.status === 'Disconnected').length;
  const offline = meters.filter((m) => !m.lastReport).length;
  const totalConsumption = meters.reduce((sum, m) => sum + parseFloat(m.consumption || '0'), 0);
  const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(String(t.amount).replace(/,/g, '')), 0);
  let loggers = 0;
  try {
    loggers = JSON.parse(localStorage.getItem('motech_data_loggers') || '[]').length;
  } catch {
    loggers = 0;
  }
  return `📋 MoTech SmartMeter System Snapshot\n- Total meters: ${meters.length} (${prepaid.length} prepaid, ${postpaid.length} postpaid)\n- Active: ${active} · Disconnected: ${disconnected} · Offline: ${offline}\n- Total consumption: ${totalConsumption.toFixed(2)} kWh\n- Total recorded revenue: Ksh ${totalRevenue.toLocaleString()}\n- Transactions on record: ${transactions.length}\n- 3-Phase Data Loggers registered: ${loggers}`;
};

// Export functions for reports
export const exportConsumptionReport = (trends: ConsumptionTrend[]): void => {
  const csv = ['Date,Actual (kWh),Predicted (kWh),Lower Bound,Upper Bound', ...trends.map((t) => `${t.date},${t.actual || ''},${t.predicted || ''},${t.lowerBound || ''},${t.upperBound || ''}`)].join('\n');
  downloadCSV(csv, 'consumption-forecast-report.csv');
};
export const exportRevenueReport = (insights: RevenueInsight): void => {
  const csv = ['Metric,Value', `Total Revenue,Ksh ${insights.totalRevenue.toLocaleString()}`, `Average Per Customer,Ksh ${insights.averagePerCustomer.toLocaleString()}`, `Projected Revenue,Ksh ${insights.projectedRevenue.toLocaleString()}`, `Growth Rate,${insights.growthRate}%`, '', 'Top Customers', 'Rank,Name,Amount (Ksh),Type', ...insights.topCustomers.map((c, i) => `${i + 1},${c.name},${c.amount.toLocaleString()},${c.type}`)].join('\n');
  downloadCSV(csv, 'revenue-analytics-report.csv');
};
export const exportDiagnosticsReport = (issues: DiagnosticIssue[]): void => {
  const csv = ['Meter ID,Customer,Location,Severity,Issue,Recommendation,Timestamp', ...issues.map((i) => `${i.meterId},${i.customerName},${i.location},${i.severity},${i.issue},"${i.recommendation}",${new Date(i.timestamp).toLocaleString()}`)].join('\n');
  downloadCSV(csv, 'diagnostics-report.csv');
};
const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], {
    type: 'text/csv;charset=utf-8;'
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};