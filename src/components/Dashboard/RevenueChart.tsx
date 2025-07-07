import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { MonthlyRevenue } from '../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RevenueChartProps {
  data: MonthlyRevenue[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Check if we have any non-zero values
  const hasData = data.some(item => item.amount > 0);

  // Calculate total revenue
  const totalRevenue = data.reduce((sum, item) => sum + item.amount, 0);

  // Calculate average monthly revenue
  const avgMonthlyRevenue = hasData ? totalRevenue / data.filter(item => item.amount > 0).length : 0;

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className={`text-sm text-${entry.color}`} style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
          <p className="text-sm font-medium mt-1 pt-1 border-t border-gray-200">
            Total: ${payload.reduce((sum: number, entry: any) => sum + entry.value, 0).toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Revenue Overview</CardTitle>
        <div className="flex items-center space-x-2">
          <button
            className={`text-xs px-2 py-1 rounded transition-colors ${showBreakdown
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            onClick={() => setShowBreakdown(!showBreakdown)}
          >
            {showBreakdown ? 'Hide Breakdown' : 'Show Breakdown'}
          </button>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Total: ${totalRevenue.toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No revenue data available for this period
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorUnpaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorDraft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />

                {showBreakdown ? (
                  <>
                    <Area
                      type="monotone"
                      dataKey="paid"
                      name="Paid"
                      stackId="1"
                      stroke="#22c55e"
                      fill="url(#colorPaid)"
                    />
                    <Area
                      type="monotone"
                      dataKey="unpaid"
                      name="Unpaid"
                      stackId="1"
                      stroke="#f59e0b"
                      fill="url(#colorUnpaid)"
                    />
                    <Area
                      type="monotone"
                      dataKey="overdue"
                      name="Overdue"
                      stackId="1"
                      stroke="#ef4444"
                      fill="url(#colorOverdue)"
                    />
                    <Area
                      type="monotone"
                      dataKey="draft"
                      name="Draft"
                      stackId="1"
                      stroke="#94a3b8"
                      fill="url(#colorDraft)"
                    />
                    <Legend />
                  </>
                ) : (
                  <Area
                    type="monotone"
                    dataKey="amount"
                    name="Total"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">Average Monthly</div>
            <div className="font-medium">${avgMonthlyRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">Projected Annual</div>
            <div className="font-medium">${(avgMonthlyRevenue * 12).toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;