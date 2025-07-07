import React, { forwardRef } from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, htmlFor, required, className = '', ...props }, ref) => {
    return (
      <label
        ref={ref}
        htmlFor={htmlFor}
        className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';

export default Label;
