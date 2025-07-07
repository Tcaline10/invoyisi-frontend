import React from 'react';

interface LoadingSkeletonProps {
  type?: 'page' | 'card' | 'list' | 'form';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'page', count = 1 }) => {
  const renderPageSkeleton = () => (
    <div className="animate-pulse space-y-6 w-full">
      <div className="h-8 bg-gray-200 rounded-md w-1/4"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-40 bg-gray-200 rounded-md"></div>
        <div className="h-40 bg-gray-200 rounded-md"></div>
      </div>
      <div className="h-60 bg-gray-200 rounded-md"></div>
    </div>
  );

  const renderCardSkeleton = () => (
    <div className="animate-pulse bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="h-6 bg-gray-200 rounded-md w-1/3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded-md w-full"></div>
        <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded-md w-4/6"></div>
      </div>
      <div className="flex justify-end">
        <div className="h-8 bg-gray-200 rounded-md w-24"></div>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded-md w-1/4 mb-6"></div>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-200 rounded-md w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded-md w-24"></div>
        </div>
      ))}
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded-md w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded-md w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded-md w-full"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded-md w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded-md w-full"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded-md w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded-md w-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded-md w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded-md w-full"></div>
      </div>
      <div className="flex justify-end space-x-2">
        <div className="h-10 bg-gray-200 rounded-md w-24"></div>
        <div className="h-10 bg-gray-200 rounded-md w-24"></div>
      </div>
    </div>
  );

  switch (type) {
    case 'card':
      return renderCardSkeleton();
    case 'list':
      return renderListSkeleton();
    case 'form':
      return renderFormSkeleton();
    case 'page':
    default:
      return renderPageSkeleton();
  }
};

export default LoadingSkeleton;
