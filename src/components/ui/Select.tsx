import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, fullWidth = false, className = '', children, ...props }, ref) => {
    const selectStyles = `
      block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 shadow-sm
      appearance-none bg-white
      focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 focus:border-blue-600
      sm:text-sm sm:leading-6
      ${error ? 'ring-1 ring-red-500' : 'ring-1 ring-inset ring-gray-300'}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `;

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          <select
            ref={ref}
            className={selectStyles}
            {...props}
          >
            {children}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        {(helperText || error) && (
          <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
