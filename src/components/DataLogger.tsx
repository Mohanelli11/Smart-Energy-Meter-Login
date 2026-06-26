import React, { useEffect, useMemo, useState } from 'react';
import {
  GaugeIcon,
  ActivityIcon,
  ZapIcon,
  CpuIcon,
  HardDriveIcon,
  RadioIcon,
  PlusCircleIcon,
  XIcon,
  ShieldAlertIcon,
  CheckCircle2Icon,
  WifiIcon,
  WifiOffIcon,
  TrendingUpIcon,
  BatteryChargingIcon,
  WavesIcon } from
'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend } from
'recharts';
interface LoggerDevice {
  id: string;
  name: string;
  serialNumber: string;
  location: string;
  gsmNumber: string;
  online: boolean;
  lastSync: string;
}
interface DataLoggerProps {
  isAdmin: boolean;
}
const STORAGE_KEY = 'motech_data_loggers';
const loadLoggers = (): LoggerDevice[] | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};
const saveLoggers = (loggers: LoggerDevice[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggers));
  } catch (error) {
    console.error('Failed to save data loggers:', error);
  }
};
const seedLoggers = (): LoggerDevice[] => [
{
  id: 'DL-0001',
  name: 'MoTech 3-Phase Logger A',
  serialNumber: 'MT3PL-2026-0001',
  location: 'Nairobi West Substation',
  gsmNumber: '+254700112233',
  online: true,
  lastSync: new Date().toLocaleString()
},
{
  id: 'DL-0002',
  name: 'MoTech 3-Phase Logger B',
  serialNumber: 'MT3PL-2026-0002',
  location: 'Thika Industrial Feeder',
  gsmNumber: '+254700445566',
  online: false,
  lastSync: new Date(Date.now() - 1000 * 60 * 45).toLocaleString()
}];

