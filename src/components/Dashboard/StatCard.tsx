import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: {
    value: string;
    type: 'increase' | 'decrease';
  };
  trend?: number[];
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  trend,
  className = '',
}) => {
  return (
    <Card className={`transition-all duration-300 hover:shadow-md ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h4 className="mt-2 text-3xl font-semibold text-gray-900">{value}</h4>
            
            {change && (
              <div className="mt-2 flex items-center">
                <span
                  className={`flex items-center text-xs font-medium ${
                    change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {change.type === 'increase' ? (
                    <ArrowUp size={16} className="mr-1" />
                  ) : (
                    <ArrowDown size={16} className="mr-1" />
                  )}
                  {change.value}
                </span>
                <span className="text-xs text-gray-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
          
          <div className="p-3 rounded-full bg-blue-50 text-blue-900">
            {icon}
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 h-10">
            <div className="flex items-end justify-between h-full">
              {trend.map((value, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-200 rounded-t"
                  style={{
                    height: `${value}%`,
                    backgroundColor: i === trend.length - 1 ? '#1E3A8A' : '#BFDBFE',
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;