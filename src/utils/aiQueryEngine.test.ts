import { beforeEach, describe, expect, it } from 'vitest';
import type { Meter } from './meterStorage';
import { decodeEntities, processAIQuery } from './aiQueryEngine';

const report = (over: Partial<NonNullable<Meter['lastReport']>> = {}): NonNullable<Meter['lastReport']> => ({
  timestamp: new Date().toISOString(), voltage: 230, current: 10, powerFactor: 0.95, frequency: 50, consumption: 12,
  signalStrength: 'Good', status: 'online', ...over
});

const meters: Meter[] = [
  { accountNo: 'MET-1000-2023', customerName: 'John Mwangi', meterNo: 'ESP-1000-001', location: 'Westlands, Nairobi', consumption: '120.50', balance: '500', status: 'Active', type: 'prepaid', transformer: 'TX-1', customerType: 'Residential', lastReport: report() },
  { accountNo: 'MET-1001-2023', customerName: 'Sarah Wambui', meterNo: 'ESP-1001-001', location: 'Kilimani, Nairobi', consumption: '300.00', balance: '50', status: 'Low Balance', type: 'prepaid', transformer: 'TX-1', customerType: 'Commercial', lastReport: report({ voltage: 260 }) },
  { accountNo: 'MET-2000-2023', customerName: 'David Omondi', meterNo: 'ESP-2000-001', location: 'Mombasa Road', consumption: '80.25', balance: '4500', status: 'Overdue', type: 'postpaid', transformer: 'TX-2', customerType: 'Residential' },
  { accountNo: 'MET-2001-2023', customerName: 'Grace Njeri', meterNo: 'ESP-2001-001', location: 'Westlands, Nairobi', consumption: '200.00', balance: '1500', status: 'Disconnected', type: 'postpaid', transformer: 'TX-2', customerType: 'Industrial', lastReport: report({ signalStrength: 'Poor' }) }
];

const day = (n: number) => new Date(Date.now() - n * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const txns = [
  { transactionId: 'T1', accountNo: 'MET-1000-2023', customerName: 'John Mwangi', amount: '1,000.00', units: '64.5', date: day(1), status: 'Completed' },
  { transactionId: 'T2', accountNo: 'MET-1001-2023', customerName: 'Sarah Wambui', amount: '3,000.00', units: '193', date: day(3), status: 'Completed' },
  { transactionId: 'T3', accountNo: 'MET-1000-2023', customerName: 'John Mwangi', amount: '2,000.00', units: '129', date: day(20), status: 'Completed' }
];

const ask = (q: string) => processAIQuery(q, meters, txns);

describe('AI query engine', () => {
  beforeEach(() => localStorage.clear());

  it('decodes escaped apostrophes and still answers (the "What&#x27;s" bug)', () => {
    expect(decodeEntities('What&#x27;s the total')).toBe("What's the total");
    expect(ask('What&#x27;s the total consumption across all meters?')).toContain('700.75 kWh');
    expect(ask("What's the total consumption across all meters?")).toContain('across all 4 meters');
  });

  it('answers counts with filters', () => {
    expect(ask('How many prepaid meters are there?')).toMatch(/2 prepaid meters/);
    expect(ask('How many meters are offline?')).toMatch(/1 offline meter/);
    expect(ask('how many meters have low balance')).toMatch(/1 low balance meter/);
    expect(ask('How many meters are in Westlands?')).toMatch(/2 meters in Westlands/);
  });

  it('computes consumption totals, averages and extremes', () => {
    expect(ask('total consumption of postpaid meters')).toContain('280.25 kWh');
    expect(ask('average consumption per meter')).toContain('175.19 kWh');
    expect(ask('which meter has the highest consumption?')).toContain('Sarah Wambui');
    expect(ask('lowest consumption meter')).toContain('David Omondi');
  });

  it('answers balances and outstanding bills', () => {
    expect(ask('total outstanding balance')).toContain('Ksh 6,000');
    expect(ask('prepaid credit balance')).toContain('Ksh 550');
  });

  it('answers revenue questions with time windows and scopes', () => {
    expect(ask('total revenue')).toContain('Ksh 6,000');
    expect(ask('revenue in the last 7 days')).toContain('Ksh 4,000');
    expect(ask('top customers by revenue')).toMatch(/1\. (John Mwangi|Sarah Wambui): Ksh 3,000/);
    expect(ask('how many payments were made')).toMatch(/3 payment transactions/);
  });

  it('reports diagnostics, readings and signal', () => {
    expect(ask('any critical issues?')).toMatch(/critical/i);
    expect(ask('what is the average voltage')).toMatch(/Average: 240\.0V/);
    expect(ask('which meters have poor signal')).toContain('Grace Njeri');
  });

  it('reads data loggers, commands and API requests from storage', () => {
    localStorage.setItem('motech_data_loggers', JSON.stringify([{ name: 'Logger A', serialNumber: 'SN1', location: 'Plant', online: true }, { name: 'Logger B', online: false }]));
    expect(ask('how many data loggers are online')).toMatch(/1 data logger online/);
    localStorage.setItem('motech_meter_commands', JSON.stringify([{ id: '1', meterAccountNo: 'MET-1000-2023', type: 'SWITCH_OFF', status: 'completed', createdAt: new Date().toISOString(), createdBy: 'a@b.co' }]));
    expect(ask('how many commands completed')).toMatch(/1 command completed/);
    localStorage.setItem('motech_api_requests', JSON.stringify([{ id: '1', userId: 'u', email: 'x@y.co', name: 'X', status: 'pending', requestDate: new Date().toISOString() }]));
    expect(ask('pending api requests')).toContain('1 pending');
  });

  it('looks up a single meter by account number or name', () => {
    expect(ask('Show analytics for MET-1000-2023')).toContain('John Mwangi');
    expect(ask('tell me about Grace Njeri')).toContain('MET-2001-2023');
  });

  it('never returns an empty answer and handles empty data', () => {
    expect(ask('blah blah')).toContain('System Snapshot');
    expect(ask('hello')).toMatch(/Hello/);
    expect(processAIQuery('total consumption', [], [])).toBeTruthy();
    expect(processAIQuery('total revenue', [], [])).toMatch(/no payment transactions/);
  });
});
