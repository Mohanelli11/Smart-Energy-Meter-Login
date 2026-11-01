/**
 * AI Insights query engine.
 *
 * Answers plain-English questions from ALL data in the system: meters (prepaid + postpaid),
 * payment transactions, 3-Phase Data Loggers, meter control commands and API-access requests.
 * It runs entirely in the browser and is synchronous, so answers are immediate.
 *
 * How a question is understood:
 *   1. Normalise the text (decode HTML entities, curly quotes, case, spacing).
 *   2. Pull out FILTERS (type, status, location, transformer, customer type, time window),
 *      a METRIC (consumption, balance, revenue, ...), and an OPERATION (count, total, average,
 *      highest/lowest, list, forecast).
 *   3. Apply the filters to the data and compute the answer, always saying what it covers.
 */
import { getAllCommands } from './commandQueue';
import { getApiRequests } from './apiAccessStorage';
import type { Meter } from './meterStorage';
import {
  analyzeConsumption,
  analyzeMeterByQuery,
  analyzeRevenue,
  buildSystemSnapshot,
  runDiagnostics
} from './aiService';

type Txn = Record<string, any>;

interface Logger {
  id?: string;
  name: string;
  serialNumber?: string;
  location?: string;
  online?: boolean;
  lastSync?: string;
}

interface Filters {
  type?: 'prepaid' | 'postpaid';
  status?: Meter['status'];
  offline?: boolean;
  online?: boolean;
  location?: string;
  transformer?: string;
  customerType?: string;
  days?: number;
  daysLabel?: string;
}

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------

const ENTITIES: Record<string, string> = {
  '&#x27;': "'",
  '&#39;': "'",
  '&amp;': '&',
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
  '&#x2f;': '/'
};

