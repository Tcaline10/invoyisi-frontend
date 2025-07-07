import React, { forwardRef, useCallback } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  fullWidth?: boolean;
  as?: 'input' | 'textarea';
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, helperText, error, prefix, suffix, fullWidth = false, className = '', as = 'input', ...props }, ref) => {
    const inputStyles = `
      block rounded-md border-0 py-1.5 text-gray-900 shadow-sm
      placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600
      focus:ring-opacity-50 focus:border-blue-600 sm:text-sm sm:leading-6
      ${error ? 'ring-1 ring-red-500' : 'ring-1 ring-inset ring-gray-300'}
      ${prefix ? 'pl-10' : 'pl-3'}
      ${suffix ? 'pr-10' : 'pr-3'}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `;

    // Handle click on the suffix (e.g., dropdown icon)
    const handleSuffixClick = useCallback((e: React.MouseEvent) => {
      if (props.onClick) {
        e.stopPropagation();
        props.onClick(e as any);
      }
    }, [props.onClick]);

    const renderInput = () => {
      if (as === 'textarea') {
        return (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={inputStyles}
            {...props as any}
          />
        );
      }

      return (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          className={inputStyles}
          {...props}
        />
      );
    };

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          {prefix && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {prefix}
            </div>
          )}
          {renderInput()}
          {suffix && (
            <div
              className={`absolute inset-y-0 right-0 pr-3 flex items-center ${props.onClick ? 'cursor-pointer' : 'pointer-events-none'}`}
              onClick={handleSuffixClick}
            >
              {suffix}
            </div>
          )}
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

Input.displayName = 'Input';

export default Input;