// Simulated live telemetry generators
const rnd = (min: number, max: number) => min + Math.random() * (max - min);
export function DataLogger({ isAdmin }: DataLoggerProps) {
  // Admin gate
  if (!isAdmin) {
    return (
      <div className="bg-white p-10 rounded-lg shadow text-center">
        <ShieldAlertIcon className="h-14 w-14 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Admin Access Only
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          The 3-Phase Data Logger section is restricted to administrators.
          Please contact your system administrator if you require access.
        </p>
      </div>);

  }
  const [loggers, setLoggers] = useState<LoggerDevice[]>(() => {
    const stored = loadLoggers();
    return stored && stored.length > 0 ? stored : seedLoggers();
  });
  useEffect(() => {
    saveLoggers(loggers);
  }, [loggers]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    serialNumber: '',
    location: '',
    gsmNumber: ''
  });
  const [formError, setFormError] = useState('');
  // Live telemetry state
  const [telemetry, setTelemetry] = useState(() => ({
    voltage: {
      L1: rnd(228, 235),
      L2: rnd(228, 235),
      L3: rnd(228, 235)
    },
    current: {
      L1: rnd(8, 16),
      L2: rnd(8, 16),
      L3: rnd(8, 16)
    },
    powerFactor: rnd(0.9, 0.98),
    frequency: rnd(49.9, 50.1),
    thd: rnd(2, 5),
    energy: 12480.5,
    power: rnd(9, 14),
    dips: 2,
    swells: 1
  }));
  // Rolling chart data (last 12 points)
  const [series, setSeries] = useState(() => {
    const arr = [];
    for (let i = 11; i >= 0; i--) {
      arr.push({
        t: `-${i * 5}s`,
        L1: rnd(228, 235),
        L2: rnd(228, 235),
        L3: rnd(228, 235),
        currentL1: rnd(8, 16)
      });
    }
    return arr;
  });
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        voltage: {
          L1: rnd(226, 236),
          L2: rnd(226, 236),
          L3: rnd(226, 236)
        },
        current: {
          L1: rnd(7, 17),
          L2: rnd(7, 17),
          L3: rnd(7, 17)
        },
        powerFactor: rnd(0.88, 0.99),
        frequency: rnd(49.85, 50.15),
        thd: rnd(1.8, 5.2),
        energy: prev.energy + rnd(0.01, 0.08),
        power: rnd(8.5, 14.5),
        dips: prev.dips + (Math.random() > 0.92 ? 1 : 0),
        swells: prev.swells + (Math.random() > 0.95 ? 1 : 0)
      }));
      setSeries((prev) => {
        const next = [
        ...prev.slice(1),
        {
          t: 'now',
          L1: rnd(226, 236),
          L2: rnd(226, 236),
          L3: rnd(226, 236),
          currentL1: rnd(7, 17)
        }];

        return next.map((p, i) => ({
          ...p,
          t: i === next.length - 1 ? 'now' : `-${(next.length - 1 - i) * 5}s`
        }));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  // Load profile (24h) — static representative shape
  const loadProfile = useMemo(() => {
    const hours = [];
    for (let h = 0; h < 24; h++) {
      // Two peaks: morning and evening
      const base =
      6 +
      8 * Math.exp(-Math.pow(h - 8, 2) / 8) +
      12 * Math.exp(-Math.pow(h - 19, 2) / 6) +
      rnd(0, 1.5);
      hours.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        kWh: parseFloat(base.toFixed(2))
      });
    }
    return hours;
  }, []);
  const handleAddLogger = () => {
    if (
    !form.name.trim() ||
    !form.serialNumber.trim() ||
    !form.location.trim() ||
    !form.gsmNumber.trim())
    {
      setFormError('All fields are required.');
      return;
    }
    const newLogger: LoggerDevice = {
      id: `DL-${(loggers.length + 1).toString().padStart(4, '0')}`,
      name: form.name.trim(),
      serialNumber: form.serialNumber.trim(),
      location: form.location.trim(),
      gsmNumber: form.gsmNumber.trim(),
      online: true,
      lastSync: new Date().toLocaleString()
    };
    setLoggers([newLogger, ...loggers]);
    setForm({
      name: '',
      serialNumber: '',
      location: '',
      gsmNumber: ''
    });
    setFormError('');
    setShowAddModal(false);
  };
  const features = [
  {
    icon: <GaugeIcon className="h-5 w-5" />,
    label: 'Precision Metering',
    desc: 'Class 0.5S accuracy across all three phases'
  },
  {
    icon: <HardDriveIcon className="h-5 w-5" />,
    label: 'SD Card Logging',
    desc: 'Local high-capacity time-series storage'
  },
  {
    icon: <RadioIcon className="h-5 w-5" />,
    label: 'GSM Connectivity',
    desc: 'Remote data transmission over NB-IoT/GSM'
  },
  {
    icon: <ActivityIcon className="h-5 w-5" />,
    label: 'Real-Time Monitoring',
    desc: 'Live parameter streaming & alerts'
  }];

  const records = [
  {
    icon: <TrendingUpIcon className="h-5 w-5 text-blue-600" />,
    label: 'Daily Consumption',
    value: '312.4 kWh'
  },
  {
    icon: <ZapIcon className="h-5 w-5 text-yellow-600" />,
    label: 'Peak Demand',
    value: '24.8 kW @ 19:15'
  },
  {
    icon: <BatteryChargingIcon className="h-5 w-5 text-green-600" />,
    label: 'Load Trends',
    value: 'Stable · +3.1% wk'
  },
  {
    icon: <WavesIcon className="h-5 w-5 text-purple-600" />,
    label: 'Power Quality Events',
    value: `${telemetry.dips + telemetry.swells} this period`
  }];

  return (
    <div className="space-y-6">
      {/* Intro / capabilities */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <CpuIcon className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                MoTech 3-Phase Data Logger
              </h2>
              <p className="text-gray-500 mt-1 max-w-2xl">
                Industrial-grade three-phase power monitoring with precision
                metering, on-device logging, and real-time remote telemetry.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            Add Data Logger
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {features.map((f) =>
          <div
            key={f.label}
            className="border border-gray-200 rounded-lg p-4 flex flex-col">
            
              <div className="flex items-center text-blue-600 mb-2">
                <span className="p-2 bg-blue-50 rounded-lg mr-2">{f.icon}</span>
                <CheckCircle2Icon className="h-4 w-4 text-green-500 ml-auto" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{f.label}</p>
              <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
            </div>
          )}
        </div>
      </section>

      {/* Registered loggers */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Registered Loggers
        </h3>
        {loggers.length === 0 ?
        <p className="text-gray-500 text-sm">
            No data loggers registered yet. Add one to begin monitoring.
          </p> :

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                'Device',
                'Serial No.',
                'Location',
                'GSM Number',
                'Status',
                'Last Sync'].
                map((h) =>
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  
                      {h}
                    </th>
                )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loggers.map((l) =>
              <tr key={l.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{l.name}</div>
                      <div className="text-xs text-gray-400">{l.id}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {l.serialNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {l.location}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {l.gsmNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {l.online ?
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                          <WifiIcon className="h-3 w-3 mr-1" /> Online
                        </span> :

                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                          <WifiOffIcon className="h-3 w-3 mr-1" /> Offline
                        </span>
                  }
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {l.lastSync}
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </section>

      {/* Live monitored parameters */}
      <section>
        <div className="flex items-center mb-4">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Real-Time Monitoring
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Voltage (3-Phase)"
            value={`${telemetry.voltage.L1.toFixed(0)} / ${telemetry.voltage.L2.toFixed(0)} / ${telemetry.voltage.L3.toFixed(0)} V`}
            sub="L1 / L2 / L3"
            accent="blue" />
          
          <MetricCard
            title="Current (3-Phase)"
            value={`${telemetry.current.L1.toFixed(1)} / ${telemetry.current.L2.toFixed(1)} / ${telemetry.current.L3.toFixed(1)} A`}
            sub="L1 / L2 / L3"
            accent="indigo" />
          
          <MetricCard
            title="Power Factor"
            value={telemetry.powerFactor.toFixed(3)}
            sub="System average"
            accent="green" />
          
          <MetricCard
            title="Frequency"
            value={`${telemetry.frequency.toFixed(2)} Hz`}
            sub="Grid frequency"
            accent="yellow" />
          
          <MetricCard
            title="Harmonics (THD)"
            value={`${telemetry.thd.toFixed(2)} %`}
            sub="Total harmonic distortion"
            accent="purple" />
          
          <MetricCard
            title="Energy Consumption"
            value={`${telemetry.energy.toFixed(1)} kWh`}
            sub="Cumulative"
            accent="blue" />
          
          <MetricCard
            title="Active Power"
            value={`${telemetry.power.toFixed(1)} kW`}
            sub="Instantaneous"
            accent="indigo" />
          
          <MetricCard
            title="Dips & Swells"
            value={`${telemetry.dips} / ${telemetry.swells}`}
            sub="Dips / Swells events"
            accent="red" />
          
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            3-Phase Voltage (live)
          </h3>
          <div
            style={{
              width: '100%',
              height: 260
            }}>
            
            <ResponsiveContainer>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="t"
                  tick={{
                    fontSize: 11
                  }} />
                
                <YAxis
                  domain={[220, 240]}
                  tick={{
                    fontSize: 11
                  }} />
                
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="L1"
                  stroke="#2563eb"
                  dot={false}
                  isAnimationActive={false} />
                
                <Line
                  type="monotone"
                  dataKey="L2"
                  stroke="#16a34a"
                  dot={false}
                  isAnimationActive={false} />
                
                <Line
                  type="monotone"
                  dataKey="L3"
                  stroke="#9333ea"
                  dot={false}
                  isAnimationActive={false} />
                
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Load Profile (24h consumption)
          </h3>
          <div
            style={{
              width: '100%',
              height: 260
            }}>
            
            <ResponsiveContainer>
              <BarChart data={loadProfile}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="hour"
                  tick={{
                    fontSize: 9
                  }}
                  interval={2} />
                
                <YAxis
                  tick={{
                    fontSize: 11
                  }} />
                
                <Tooltip />
                <Bar dataKey="kWh" fill="#2563eb" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Records */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Logger Records
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {records.map((r) =>
          <div
            key={r.label}
            className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
            
              <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                {r.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500">{r.label}</p>
                <p className="font-semibold text-gray-900">{r.value}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Add Logger Modal */}
      {showAddModal &&
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Add Data Logger
              </h3>
              <button
              onClick={() => setShowAddModal(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close">
              
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {formError &&
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {formError}
                </p>
            }
              <FormField
              label="Device Name"
              value={form.name}
              onChange={(v) =>
              setForm({
                ...form,
                name: v
              })
              }
              placeholder="MoTech 3-Phase Logger C" />
            
              <FormField
              label="Serial Number"
              value={form.serialNumber}
              onChange={(v) =>
              setForm({
                ...form,
                serialNumber: v
              })
              }
              placeholder="MT3PL-2026-0003" />
            
              <FormField
              label="Location"
              value={form.location}
              onChange={(v) =>
              setForm({
                ...form,
                location: v
              })
              }
              placeholder="Kasarani Feeder" />
            
              <FormField
              label="GSM SIM Number"
              value={form.gsmNumber}
              onChange={(v) =>
              setForm({
                ...form,
                gsmNumber: v
              })
              }
              placeholder="+254700000000" />
            
            </div>
            <div className="flex justify-end space-x-3 p-5 border-t border-gray-200">
              <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              
                Cancel
              </button>
              <button
              onClick={handleAddLogger}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              
                Add Logger
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}
function MetricCard({
  title,
  value,
  sub,
  accent





}: {title: string;value: string;sub: string;accent: 'blue' | 'indigo' | 'green' | 'yellow' | 'purple' | 'red';}) {
  const accents: Record<string, string> = {
    blue: 'border-l-blue-500',
    indigo: 'border-l-indigo-500',
    green: 'border-l-green-500',
    yellow: 'border-l-yellow-500',
    purple: 'border-l-purple-500',
    red: 'border-l-red-500'
  };
  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-l-4 ${accents[accent]}`}>
      
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-lg font-bold text-gray-900 mt-1 tabular-nums">
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>);

}
function FormField({
  label,
  value,
  onChange,
  placeholder





}: {label: string;value: string;onChange: (v: string) => void;placeholder?: string;}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      
    </div>);

}