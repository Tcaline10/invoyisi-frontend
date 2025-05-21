import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      icon: 'text-amber-500',
      confirmButton: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
    },
    info: {
      icon: 'text-blue-500',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-${variant === 'danger' ? 'red' : variant === 'warning' ? 'amber' : 'blue'}-100 sm:mx-0 sm:h-10 sm:w-10`}>
                <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <Button
              variant={variant === 'danger' ? 'destructive' : 'primary'}
              className="sm:ml-3"
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="mt-3 sm:mt-0"
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
