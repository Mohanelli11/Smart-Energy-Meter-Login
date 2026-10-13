import {
  SignalIcon,
  WifiIcon,
  ActivityIcon,
  ZapIcon,
  TrendingUpIcon } from
'lucide-react';
import { MeterReport } from '../utils/meterStorage';
interface MeterReportsProps {
  report: MeterReport | undefined;
  meterType: 'prepaid' | 'postpaid';
}
export function MeterReports({ report }: MeterReportsProps) {
  if (!report) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <WifiIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-gray-700 mb-2">
            No Reports Available
          </h4>
          <p className="text-sm text-gray-600">
            This meter has not sent any reports yet. Reports are automatically
            transmitted via GSM/NB-IoT communication modules.
          </p>
        </div>
      </div>);

  }
  const reportDate = new Date(report.timestamp);
  const isRecent = Date.now() - reportDate.getTime() < 3600000; // Less than 1 hour old
  const getSignalColor = (strength: string) => {
    switch (strength) {
      case 'Excellent':
        return 'text-green-600 bg-green-100';
      case 'Good':
        return 'text-blue-600 bg-blue-100';
      case 'Fair':
        return 'text-yellow-600 bg-yellow-100';
      case 'Poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };
  const getStatusColor = (status: string) => {
    return status === 'online' ?
    'text-green-600 bg-green-100' :
    'text-red-600 bg-red-100';
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-semibold text-gray-800 flex items-center">
          <ActivityIcon className="h-5 w-5 mr-2 text-gray-600" />
          Last Meter Report (GSM)
        </h4>
        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(report.status)}`}>
            
            {report.status.toUpperCase()}
          </span>
          {isRecent &&
          <span className="px-3 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-600">
              RECENT
            </span>
          }
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Report Time</p>
            <p className="text-sm font-medium text-gray-900">
              {reportDate.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">GSM Signal</p>
            <div className="flex items-center">
              <SignalIcon className="h-4 w-4 mr-1 text-gray-500" />
              <span
                className={`px-2 py-1 text-xs rounded-full font-medium ${getSignalColor(report.signalStrength)}`}>
                
                {report.signalStrength}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Communication</p>
            <p className="text-sm font-medium text-gray-900">NB-IoT / GSM</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600">Voltage</p>
            <ZapIcon className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {report.voltage.toFixed(1)} V
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {report.voltage >= 220 && report.voltage <= 240 ?
            'Normal' :
            'Out of range'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600">Current</p>
            <ActivityIcon className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {report.current.toFixed(2)} A
          </p>
          <p className="text-xs text-gray-500 mt-1">Instantaneous</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600">Power Factor</p>
            <TrendingUpIcon className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {report.powerFactor.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {report.powerFactor >= 0.9 ? 'Good' : 'Fair'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600">Frequency</p>
            <ActivityIcon className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {report.frequency.toFixed(1)} Hz
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {report.frequency >= 49.5 && report.frequency <= 50.5 ?
            'Normal' :
            'Unstable'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600">Consumption</p>
            <TrendingUpIcon className="h-4 w-4 text-orange-500" />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {report.consumption.toFixed(2)} kWh
          </p>
          <p className="text-xs text-gray-500 mt-1">At report time</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600">Data Age</p>
            <SignalIcon className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {Math.floor((Date.now() - reportDate.getTime()) / 60000)} min
          </p>
          <p className="text-xs text-gray-500 mt-1">Since last report</p>
        </div>
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Meter reports are automatically transmitted via
          GSM/NB-IoT communication modules installed onsite. Report frequency
          depends on meter configuration (typically every 15-30 minutes).
        </p>
      </div>
    </div>);

}