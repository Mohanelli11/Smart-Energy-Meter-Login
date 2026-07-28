import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer } from
'recharts';
import { CalendarIcon } from 'lucide-react';
interface ConsumptionGraphProps {
  data: Array<{
    time: string;
    consumption: number;
    date?: string;
  }>;
  title?: string;
  height?: number;
}
export function ConsumptionGraph({
  data,
  title = 'Energy Consumption',
  height = 300
}: ConsumptionGraphProps) {
  const defaultToDate = new Date();
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultFromDate.getDate() - 6);
  const [dateFrom, setDateFrom] = useState(
    defaultFromDate.toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(
    defaultToDate.toISOString().split('T')[0]
  );
  const filteredData = useMemo(() => {
    if (!dateFrom || !dateTo) return data;
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    return data.filter((item) => {
      if (!item.date) return true;
      const itemDate = new Date(item.date);
      return itemDate >= from && itemDate <= to;
    });
  }, [data, dateFrom, dateTo]);
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center space-x-2 text-sm">
          <CalendarIcon className="h-4 w-4 text-gray-500" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis
            label={{
              value: 'kWh',
              angle: -90,
              position: 'insideLeft'
            }} />
          
          <Tooltip />
          <Legend />
          <Bar
            dataKey="consumption"
            fill="#3B82F6"
            name="Consumption (kWh)"
            radius={[8, 8, 0, 0]} />
          
        </BarChart>
      </ResponsiveContainer>
    </div>);

}