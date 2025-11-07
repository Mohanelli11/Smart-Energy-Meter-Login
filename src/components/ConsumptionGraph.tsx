import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  return <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis label={{
          value: 'kWh',
          angle: -90,
          position: 'insideLeft'
        }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="consumption" fill="#3B82F6" name="Consumption (kWh)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>;
}