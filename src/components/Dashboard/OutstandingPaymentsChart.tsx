import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface OutstandingPayment {
  name: string;
  amount: number;
  daysOverdue: number;
}

interface OutstandingPaymentsChartProps {
  data: OutstandingPayment[];
}

const OutstandingPaymentsChart: React.FC<OutstandingPaymentsChartProps> = ({ data }) => {
  const hasData = data.length > 0;
  
  // Sort data by days overdue (descending)
  const sortedData = [...data].sort((a, b) => b.daysOverdue - a.daysOverdue);
  
  // Calculate total outstanding amount
  const totalOutstanding = data.reduce((sum, item) => sum + item.amount, 0);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-sm">Amount: ${payload[0].value.toLocaleString()}</p>
          <p className="text-sm text-red-500">
            {payload[0].payload.daysOverdue} days overdue
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Outstanding Payments</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No outstanding payments
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedData.slice(0, 5)} // Show top 5 outstanding payments
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100}
                  tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="amount" 
                  fill="#ef4444" 
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4 text-sm">
          <div className="flex justify-between">
            <span>Total Outstanding:</span>
            <span className="font-medium">${totalOutstanding.toLocaleString()}</span>
          </div>
          {hasData && (
            <div className="flex justify-between mt-1">
              <span>Highest Overdue:</span>
              <span className="font-medium text-red-500">
                {sortedData[0]?.daysOverdue} days
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OutstandingPaymentsChart;
