import React from 'react';

interface DocumentViewerProps {
  data: any;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ data }) => {
  // Helper function to render nested objects
  const renderObject = (obj: any, level = 0) => {
    if (!obj || typeof obj !== 'object') {
      return <span>{String(obj)}</span>;
    }

    return (
      <div className={`pl-${level * 4}`}>
        {Object.entries(obj).map(([key, value]) => {
          // Skip rendering if value is null or undefined
          if (value === null || value === undefined) {
            return null;
          }

          // Handle arrays
          if (Array.isArray(value)) {
            return (
              <div key={key} className="mb-2">
                <span className="font-medium">{formatKey(key)}:</span>
                <ul className="list-disc pl-6 mt-1">
                  {value.map((item, index) => (
                    <li key={index} className="mb-1">
                      {typeof item === 'object' ? renderObject(item, level + 1) : String(item)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          // Handle nested objects
          if (typeof value === 'object') {
            return (
              <div key={key} className="mb-2">
                <span className="font-medium">{formatKey(key)}:</span>
                <div className="pl-4 mt-1 border-l-2 border-gray-200">
                  {renderObject(value, level + 1)}
                </div>
              </div>
            );
          }

          // Handle primitive values
          return (
            <div key={key} className="mb-2">
              <span className="font-medium">{formatKey(key)}:</span> {String(value)}
            </div>
          );
        })}
      </div>
    );
  };

  // Format keys for better display
  const formatKey = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // If data is a string, display it directly
  if (typeof data === 'string') {
    return <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">{data}</div>;
  }

  // If data has a text property, display it
  if (data.text) {
    return <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">{data.text}</div>;
  }

  return (
    <div className="bg-gray-50 p-4 rounded-md">
      {renderObject(data)}
    </div>
  );
};

export default DocumentViewer;
