import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, fullWidth = false, className = '', ...props }, ref) => {
    const textareaStyles = `
      block rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm
      placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600
      focus:ring-opacity-50 focus:border-blue-600 sm:text-sm sm:leading-6
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
          <textarea
            ref={ref}
            className={textareaStyles}
            rows={props.rows || 4}
            {...props}
          />
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

Textarea.displayName = 'Textarea';

export default Textarea;
