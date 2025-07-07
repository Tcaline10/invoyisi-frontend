import React, { Suspense } from 'react';
import LoadingSkeleton from './LoadingSkeleton';

interface SuspenseWrapperProps {
  children: React.ReactNode;
  type?: 'page' | 'card' | 'list' | 'form';
  count?: number;
}

/**
 * A wrapper component that provides a consistent loading experience for lazy-loaded components
 */
const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({ 
  children, 
  type = 'page',
  count = 1
}) => {
  return (
    <Suspense fallback={
      <div className="p-6">
        <LoadingSkeleton type={type} count={count} />
      </div>
    }>
      {children}
    </Suspense>
  );
};

export default SuspenseWrapper;
