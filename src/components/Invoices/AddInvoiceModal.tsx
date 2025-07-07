import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Edit, Loader, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FileUpload from '../ui/FileUpload';
import InvoiceForm from './InvoiceForm';
import { createWorker } from 'tesseract.js';

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type InvoiceCreationMethod = 'manual' | 'upload' | 'form' | null;

const AddInvoiceModal: React.FC<AddInvoiceModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<InvoiceCreationMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Process image with Tesseract.js
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      const { data: { text } } = await worker.recognize(file);
      setOcrResult(text);

      await worker.terminate();
      setIsProcessing(false);

      // After OCR processing, we would typically extract invoice data
      // For now, we'll just show the raw text and provide an option to continue
    } catch (err) {
      console.error('OCR processing error:', err);
      setError('Failed to process the document. Please try again or use manual entry.');
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (method === 'manual') {
      // Switch to the form view within the modal
      setMethod('form');
    } else if (ocrResult) {
      // In a real app, we would pass the extracted data to the invoice form
      // For now, just switch to the form view
      setMethod('form');
    }
  };

  const renderContent = () => {
    if (!method) {
      return (
        <div className="flex flex-col space-y-4">
          <p className="text-gray-600 mb-4">
            Choose how you want to create your invoice:
          </p>

          <button
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setMethod('upload')}
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600 mr-3">
              <Upload size={20} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900">Upload Document</h3>
              <p className="text-sm text-gray-500">
                Use AI to extract invoice data from a document or image
              </p>
            </div>
          </button>

          <button
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setMethod('manual')}
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 text-green-600 mr-3">
              <Edit size={20} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900">Manual Entry</h3>
              <p className="text-sm text-gray-500">
                Create an invoice by entering the details manually
              </p>
            </div>
          </button>
        </div>
      );
    }

    if (method === 'upload') {
      return (
        <div className="space-y-4">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader className="animate-spin text-blue-500 mb-4" size={32} />
              <p className="text-gray-600">Processing your document...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          ) : ocrResult ? (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
                <div className="flex-shrink-0 text-green-500 mr-2 mt-0.5">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-green-800">Document processed successfully</h4>
                  <p className="text-xs text-green-700 mt-1">
                    We've extracted the information from your document. You can review and edit the details in the next step.
                  </p>
                </div>
              </div>

              <div className="border rounded-md p-3 max-h-60 overflow-y-auto bg-gray-50">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">{ocrResult}</pre>
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={handleContinue}
              >
                Continue to Invoice
              </Button>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                <div className="flex-shrink-0 text-red-500 mr-2 mt-0.5">
                  <AlertCircle size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-800">Processing Error</h4>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>

              <FileUpload
                onFileSelect={handleFileSelect}
                accept="image/*,.pdf"
                label="Try again with a different document"
                helperText="For best results, use a clear image or PDF of your invoice"
              />

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setMethod('manual')}
                >
                  Switch to Manual Entry
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Upload an invoice document or image to automatically extract the information.
              </p>

              <FileUpload
                onFileSelect={handleFileSelect}
                accept="image/*,.pdf"
                label="Upload Invoice Document"
                helperText="For best results, use a clear image or PDF of your invoice"
              />

              <p className="text-xs text-gray-500">
                Supported formats: JPG, PNG, PDF
              </p>
            </div>
          )}
        </div>
      );
    }

    if (method === 'manual') {
      return (
        <div className="space-y-4">
          <p className="text-gray-600">
            Fill out the invoice form with your details.
          </p>

          <Button
            variant="primary"
            fullWidth
            onClick={handleContinue}
          >
            Continue to Invoice Form
          </Button>
        </div>
      );
    }

    if (method === 'form') {
      return (
        <div className="max-h-[70vh] overflow-y-auto pr-2" onClick={(e) => e.stopPropagation()}>
          <InvoiceForm isInModal={true} />
        </div>
      );
    }

    return null;
  };

  const renderFooter = () => {
    if (!method) return null;

    if (method === 'form') {
      return (
        <>
          <Button
            variant="outline"
            onClick={() => {
              setMethod(null);
              setOcrResult(null);
              setError(null);
            }}
          >
            Cancel
          </Button>

          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              // Get the form element
              const form = document.getElementById('invoice-form');
              // Create and dispatch a custom event
              const event = new CustomEvent('save-as-draft');
              form?.dispatchEvent(event);
            }}
          >
            Save as Draft
          </Button>

          <Button
            variant="primary"
            form="invoice-form"
            type="submit"
          >
            Save Invoice
          </Button>
        </>
      );
    }

    return (
      <>
        <Button
          variant="outline"
          onClick={() => {
            setMethod(null);
            setOcrResult(null);
            setError(null);
          }}
        >
          Back
        </Button>

        <Button
          variant="outline"
          onClick={onClose}
        >
          Cancel
        </Button>
      </>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Invoice"
      size={method === 'form' ? 'xl' : 'md'}
      footer={renderFooter()}
    >
      {renderContent()}
    </Modal>
  );
};

export default AddInvoiceModal;
