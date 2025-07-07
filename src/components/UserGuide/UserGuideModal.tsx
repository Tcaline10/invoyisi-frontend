import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Info, FileText, Users, CreditCard, BarChart4, Upload, Settings } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';

interface UserGuideStep {
  title: string;
  description: string;
  image: string;
  tips: string[];
}

const userGuideSteps: UserGuideStep[] = [
  {
    title: 'Welcome to I-Invoyisi',
    description: 'I-Invoyisi is your AI-powered invoice management system. This guide will walk you through the main features of the application.',
    image: '/images/user-guide/welcome.png',
    tips: [
      'Use the sidebar to navigate between different sections',
      'The dashboard gives you a quick overview of your financial status',
      'Click on any card or chart to see more details'
    ]
  },
  {
    title: 'Dashboard Overview',
    description: 'The dashboard provides a quick overview of your financial status, including total paid, due, overdue, and upcoming amounts.',
    image: '/images/user-guide/dashboard.png',
    tips: [
      'The top cards show your key financial metrics',
      'The revenue chart displays your income over time',
      'Recent invoices give you quick access to your latest transactions',
      'Use the quick actions to create new invoices or clients'
    ]
  },
  {
    title: 'Managing Clients',
    description: 'The Clients section allows you to create, view, and manage your client information.',
    image: '/images/user-guide/clients.png',
    tips: [
      'Click "New Client" to add a new client',
      'Search and filter to find specific clients',
      'Click on a client to view their details and invoices',
      'Use the "Create Summary" button to generate an AI-powered client history summary'
    ]
  },
  {
    title: 'Creating Invoices',
    description: 'Create professional invoices for your clients with line items, taxes, and custom notes.',
    image: '/images/user-guide/invoices.png',
    tips: [
      'Click "New Invoice" to create a new invoice',
      'Select a client from the dropdown',
      'Add line items with descriptions, quantities, and prices',
      'Set the issue date and due date',
      'Save as draft or finalize the invoice'
    ]
  },
  {
    title: 'Invoice Workflow',
    description: 'Invoices follow a workflow from draft to paid, with different actions available at each stage.',
    image: '/images/user-guide/invoice-workflow.png',
    tips: [
      'Draft invoices can be edited and finalized',
      'Unpaid invoices can be marked as paid or have payments recorded',
      'Overdue invoices are automatically flagged when past due date',
      'Paid invoices show payment history and can be downloaded'
    ]
  },
  {
    title: 'Recording Payments',
    description: 'Record payments for invoices to keep track of your income and update invoice statuses.',
    image: '/images/user-guide/payments.png',
    tips: [
      'Click "Record Payment" on an invoice to add a payment',
      'Enter the payment amount, date, and method',
      'Add a reference number for tracking',
      'The invoice status updates automatically based on the payment amount'
    ]
  },
  {
    title: 'Document Processing',
    description: 'Upload invoices and receipts to automatically extract data using AI technology.',
    image: '/images/user-guide/document-processing.png',
    tips: [
      'Upload PDF, JPG, or PNG documents',
      'The AI will extract client and invoice information',
      'Review and edit the extracted data',
      'Create clients and invoices directly from the extracted data'
    ]
  },
  {
    title: 'Reports and Analytics',
    description: 'Generate reports to gain insights into your financial performance and client relationships.',
    image: '/images/user-guide/reports.png',
    tips: [
      'View revenue trends over time',
      'Analyze invoice aging to identify late payments',
      'See top clients by revenue',
      'Export reports for accounting purposes'
    ]
  }
];

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  if (!isOpen) return null;
  
  const step = userGuideSteps[currentStep];
  
  const goToNextStep = () => {
    if (currentStep < userGuideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const progressPercentage = ((currentStep + 1) / userGuideSteps.length) * 100;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">User Guide</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="relative h-1 bg-gray-200">
          <div 
            className="absolute h-1 bg-blue-600 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <CardContent className="flex-grow overflow-auto p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
              <p className="text-gray-700 mb-6">{step.description}</p>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold flex items-center text-blue-900 mb-2">
                  <Info size={16} className="mr-2" />
                  Tips
                </h4>
                <ul className="space-y-2">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-sm text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="hidden md:block">
                <h4 className="font-semibold mb-2">Navigation</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center p-2 rounded bg-gray-50">
                    <FileText size={16} className="mb-1" />
                    <span className="text-xs">Invoices</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded bg-gray-50">
                    <Users size={16} className="mb-1" />
                    <span className="text-xs">Clients</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded bg-gray-50">
                    <CreditCard size={16} className="mb-1" />
                    <span className="text-xs">Payments</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded bg-gray-50">
                    <Upload size={16} className="mb-1" />
                    <span className="text-xs">Documents</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 flex flex-col">
              <div className="bg-gray-100 rounded-lg p-2 h-64 flex items-center justify-center mb-4">
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder.png';
                  }}
                />
              </div>
              
              <div className="text-center text-sm text-gray-500">
                Step {currentStep + 1} of {userGuideSteps.length}
              </div>
            </div>
          </div>
        </CardContent>
        
        <div className="flex justify-between p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevStep}
            disabled={currentStep === 0}
            icon={<ChevronLeft size={16} />}
          >
            Previous
          </Button>
          
          {currentStep < userGuideSteps.length - 1 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={goToNextStep}
              icon={<ChevronRight size={16} className="ml-1" />}
              iconPosition="right"
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Finish
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UserGuideModal;
