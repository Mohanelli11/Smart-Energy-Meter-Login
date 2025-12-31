import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSignIcon, UsersIcon, TrendingUpIcon } from 'lucide-react';
import { RevenueInsight } from '../utils/aiService';
interface RevenueAnalyticsProps {
  data: RevenueInsight;
}
export function RevenueAnalytics({
  data
}: RevenueAnalyticsProps) {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const topCustomerData = data.topCustomers.map(c => ({
    name: c.name.split(' ')[0],
    value: c.amount,
    fullName: c.name
  }));
  return <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <DollarSignIcon className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            Ksh {data.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">All time transactions</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">
              Avg. Per Customer
            </h3>
            <UsersIcon className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            Ksh{' '}
            {data.averagePerCustomer.toLocaleString(undefined, {
            maximumFractionDigits: 0
          })}
          </p>
          <p className="text-xs text-gray-500 mt-1">Revenue per active meter</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">
              Projected Growth
            </h3>
            <TrendingUpIcon className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600">
            +{data.growthRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Next month projection</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Revenue Generators
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomerData} layout="vertical" margin={{
              top: 5,
              right: 30,
              left: 40,
              bottom: 5
            }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{
                fontSize: 12
              }} />
                <Tooltip formatter={(value: number) => [`Ksh ${value.toLocaleString()}`, 'Revenue']} cursor={{
                fill: '#F3F4F6'
              }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={30}>
                  {topCustomerData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Distribution
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={topCustomerData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value">
                  {topCustomerData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => `Ksh ${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Projected Revenue for Next Period:{' '}
              <span className="font-bold text-gray-900">
                Ksh{' '}
                {data.projectedRevenue.toLocaleString(undefined, {
                maximumFractionDigits: 0
              })}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>;
}