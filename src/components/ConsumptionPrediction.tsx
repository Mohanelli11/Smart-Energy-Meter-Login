import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUpIcon, CalendarIcon, AlertTriangleIcon } from 'lucide-react';
import { ConsumptionTrend } from '../utils/aiService';
interface ConsumptionPredictionProps {
  data: ConsumptionTrend[];
}
export function ConsumptionPrediction({
  data
}: ConsumptionPredictionProps) {
  const historicalData = data.filter(d => d.predicted === undefined);
  const forecastData = data.filter(d => d.predicted !== undefined);
  const currentUsage = historicalData[historicalData.length - 1]?.actual || 0;
  const predictedUsage = forecastData[0]?.predicted || 0;
  const trend = (predictedUsage - currentUsage) / currentUsage * 100;
  return <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">
              Current Daily Usage
            </h3>
            <TrendingUpIcon className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {currentUsage.toFixed(1)} kWh
          </p>
          <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">
              7-Day Forecast
            </h3>
            <CalendarIcon className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {forecastData.reduce((sum, d) => sum + (d.predicted || 0), 0).toFixed(1)}{' '}
            kWh
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Predicted total next 7 days
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">
              Trend Analysis
            </h3>
            <div className={`h-2 w-2 rounded-full ${trend >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          <p className={`text-2xl font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}
            {trend.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Expected change vs today</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Consumption Forecast (AI Model)
            </h3>
            <p className="text-sm text-gray-500">
              Historical data (30 days) vs. Predictive Analysis (7 days)
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>{' '}
              Actual
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-1"></span>{' '}
              Predicted
            </span>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0
          }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{
              fontSize: 12,
              fill: '#6B7280'
            }} axisLine={false} tickLine={false} />
              <YAxis tick={{
              fontSize: 12,
              fill: '#6B7280'
            }} axisLine={false} tickLine={false} label={{
              value: 'kWh',
              angle: -90,
              position: 'insideLeft',
              style: {
                fill: '#9CA3AF'
              }
            }} />
              <Tooltip contentStyle={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }} formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Consumption']} />
              <Area type="monotone" dataKey="actual" stroke="#3B82F6" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} name="Actual Usage" />
              <Area type="monotone" dataKey="predicted" stroke="#8B5CF6" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPredicted)" strokeWidth={2} name="Forecast" />
              <Area type="monotone" dataKey="upperBound" stroke="transparent" fill="#8B5CF6" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md p-3 flex items-start">
          <AlertTriangleIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            <strong>AI Insight:</strong> Consumption is predicted to increase by{' '}
            {Math.abs(trend).toFixed(1)}% over the next week. This follows a
            seasonal pattern observed in previous cycles. Ensure grid stability
            for peak hours (18:00 - 21:00).
          </p>
        </div>
      </div>
    </div>;
}