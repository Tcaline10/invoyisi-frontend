import React, { ReactNode } from 'react';
import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="text-gray-400 mb-4">
        {icon || <InboxIcon className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-md mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
