import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Building, User, FileText, Settings } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { userService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import CurrencySelector from '../Settings/CurrencySelector';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // User data
  const [userData, setUserData] = useState({
    full_name: '',
    job_title: '',
  });

  // Company data
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    tax_number: '',
  });

  // Invoice settings
  const [invoiceSettings, setInvoiceSettings] = useState({
    invoice_prefix: 'INV-',
    next_invoice_number: 1001,
    default_due_days: 30,
    default_tax_rate: 0,
    default_currency: 'XAF',
    invoice_footer: 'Thank you for your business!',
  });

  const totalSteps = 4;

  const handleUserDataChange = (field: string, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompanyDataChange = (field: string, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInvoiceSettingChange = (field: string, value: any) => {
    setInvoiceSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      // Save user profile
      await userService.updateProfile(userData);

      // Save company data
      await userService.updateCompany(companyData);

      // Save invoice settings
      await userService.updateInvoiceSettings(invoiceSettings);

      showToast('success', 'Setup completed successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      showToast('error', 'Failed to save your settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Welcome to I-Invoyisi</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <React.Fragment key={index}>
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step > index + 1
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : step === index + 1
                        ? 'border-blue-600 text-blue-600'
                        : 'border-gray-300 text-gray-300'
                    }`}
                  >
                    {step > index + 1 ? (
                      <Check size={18} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  {index < totalSteps - 1 && (
                    <div
                      className={`flex-1 h-1 ${
                        step > index + 1 ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <div className="text-sm font-medium">Welcome</div>
              <div className="text-sm font-medium">Your Profile</div>
              <div className="text-sm font-medium">Company Info</div>
              <div className="text-sm font-medium">Preferences</div>
            </div>
          </div>

          {/* Step content */}
          <div className="mt-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <FileText size={32} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Welcome to I-Invoyisi</h3>
                  <p className="text-gray-600">
                    Let's set up your account in just a few steps. This will help you get started with creating invoices quickly.
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-800">
                    This setup will only take about 2 minutes. You can always change these settings later.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <User size={24} className="text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold">Your Profile</h3>
                </div>
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={userData.full_name}
                  onChange={(e) => handleUserDataChange('full_name', e.target.value)}
                />
                <Input
                  label="Job Title"
                  placeholder="Business Owner"
                  value={userData.job_title}
                  onChange={(e) => handleUserDataChange('job_title', e.target.value)}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <Building size={24} className="text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold">Company Information</h3>
                </div>
                <Input
                  label="Company Name"
                  placeholder="Your Company Name"
                  value={companyData.name}
                  onChange={(e) => handleCompanyDataChange('name', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="company@example.com"
                    value={companyData.email}
                    onChange={(e) => handleCompanyDataChange('email', e.target.value)}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="+1 (555) 123-4567"
                    value={companyData.phone}
                    onChange={(e) => handleCompanyDataChange('phone', e.target.value)}
                  />
                </div>
                <Input
                  label="Business Address"
                  placeholder="123 Business Street, City, Country"
                  value={companyData.address}
                  onChange={(e) => handleCompanyDataChange('address', e.target.value)}
                />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <Settings size={24} className="text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold">Invoice Preferences</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Invoice Prefix"
                    placeholder="INV-"
                    value={invoiceSettings.invoice_prefix}
                    onChange={(e) => handleInvoiceSettingChange('invoice_prefix', e.target.value)}
                  />
                  <Input
                    label="Next Invoice Number"
                    type="number"
                    placeholder="1001"
                    value={invoiceSettings.next_invoice_number.toString()}
                    onChange={(e) => handleInvoiceSettingChange('next_invoice_number', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="mt-4">
                  <CurrencySelector
                    selectedCurrency={invoiceSettings.default_currency}
                    onCurrencyChange={(currency) => handleInvoiceSettingChange('default_currency', currency)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between p-6 border-t">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={prevStep}
              icon={<ArrowLeft size={16} />}
            >
              Back
            </Button>
          ) : (
            <div></div>
          )}
          {step < totalSteps ? (
            <Button
              variant="primary"
              onClick={nextStep}
              icon={<ArrowRight size={16} className="ml-2" />}
              iconPosition="right"
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleComplete}
              loading={loading}
              icon={<Check size={16} />}
            >
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