/** Turn escaped text such as "What&#x27;s" back into "What's" (safety net for older input). */
export function decodeEntities(text: string): string {
  return text.replace(/&#x27;|&#39;|&amp;|&quot;|&lt;|&gt;|&#x2f;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

const num = (v: unknown): number => {
  const n = parseFloat(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const ksh = (n: number, digits = 0): string =>
  `Ksh ${n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;

const kwh = (n: number): string => `${n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })} kWh`;

const plural = (n: number, one: string, many = `${one}s`): string => `${n.toLocaleString()} ${n === 1 ? one : many}`;

const wordRegexCache = new Map<string, RegExp>();
/** True if any keyword appears at the START of a word (so "paid" does not match "prepaid"). */
const has = (q: string, ...words: string[]): boolean =>
  words.some((w) => {
    let re = wordRegexCache.get(w);
    if (!re) {
      re = new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
      wordRegexCache.set(w, re);
    }
    return re.test(q);
  });

function readLoggers(): Logger[] {
  try {
    const parsed = JSON.parse(localStorage.getItem('motech_data_loggers') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const STOP_LOCATION_WORDS = new Set([
  'road', 'street', 'estate', 'avenue', 'county', 'town', 'area', 'city', 'plaza', 'house',
  'kenya', 'near', 'opposite', 'behind', 'along', 'phase', 'block', 'court', 'gardens', 'garden'
]);

function parseTxnDate(value: unknown): number {
  const t = new Date(String(value)).getTime();
  return Number.isFinite(t) ? t : NaN;
}

// ---------------------------------------------------------------------------------------------
// Understanding the question
// ---------------------------------------------------------------------------------------------

function parseFilters(q: string, meters: Meter[]): Filters {
  const f: Filters = {};

  if (/\bpre-?paid\b/.test(q)) f.type = 'prepaid';
  else if (/\bpost-?paid\b/.test(q)) f.type = 'postpaid';

  if (has(q, 'low balance', 'low-balance', 'running low', 'low credit')) f.status = 'Low Balance';
  else if (has(q, 'pending bill')) f.status = 'Pending Bill';
  else if (has(q, 'overdue', 'over due', 'late payment')) f.status = 'Overdue';
  else if (has(q, 'disconnect', 'switched off', 'cut off')) f.status = 'Disconnected';
  else if (/\bactive\b/.test(q)) f.status = 'Active';

  if (has(q, 'offline', 'not reporting', 'no report', 'not communicating', 'no communication', 'not working')) {
    f.offline = true;
  } else if (/\bonline\b/.test(q) || has(q, 'reporting meters', 'communicating')) {
    f.online = true;
  }

  // Location: match a full location name, or a distinctive word from one.
  const locations = Array.from(new Set(meters.map((m) => (m.location || '').trim()).filter(Boolean)));
  const fullHit = locations
    .filter((l) => q.includes(l.toLowerCase()))
    .sort((a, b) => b.length - a.length)[0];
  if (fullHit) {
    f.location = fullHit;
  } else {
    const wordCounts = new Map<string, number>();
    locations.forEach((l) =>
      new Set(l.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP_LOCATION_WORDS.has(w))).forEach((w) =>
        wordCounts.set(w, (wordCounts.get(w) || 0) + 1)
      )
    );
    const qWords = new Set(q.split(/[^a-z0-9]+/));
    const word = Array.from(wordCounts.keys()).find((w) => qWords.has(w));
    if (word) {
      // Show the place name the way it is written in the data (e.g. "Westlands", not "westlands").
      const original = locations
        .flatMap((l) => l.split(/[^A-Za-z0-9]+/))
        .find((w) => w.toLowerCase() === word);
      f.location = original || word;
    }
  }

  const transformers = Array.from(new Set(meters.map((m) => m.transformer).filter(Boolean) as string[]));
  const tHit = transformers.find((t) => q.includes(t.toLowerCase()));
  if (tHit) f.transformer = tHit;

  const customerTypes = Array.from(new Set(meters.map((m) => m.customerType).filter(Boolean) as string[]));
  const cHit = customerTypes.find((c) => new RegExp(`\\b${c.toLowerCase()}s?\\b`).test(q));
  if (cHit) f.customerType = cHit;

  // Time window (used for payments / transactions)
  const lastN = q.match(/(?:last|past|previous)\s+(\d+)\s+days?/);
  if (lastN) {
    f.days = parseInt(lastN[1], 10);
    f.daysLabel = `in the last ${f.days} days`;
  } else if (has(q, 'today')) {
    f.days = 1;
    f.daysLabel = 'today';
  } else if (has(q, 'this week', 'last week', 'past week')) {
    f.days = 7;
    f.daysLabel = 'in the last 7 days';
  } else if (has(q, 'this month', 'last month', 'past month')) {
    f.days = 30;
    f.daysLabel = 'in the last 30 days';
  }

  return f;
}

function applyMeterFilters(meters: Meter[], f: Filters): Meter[] {
  return meters.filter((m) => {
    if (f.type && m.type !== f.type) return false;
    if (f.status && m.status !== f.status) return false;
    if (f.offline && m.lastReport) return false;
    if (f.online && !(m.lastReport && m.lastReport.status === 'online')) return false;
    if (f.location && !(m.location || '').toLowerCase().includes(f.location.toLowerCase())) return false;
    if (f.transformer && m.transformer !== f.transformer) return false;
    if (f.customerType && m.customerType !== f.customerType) return false;
    return true;
  });
}

function applyTxnFilters(txns: Txn[], f: Filters, scopedMeters: Meter[] | null): Txn[] {
  let out = txns;
  if (scopedMeters) {
    const accounts = new Set(scopedMeters.map((m) => m.accountNo));
    out = out.filter((t) => accounts.has(t.accountNo));
  }
  if (f.days) {
    const since = Date.now() - f.days * 24 * 60 * 60 * 1000;
    out = out.filter((t) => {
      const d = parseTxnDate(t.date);
      return Number.isNaN(d) || d >= since;
    });
  }
  return out;
}

function describeScope(f: Filters, count: number, noun = 'meter'): string {
  const parts: string[] = [];
  if (f.status) parts.push(f.status.toLowerCase());
  if (f.offline) parts.push('offline');
  if (f.online) parts.push('online');
  if (f.type) parts.push(f.type);
  if (f.customerType) parts.push(f.customerType.toLowerCase());
  let s = `${parts.length ? `${parts.join(' ')} ` : ''}${noun}${count === 1 ? '' : 's'}`;
  if (f.location) s += ` in ${f.location}`;
  if (f.transformer) s += ` on transformer ${f.transformer}`;
  return s;
}

const hasFilters = (f: Filters): boolean =>
  Boolean(f.type || f.status || f.offline || f.online || f.location || f.transformer || f.customerType);

function topN(q: string, fallback: number): number {
  const m = q.match(/\btop\s*(\d+)|\b(\d+)\s*(?:highest|lowest|top|most|least|biggest|largest|smallest)|first\s+(\d+)/);
  const n = m ? parseInt(m[1] || m[2] || m[3], 10) : fallback;
  return Math.min(Math.max(n, 1), 25);
}

function formatMeterLine(m: Meter, extra?: string): string {
  return `• ${m.customerName} (${m.accountNo}) — ${m.location || 'no location'}${extra ? ` — ${extra}` : ''}`;
}

function listMeters(meters: Meter[], limit: number, extra?: (m: Meter) => string): string {
  const shown = meters.slice(0, limit).map((m) => formatMeterLine(m, extra?.(m)));
  const more = meters.length > limit ? `\n…and ${(meters.length - limit).toLocaleString()} more.` : '';
  return shown.join('\n') + more;
}

// ---------------------------------------------------------------------------------------------
// Answer builders
// ---------------------------------------------------------------------------------------------

function answerDataLoggers(q: string): string {
  const loggers = readLoggers();
  if (loggers.length === 0) {
    return 'There are no MoTech 3-Phase Data Loggers registered yet. Admins can register one from the Data Logger section. The logger monitors voltage, current, power factor, frequency, harmonics (THD), energy, load profiles, and voltage dips and swells.';
  }
  let list = loggers;
  let label = 'registered';
  if (has(q, 'offline')) {
    list = loggers.filter((l) => !l.online);
    label = 'offline';
  } else if (/\bonline\b/.test(q)) {
    list = loggers.filter((l) => l.online);
    label = 'online';
  }
  const online = loggers.filter((l) => l.online).length;
  if (has(q, 'how many', 'count', 'number of')) {
    return `There are ${plural(list.length, 'data logger')} ${label}${label === 'registered' ? ` (${online} online, ${loggers.length - online} offline)` : ''}.`;
  }
  return `MoTech 3-Phase Data Loggers: ${loggers.length} registered (${online} online).\n\n${list
    .map((l) => `• ${l.name}${l.serialNumber ? ` (${l.serialNumber})` : ''}${l.location ? ` at ${l.location}` : ''} — ${l.online ? 'Online' : 'Offline'}${l.lastSync ? `, last sync ${l.lastSync}` : ''}`)
    .join('\n')}`;
}

function answerCommands(q: string, meters: Meter[]): string {
  const cmds = getAllCommands();
  if (cmds.length === 0) {
    return 'No meter control commands have been sent yet. Commands (switch on / switch off) can be issued from a meter\'s view panel.';
  }
  const by = (s: string) => cmds.filter((c) => c.status === s).length;
  let list = cmds;
  let label = 'sent';
  for (const s of ['queued', 'processing', 'completed', 'failed', 'expired']) {
    if (q.includes(s)) {
      list = cmds.filter((c) => c.status === s);
      label = s;
      break;
    }
  }
  if (q.includes('switch off') || q.includes('switch-off')) list = list.filter((c) => c.type === 'SWITCH_OFF');
  else if (q.includes('switch on') || q.includes('switch-on')) list = list.filter((c) => c.type === 'SWITCH_ON');
  const summary = `Meter commands: ${cmds.length} total — ${by('completed')} completed, ${by('queued')} queued, ${by('processing')} processing, ${by('failed')} failed, ${by('expired')} expired.`;
  if (has(q, 'how many', 'count', 'number of')) {
    return `${plural(list.length, 'command')} ${label}.\n\n${summary}`;
  }
  const recent = [...list]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((c) => {
      const m = meters.find((x) => x.accountNo === c.meterAccountNo);
      return `• ${c.type === 'SWITCH_ON' ? 'Switch on' : 'Switch off'} ${m ? `${m.customerName} (${c.meterAccountNo})` : c.meterAccountNo} — ${c.status}, by ${c.createdBy}`;
    });
  return `${summary}\n\nMost recent${label === 'sent' ? '' : ` ${label}`}:\n${recent.join('\n') || 'None.'}`;
}

function answerApiAccess(q: string): string {
  const reqs = getApiRequests();
  if (reqs.length === 0) return 'There are no API access requests yet.';
  const by = (s: string) => reqs.filter((r) => r.status === s);
  const summary = `API access requests: ${reqs.length} total — ${by('pending').length} pending, ${by('approved').length} approved, ${by('rejected').length} rejected.`;
  let list = reqs;
  for (const s of ['pending', 'approved', 'rejected']) {
    if (q.includes(s)) {
      list = by(s);
      break;
    }
  }
  if (has(q, 'how many', 'count', 'number of')) return `${plural(list.length, 'request')}.\n\n${summary}`;
  return `${summary}\n\n${list
    .slice(0, 8)
    .map((r) => `• ${r.name} (${r.email}) — ${r.status}, requested ${new Date(r.requestDate).toLocaleDateString()}`)
    .join('\n')}`;
}

function answerTransactions(q: string, f: Filters, meters: Meter[], txns: Txn[]): string {
  const scoped = hasFilters(f) ? applyMeterFilters(meters, f) : null;
  const rows = applyTxnFilters(txns, f, scoped);
  const scopeText = `${scoped ? ` for ${describeScope(f, scoped.length)}` : ''}${f.daysLabel ? ` ${f.daysLabel}` : ''}`;
  if (rows.length === 0) {
    return `I found no payment transactions${scopeText || ' on record'}.`;
  }
  const amounts = rows.map((t) => num(t.amount));
  const total = amounts.reduce((a, b) => a + b, 0);

  const byCustomer = new Map<string, { amount: number; count: number }>();
  rows.forEach((t) => {
    const cur = byCustomer.get(t.customerName) || { amount: 0, count: 0 };
    cur.amount += num(t.amount);
    cur.count += 1;
    byCustomer.set(t.customerName, cur);
  });
  const ranked = Array.from(byCustomer.entries()).sort((a, b) => b[1].amount - a[1].amount);

  if (has(q, 'highest revenue', 'top customer', 'highest paying', 'biggest customer', 'best customer', 'most revenue') ||
      (has(q, 'customer', 'customers') && has(q, 'highest', 'top', 'most'))) {
    const n = topN(q, 5);
    return `Top ${Math.min(n, ranked.length)} customers by revenue${scopeText}:\n\n${ranked
      .slice(0, n)
      .map(([name, v], i) => `${i + 1}. ${name}: ${ksh(v.amount)} (${plural(v.count, 'payment')})`)
      .join('\n')}\n\nTotal revenue${scopeText}: ${ksh(total)}.`;
  }
  if (has(q, 'lowest revenue', 'lowest paying', 'least revenue') || (has(q, 'customer') && has(q, 'lowest', 'least'))) {
    const n = topN(q, 5);
    return `Lowest ${Math.min(n, ranked.length)} customers by revenue${scopeText}:\n\n${[...ranked]
      .reverse()
      .slice(0, n)
      .map(([name, v], i) => `${i + 1}. ${name}: ${ksh(v.amount)} (${plural(v.count, 'payment')})`)
      .join('\n')}`;
  }
  if (has(q, 'average') && has(q, 'customer')) {
    return `The average revenue per paying customer${scopeText} is ${ksh(total / byCustomer.size)} across ${plural(byCustomer.size, 'customer')}. Total revenue: ${ksh(total)}.`;
  }
  if (has(q, 'average', 'mean', 'avg')) {
    return `The average payment${scopeText} is ${ksh(total / rows.length)} across ${plural(rows.length, 'transaction')}. Total revenue: ${ksh(total)}.`;
  }
  if (has(q, 'largest', 'biggest', 'highest payment', 'highest transaction')) {
    const t = [...rows].sort((a, b) => num(b.amount) - num(a.amount))[0];
    return `The largest payment${scopeText} is ${ksh(num(t.amount))} by ${t.customerName} (${t.accountNo}) on ${t.date}, transaction ${t.transactionId}.`;
  }
  if (has(q, 'smallest', 'lowest payment', 'lowest transaction')) {
    const t = [...rows].sort((a, b) => num(a.amount) - num(b.amount))[0];
    return `The smallest payment${scopeText} is ${ksh(num(t.amount))} by ${t.customerName} (${t.accountNo}) on ${t.date}, transaction ${t.transactionId}.`;
  }
  if (has(q, 'how many', 'count', 'number of')) {
    return `There ${rows.length === 1 ? 'is' : 'are'} ${plural(rows.length, 'payment transaction')}${scopeText}, totalling ${ksh(total)}.`;
  }
  if (has(q, 'recent', 'latest', 'last payment', 'list', 'show')) {
    return `Most recent payments${scopeText}:\n\n${rows
      .slice(0, 8)
      .map((t) => `• ${t.date} — ${t.customerName} (${t.accountNo}): ${ksh(num(t.amount))}${t.units && t.units !== 'N/A' ? `, ${t.units} units` : ''}`)
      .join('\n')}\n\nTotal revenue${scopeText}: ${ksh(total)} from ${plural(rows.length, 'transaction')}.`;
  }
  const insights = analyzeRevenue(meters, rows);
  return `Revenue${scopeText}: ${ksh(total)} from ${plural(rows.length, 'transaction')} by ${plural(byCustomer.size, 'customer')}.\n- Average payment: ${ksh(total / rows.length)}\n- Average per customer: ${ksh(total / byCustomer.size)}\n- Top customer: ${ranked[0][0]} (${ksh(ranked[0][1].amount)})\n- Projected revenue next period: ${ksh(insights.projectedRevenue)} (${insights.growthRate}% growth)`;
}

type Metric = 'consumption' | 'balance';

function answerMetric(q: string, metric: Metric, f: Filters, meters: Meter[]): string {
  const scoped = applyMeterFilters(meters, f);
  const scopeNoun = describeScope(f, scoped.length);
  if (scoped.length === 0) return `I found no ${scopeNoun} in the system.`;

  const value = (m: Meter) => num(metric === 'consumption' ? m.consumption : m.balance);
  const fmt = (n: number) => (metric === 'consumption' ? kwh(n) : ksh(n));
  const label = metric === 'consumption' ? 'consumption' : q.includes('outstanding') || q.includes('owe') || q.includes('debt') || q.includes('bill') ? 'outstanding balance' : 'balance';
  const total = scoped.reduce((s, m) => s + value(m), 0);
  const avg = total / scoped.length;

  const wantsHigh = has(q, 'highest', 'most', 'top', 'largest', 'biggest', 'maximum', 'max');
  const wantsLow = has(q, 'lowest', 'least', 'smallest', 'minimum', 'min', 'bottom');
  if (wantsHigh || wantsLow) {
    const sorted = [...scoped].sort((a, b) => (wantsLow && !wantsHigh ? value(a) - value(b) : value(b) - value(a)));
    const many = /\bmeters\b|\bcustomers\b|\btop\s*\d+|\b\d+\s/.test(q);
    const n = topN(q, many ? 5 : 1);
    const dir = wantsLow && !wantsHigh ? 'lowest' : 'highest';
    if (n === 1) {
      const m = sorted[0];
      return `The ${dir} ${label} ${f.location || hasFilters(f) ? `among ${scopeNoun} ` : ''}is ${m.customerName} (${m.accountNo}) at ${m.location || 'an unrecorded location'} with ${fmt(value(m))}.`;
    }
    return `Top ${n} ${scopeNoun} by ${dir} ${label}:\n\n${sorted
      .slice(0, n)
      .map((m, i) => `${i + 1}. ${m.customerName} (${m.accountNo}) — ${m.location || 'no location'}: ${fmt(value(m))}`)
      .join('\n')}`;
  }
  if (has(q, 'average', 'mean', 'avg', 'per meter', 'per customer')) {
    return `The average ${label} across ${plural(scoped.length, scopeNoun.replace(/s$/, ''))} is ${fmt(avg)} (total ${fmt(total)}).`;
  }
  if (has(q, 'predict', 'forecast', 'next week', 'next 7', 'next month', 'tomorrow', 'expected') && metric === 'consumption') {
    return answerForecast(meters, total);
  }
  if (metric === 'consumption' && !hasFilters(f) && has(q, 'total')) {
    return `The total consumption across all ${meters.length} meters is ${kwh(total)}. The average consumption per meter is ${kwh(avg)}.`;
  }
  const prepaid = scoped.filter((m) => m.type === 'prepaid');
  const postpaid = scoped.filter((m) => m.type === 'postpaid');
  let extra = '';
  if (!f.type && prepaid.length && postpaid.length) {
    const p = prepaid.reduce((s, m) => s + value(m), 0);
    const pp = postpaid.reduce((s, m) => s + value(m), 0);
    extra = `\n- Prepaid (${prepaid.length.toLocaleString()}): ${fmt(p)}\n- Postpaid (${postpaid.length.toLocaleString()}): ${fmt(pp)}`;
  }
  return `Total ${label} across ${plural(scoped.length, scopeNoun.replace(/s$/, ''))}: ${fmt(total)}. Average per meter: ${fmt(avg)}.${extra}`;
}

function answerForecast(meters: Meter[], totalNow: number): string {
  const trends = analyzeConsumption(meters);
  const predicted = trends.filter((t) => t.predicted !== undefined);
  const totalPredicted = predicted.reduce((s, t) => s + (t.predicted || 0), 0);
  const change = totalNow > 0 ? ((totalPredicted / totalNow - 1) * 100).toFixed(1) : '0.0';
  return `Based on current trends, I predict a total consumption of ${kwh(totalPredicted)} over the next 7 days. This represents a ${change}% change from current levels.`;
}

function answerMeterStatus(q: string, f: Filters, meters: Meter[]): string {
  const scoped = applyMeterFilters(meters, f);
  const noun = describeScope(f, scoped.length);

  if (has(q, 'how many', 'count', 'number of', 'total number')) {
    if (!hasFilters(f)) return answerOverviewCounts(meters);
    return `There ${scoped.length === 1 ? 'is' : 'are'} ${plural(scoped.length, noun.replace(/s$/, ''))} out of ${meters.length.toLocaleString()} meters in the system.`;
  }
  if (has(q, 'list', 'show', 'which', 'who', 'find', 'give me', 'display', 'name') && scoped.length > 0 && hasFilters(f)) {
    return `${plural(scoped.length, noun.replace(/s$/, ''))}:\n\n${listMeters(scoped, topN(q, 10), (m) => `${m.status}${m.lastReport ? '' : ', not reporting'}`)}`;
  }
  if (hasFilters(f)) {
    if (scoped.length === 0) return `I found no ${noun} in the system.`;
    return `There ${scoped.length === 1 ? 'is' : 'are'} ${plural(scoped.length, noun.replace(/s$/, ''))} (${((scoped.length / meters.length) * 100).toFixed(1)}% of ${meters.length.toLocaleString()} meters).\n\n${listMeters(scoped, 5, (m) => m.status)}`;
  }
  return buildStatusSummary(meters);
}

function buildStatusSummary(meters: Meter[]): string {
  const c = (s: Meter['status']) => meters.filter((m) => m.status === s).length;
  const offline = meters.filter((m) => !m.lastReport).length;
  return `Meter Status Summary:\n- Active: ${c('Active')}\n- Low Balance: ${c('Low Balance')}\n- Disconnected: ${c('Disconnected')}\n- Pending Bill: ${c('Pending Bill')}\n- Overdue: ${c('Overdue')}\n- Offline (no reports): ${offline}\n\nTotal meters: ${meters.length.toLocaleString()}`;
}

function answerOverviewCounts(meters: Meter[]): string {
  const prepaid = meters.filter((m) => m.type === 'prepaid').length;
  const postpaid = meters.filter((m) => m.type === 'postpaid').length;
  return `The system manages ${meters.length.toLocaleString()} meters in total — ${prepaid.toLocaleString()} prepaid and ${postpaid.toLocaleString()} postpaid.`;
}

function breakdown(meters: Meter[], keyOf: (m: Meter) => string | undefined, title: string, limit = 8): string {
  const counts = new Map<string, { count: number; kwh: number }>();
  meters.forEach((m) => {
    const k = keyOf(m);
    if (!k) return;
    const cur = counts.get(k) || { count: 0, kwh: 0 };
    cur.count += 1;
    cur.kwh += num(m.consumption);
    counts.set(k, cur);
  });
  if (counts.size === 0) return `No ${title.toLowerCase()} information is recorded on the current meters.`;
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1].count - a[1].count);
  return `${title} (${counts.size} total):\n\n${sorted
    .slice(0, limit)
    .map(([k, v], i) => `${i + 1}. ${k}: ${plural(v.count, 'meter')}, ${kwh(v.kwh)}`)
    .join('\n')}${sorted.length > limit ? `\n…and ${sorted.length - limit} more.` : ''}`;
}

function answerDiagnostics(q: string, f: Filters, meters: Meter[]): string {
  const scoped = applyMeterFilters(meters, f);
  const accounts = new Set(scoped.map((m) => m.meterNo));
  const all = runDiagnostics(scoped);
  const diagnostics = hasFilters(f) ? all.filter((d) => accounts.has(d.meterId)) : all;
  const critical = diagnostics.filter((d) => d.severity === 'critical');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');
  const scopeText = hasFilters(f) ? ` among ${describeScope(f, scoped.length)}` : ` across ${meters.length.toLocaleString()} meters`;

  if (diagnostics.length === 0) return `✅ All systems operational! No issues detected${scopeText}.`;
  if (has(q, 'how many', 'count', 'number of')) {
    return `Found ${diagnostics.length} issues${scopeText}: ${critical.length} critical and ${warnings.length} warnings.`;
  }
  const pool = has(q, 'critical', 'urgent', 'severe') ? critical : diagnostics;
  const head = has(q, 'critical', 'urgent', 'severe') ?
  `⚠️ Found ${critical.length} critical issues${scopeText}` :
  `Found ${diagnostics.length} issues${scopeText} (${critical.length} critical, ${warnings.length} warnings)`;
  if (pool.length === 0) return `${head}. No critical issues — ${warnings.length} warnings to review.`;
  const n = topN(q, 5);
  return `${head}:\n\n${pool
    .slice(0, n)
    .map((d) => `• ${d.customerName} (${d.meterId}) at ${d.location}: ${d.issue}\n  Recommendation: ${d.recommendation}`)
    .join('\n\n')}${pool.length > n ? `\n\n…and ${pool.length - n} more.` : ''}`;
}

function answerReportMetric(q: string, f: Filters, meters: Meter[]): string | null {
  const keys: Array<[string, (r: NonNullable<Meter['lastReport']>) => number, string, number]> = [
    ['voltage', (r) => r.voltage, 'V', 1],
    ['power factor', (r) => r.powerFactor, '', 2],
    ['frequency', (r) => r.frequency, ' Hz', 2],
    ['current', (r) => r.current, ' A', 1]
  ];
  const hit = keys.find(([k]) => q.includes(k));
  if (!hit) return null;
  const [name, pick, unit, digits] = hit;
  const reporting = applyMeterFilters(meters, f).filter((m) => m.lastReport);
  if (reporting.length === 0) return `No ${hasFilters(f) ? 'matching ' : ''}meters have reported ${name} readings yet.`;
  const values = reporting.map((m) => pick(m.lastReport!));
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...reporting].sort((a, b) => pick(b.lastReport!) - pick(a.lastReport!));
  const hi = sorted[0];
  const lo = sorted[sorted.length - 1];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} readings from ${plural(reporting.length, 'reporting meter')}:\n- Average: ${avg.toFixed(digits)}${unit}\n- Highest: ${pick(hi.lastReport!).toFixed(digits)}${unit} (${hi.customerName}, ${hi.accountNo})\n- Lowest: ${pick(lo.lastReport!).toFixed(digits)}${unit} (${lo.customerName}, ${lo.accountNo})`;
}

function answerSignal(q: string, f: Filters, meters: Meter[]): string | null {
  if (!has(q, 'signal', 'gsm', 'network strength', 'connectivity')) return null;
  const reporting = applyMeterFilters(meters, f).filter((m) => m.lastReport);
  if (reporting.length === 0) return 'No meters have reported signal strength yet.';
  const counts: Record<string, number> = {};
  reporting.forEach((m) => {
    const s = m.lastReport!.signalStrength || 'Unknown';
    counts[s] = (counts[s] || 0) + 1;
  });
  const poor = reporting.filter((m) => m.lastReport!.signalStrength === 'Poor');
  return `Signal strength across ${plural(reporting.length, 'reporting meter')}:\n${Object.entries(counts)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')}${poor.length ? `\n\nMeters with poor signal:\n${listMeters(poor, 5)}` : ''}`;
}

const HELP_TEXT =
'I can answer questions using all the data in the system. For example:\n' +
'• "What is the total consumption across all meters?"\n' +
'• "How many prepaid meters are offline?"\n' +
'• "Which postpaid customers have the highest balance?"\n' +
'• "List meters with low balance in Nairobi"\n' +
'• "Revenue in the last 7 days" or "top 5 customers by revenue"\n' +
'• "Show analytics for MET-1000-2023" (or a customer name)\n' +
'• "Any critical issues?", "data loggers online?", "pending API requests?"';

// ---------------------------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------------------------

export function processAIQuery(rawQuery: string, meters: Meter[], transactions: Txn[]): string {
  const query = decodeEntities(String(rawQuery ?? '')).replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
  const q = query.toLowerCase().replace(/[?!.,]+$/g, '');
  const txns = Array.isArray(transactions) ? transactions : [];

  if (!q) return HELP_TEXT;

  // Conversational openers
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(q) && q.split(' ').length <= 4) {
    return `Hello! I can see ${meters.length.toLocaleString()} meters, ${txns.length.toLocaleString()} payment transactions and your data loggers, commands and API requests. What would you like to know?`;
  }
  if (/^(thanks|thank you|cheers|great|ok|okay)\b/.test(q) && q.split(' ').length <= 4) {
    return 'You are welcome! Ask me anything else about your meters, payments or devices.';
  }
  if (has(q, 'what can you do', 'help me', 'what can i ask', 'how do i use') || q === 'help') {
    return HELP_TEXT;
  }

  // A specific meter / customer always wins
  const single = analyzeMeterByQuery(query, meters, txns);
  if (single) return single;

  const f = parseFilters(q, meters);

  // Other data sources
  if (has(q, 'data logger', 'datalogger', 'logger', '3-phase', '3 phase', 'three phase', 'three-phase', 'power quality')) {
    return answerDataLoggers(q);
  }
  if (has(q, 'command', 'switch on', 'switch off', 'switch-on', 'switch-off', 'remote control', 'disconnect command')) {
    return answerCommands(q, meters);
  }
  if (has(q, 'api request', 'api access', 'api key', 'api user', 'api client')) {
    return answerApiAccess(q);
  }

  // Maintenance / diagnostics
  if (has(q, 'issue', 'problem', 'critical', 'diagnos', 'fault', 'alert', 'anomal', 'error', 'faulty', 'attention', 'need repair', 'maintenance')) {
    return answerDiagnostics(q, f, meters);
  }

  // Electrical readings & signal
  const reading = answerReportMetric(q, f, meters);
  if (reading) return reading;
  const signal = answerSignal(q, f, meters);
  if (signal) return signal;

  // Money in: payments / revenue / transactions
  const moneyIn = has(q, 'revenue', 'payment', 'paid', 'transaction', 'income', 'sales', 'earn', 'collected', 'collection', 'token purchase', 'spent', 'spend', 'money');
  if (moneyIn) return answerTransactions(q, f, meters, txns);

  // Balances / credit / debt
  if (has(q, 'balance', 'credit', 'outstanding', 'debt', 'owe', 'owing', 'arrears', 'bill')) {
    const bf = !f.type && has(q, 'outstanding', 'owe', 'owing', 'debt', 'arrears') ? { ...f, type: 'postpaid' as const } : f;
    return answerMetric(q, 'balance', bf, meters);
  }

  // Consumption
  if (has(q, 'consum', 'usage', 'kwh', 'energy', 'units used', 'load')) {
    if (has(q, 'predict', 'forecast', 'next week', 'next 7', 'next month', 'tomorrow', 'expected', 'will be')) {
      const total = meters.reduce((s, m) => s + num(m.consumption), 0);
      return answerForecast(meters, total);
    }
    return answerMetric(q, 'consumption', f, meters);
  }

  // Breakdowns
  if (has(q, 'transformer') && !f.transformer) return breakdown(meters, (m) => m.transformer, 'Transformer distribution');
  if (has(q, 'customer type', 'types of customer', 'residential', 'commercial', 'industrial') && !f.customerType) {
    return breakdown(meters, (m) => m.customerType, 'Customer types');
  }
  if (has(q, 'location', 'where', 'area', 'region', 'town') && !f.location) {
    return breakdown(meters, (m) => m.location, 'Meters by location');
  }
  if (has(q, 'tariff', 'rate') && has(q, 'tariff')) {
    return breakdown(meters, (m) => (m.tariffRate ? `Ksh ${m.tariffRate}/kWh` : undefined), 'Tariff rates');
  }

  // Meter counts / status / lists (also handles "prepaid vs postpaid")
  if (has(q, 'meter', 'meters', 'customer', 'customers', 'account', 'status', 'offline', 'online', 'active', 'disconnect', 'how many', 'count', 'number of', 'list', 'show', 'which', 'prepaid', 'postpaid') || hasFilters(f)) {
    if (!hasFilters(f) && has(q, 'prepaid', 'postpaid', 'distribution', 'split', 'breakdown', 'versus', ' vs ')) {
      return `Meter Distribution:\n${['prepaid', 'postpaid']
        .map((t) => `- ${t.charAt(0).toUpperCase()}${t.slice(1)}: ${meters.filter((m) => m.type === t).length.toLocaleString()} meters`)
        .join('\n')}\n- Total: ${meters.length.toLocaleString()} meters`;
    }
    return answerMeterStatus(q, f, meters);
  }

  if (has(q, 'forecast', 'predict', 'trend')) {
    return answerForecast(meters, meters.reduce((s, m) => s + num(m.consumption), 0));
  }

  if (has(q, 'summary', 'overview', 'everything', 'system', 'report', 'snapshot', 'status of')) {
    return buildSystemSnapshot(meters, txns);
  }

  // Fallback: a real system snapshot plus examples
  return `${buildSystemSnapshot(meters, txns)}\n\nI didn't match that to a specific question, so here is the overall picture. ${HELP_TEXT}`;
}
