import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface StatusCount {
  name: string;
  value: number;
  color: string;
}

interface InvoiceStatusChartProps {
  data: {
    draft: number;
    sent: number;
    viewed: number;
    paid: number;
    overdue: number;
  };
}

const InvoiceStatusChart: React.FC<InvoiceStatusChartProps> = ({ data }) => {
  const chartData: StatusCount[] = [
    { name: 'Draft', value: data.draft, color: '#94a3b8' },
    { name: 'Sent', value: data.sent, color: '#3b82f6' },
    { name: 'Viewed', value: data.viewed, color: '#10b981' },
    { name: 'Unpaid', value: data.unpaid || 0, color: '#f59e0b' },
    { name: 'Paid', value: data.paid, color: '#22c55e' },
    { name: 'Overdue', value: data.overdue, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const totalInvoices = chartData.reduce((sum, item) => sum + item.value, 0);
  const hasData = totalInvoices > 0;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Invoice Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No invoice data available
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} invoices`, 'Count']}
                  labelFormatter={(name) => `Status: ${name}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 inline-block mr-2 rounded-full bg-gray-400"></span>
            <span>Total Invoices: {totalInvoices}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceStatusChart;
