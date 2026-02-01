import React, { useEffect, useState } from 'react';
import {
  ZapIcon,
  LogOutIcon,
  TrendingUpIcon,
  BoltIcon,
  DollarSignIcon,
  ClockIcon,
  ActivityIcon } from
'lucide-react';
import { ConsumptionGraph } from './ConsumptionGraph';
interface MeterReading {
  timestamp: Date;
  voltage: number;
  current: number;
  units: number;
  balance: number;
}
interface Payment {
  date: string;
  amount: string;
  units: string;
  transactionId: string;
}
interface IndividualMeterViewProps {
  meter: any;
  onLogout: () => void;
}
export function IndividualMeterView({
  meter,
  onLogout
}: IndividualMeterViewProps) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [currentReading, setCurrentReading] = useState<MeterReading>({
    timestamp: new Date(),
    voltage: 230 + Math.random() * 10,
    current: 5 + Math.random() * 15,
    units: parseFloat(meter.consumption),
    balance: parseFloat(meter.balance)
  });
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [consumptionData, setConsumptionData] = useState<any[]>([]);
  // Generate payment history
  const paymentHistory: Payment[] = [
  {
    date: '10 Jan 2025',
    amount: '1,500.00',
    units: '96.77',
    transactionId: 'TXN-001'
  },
  {
    date: '25 Dec 2024',
    amount: '2,000.00',
    units: '129.03',
    transactionId: 'TXN-002'
  },
  {
    date: '15 Dec 2024',
    amount: '1,200.00',
    units: '77.42',
    transactionId: 'TXN-003'
  }];

  // Simulate meter readings every 10 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        const newReading: MeterReading = {
          timestamp: new Date(),
          voltage: 220 + Math.random() * 20,
          current: 5 + Math.random() * 15,
          units: currentReading.units + Math.random() * 0.5,
          balance: currentReading.balance - Math.random() * 2 // Decrease balance
        };
        setCurrentReading(newReading);
        setReadings((prev) => [...prev, newReading].slice(-144)); // Keep last 24 hours (144 readings)
      },
      10 * 60 * 1000
    ); // 10 minutes
    return () => clearInterval(interval);
  }, [currentReading]);
  // Generate consumption data for selected date
  useEffect(() => {
    const data = [];
    const selected = new Date(selectedDate);
    const isToday = selected.toDateString() === new Date().toDateString();
    if (isToday && readings.length > 0) {
      // Use actual readings for today
      readings.forEach((reading) => {
        data.push({
          time: reading.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          consumption: reading.units
        });
      });
    } else {
      // Generate historical data for other dates
      for (let hour = 0; hour < 24; hour++) {
        for (let min = 0; min < 60; min += 10) {
          data.push({
            time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
            consumption: 10 + Math.random() * 15 + hour * 0.5
          });
        }
      }
    }
    setConsumptionData(data);
  }, [selectedDate, readings]);
  const getMeterStatus = () => {
    if (currentReading.balance > 50)
    return {
      text: 'Active',
      color: 'bg-green-100 text-green-800'
    };
    if (currentReading.balance > 0)
    return {
      text: 'Low Balance',
      color: 'bg-yellow-100 text-yellow-800'
    };
    return {
      text: 'Disconnected',
      color: 'bg-red-100 text-red-800'
    };
  };
  const status = getMeterStatus();
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <ZapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Meter Dashboard
                </h1>
                <p className="text-sm text-gray-600">{meter.accountNo}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">

              <LogOutIcon className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Customer Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Customer Name</p>
              <p className="text-lg font-semibold text-gray-900">
                {meter.customerName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Meter Number</p>
              <p className="text-lg font-semibold text-gray-900">
                {meter.meterNo}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="text-lg font-semibold text-gray-900">
                {meter.location}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${status.color}`}>

                {status.text}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Readings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Voltage</p>
              <BoltIcon className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {currentReading.voltage.toFixed(1)} V
            </p>
            <p className="text-xs text-gray-500 mt-1">Normal: 220-240V</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Current</p>
              <ActivityIcon className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {currentReading.current.toFixed(2)} A
            </p>
            <p className="text-xs text-gray-500 mt-1">Instantaneous</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Units Consumed</p>
              <TrendingUpIcon className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {currentReading.units.toFixed(2)} kWh
            </p>
            <p className="text-xs text-gray-500 mt-1">Total consumption</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Balance</p>
              <DollarSignIcon className="h-5 w-5 text-purple-500" />
            </div>
            <p
              className={`text-2xl font-bold ${currentReading.balance > 50 ? 'text-green-600' : 'text-red-600'}`}>

              Ksh {currentReading.balance.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Remaining credit</p>
          </div>
        </div>

        {/* Last Update Time */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
            <p className="text-sm text-blue-800">
              Last reading: {currentReading.timestamp.toLocaleString()}
              <span className="ml-2 text-blue-600 font-medium">
                (Updates every 10 minutes)
              </span>
            </p>
          </div>
        </div>

        {/* Consumption Graph */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Consumption Overview</h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

            </div>
            <ConsumptionGraph
              data={consumptionData}
              title={`Energy Consumption - ${new Date(
                selectedDate
              ).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}`}
              height={350} />

          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Payment History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount (Ksh)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Units (kWh)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.map((payment, index) =>
                  <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {payment.transactionId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {payment.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.units}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>);

}