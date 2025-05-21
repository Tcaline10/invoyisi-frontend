import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  className?: string;
  showRetry?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  className = '',
  showRetry = true
}) => {
  if (!error) return null;

  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="mx-auto mb-4 text-red-500">
        <AlertTriangle className="h-12 w-12 mx-auto" />
      </div>
      <h2 className="text-xl font-medium text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-4">{error}</p>
      {showRetry && onRetry && (
        <Button
          variant="primary"
          size="sm"
          icon={<RefreshCw size={16} />}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorDisplay;
