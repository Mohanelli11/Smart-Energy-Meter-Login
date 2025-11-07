import React from 'react';
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
}
export function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  trend
}: StatsCardProps) {
  return <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
      </div>
      {trend && <div className="mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <span className={`${trend.isPositive ? 'text-green-500' : 'text-red-500'} mr-1`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
            <span>{trend.label}</span>
          </div>
        </div>}
    </div>;
}