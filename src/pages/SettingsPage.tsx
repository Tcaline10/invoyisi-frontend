import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Save, Building, Mail, Globe, Phone, CreditCard, Bell, Lock, Shield } from 'lucide-react';
import { userService } from '../services/api';
import ChangePasswordModal from '../components/Profile/ChangePasswordModal';
import CurrencySelector from '../components/Settings/CurrencySelector';

// Define types for invoice settings
interface InvoiceSettings {
  id?: string;
  user_id?: string;
  invoice_prefix?: string;
  next_invoice_number?: number;
  default_due_days?: number;
  default_tax_rate?: number;
  default_currency?: string;
  invoice_footer?: string;
}

// Define types for company data
interface CompanyData {
  id?: string;
  name?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_number?: string;
}

const SettingsPage: React.FC = () => {
  const [companyData, setCompanyData] = useState<CompanyData>({});
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    invoice_prefix: 'INV-',
    next_invoice_number: 1001,
    default_due_days: 30,
    default_tax_rate: 0,
    default_currency: 'XAF',
    invoice_footer: 'Thank you for your business!'
  });

  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get company data
        const company = await userService.getCompany();
        if (company) {
          setCompanyData(company);
        }

        // Get invoice settings
        const settings = await userService.getInvoiceSettings();
        if (settings) {
          setInvoiceSettings(settings);
        }
      } catch (err) {
        console.error('Error fetching settings data:', err);
        setError('Failed to load settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle company data changes
  const handleCompanyChange = (field: keyof CompanyData, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle invoice settings changes
  const handleInvoiceSettingChange = (field: keyof InvoiceSettings, value: any) => {
    setInvoiceSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save company data
  const handleSaveCompany = async () => {
    try {
      setSavingCompany(true);
      setError(null);
      setSuccessMessage(null);

      const result = await userService.updateCompany(companyData);

      if (result) {
        setCompanyData(result);
        setSuccessMessage('Company information saved successfully!');
      } else {
        throw new Error('Failed to save company information');
      }
    } catch (err: any) {
      console.error('Error saving company data:', err);
      setError(err.message || 'Failed to save company information. Please try again.');
    } finally {
      setSavingCompany(false);
    }
  };

  // Save invoice settings
  const handleSaveInvoiceSettings = async () => {
    try {
      setSavingInvoice(true);
      setError(null);
      setSuccessMessage(null);

      const result = await userService.updateInvoiceSettings(invoiceSettings);

      if (result) {
        setInvoiceSettings(result);
        setSuccessMessage('Invoice settings saved successfully!');
      } else {
        throw new Error('Failed to save invoice settings');
      }
    } catch (err: any) {
      console.error('Error saving invoice settings:', err);
      setError(err.message || 'Failed to save invoice settings. Please try again.');
    } finally {
      setSavingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900 mb-4"></div>
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-100 text-red-800 px-4 py-3 rounded-md flex items-center shadow-sm">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-100 text-green-800 px-4 py-3 rounded-md flex items-center shadow-sm">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {successMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  placeholder="Your Company Name"
                  icon={<Building size={16} />}
                  value={companyData.name || ''}
                  onChange={(e) => handleCompanyChange('name', e.target.value)}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="company@example.com"
                  icon={<Mail size={16} />}
                  value={companyData.email || ''}
                  onChange={(e) => handleCompanyChange('email', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Website"
                  placeholder="https://example.com"
                  icon={<Globe size={16} />}
                  value={companyData.website || ''}
                  onChange={(e) => handleCompanyChange('website', e.target.value)}
                />
                <Input
                  label="Phone Number"
                  placeholder="+1 (555) 123-4567"
                  icon={<Phone size={16} />}
                  value={companyData.phone || ''}
                  onChange={(e) => handleCompanyChange('phone', e.target.value)}
                />
              </div>
              <Input
                label="Business Address"
                placeholder="123 Business Street, City, Country"
                icon={<Building size={16} />}
                value={companyData.address || ''}
                onChange={(e) => handleCompanyChange('address', e.target.value)}
              />
              <Input
                label="Tax ID / VAT Number"
                placeholder="Tax identification number"
                icon={<Shield size={16} />}
                value={companyData.tax_number || ''}
                onChange={(e) => handleCompanyChange('tax_number', e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="primary"
                icon={<Save size={16} />}
                onClick={handleSaveCompany}
                loading={savingCompany}
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Invoice Prefix"
                  placeholder="INV-"
                  value={invoiceSettings.invoice_prefix || ''}
                  onChange={(e) => handleInvoiceSettingChange('invoice_prefix', e.target.value)}
                />
                <Input
                  label="Next Invoice Number"
                  type="number"
                  placeholder="0001"
                  value={invoiceSettings.next_invoice_number?.toString() || ''}
                  onChange={(e) => handleInvoiceSettingChange('next_invoice_number', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Default Due Days"
                  type="number"
                  placeholder="30"
                  value={invoiceSettings.default_due_days?.toString() || ''}
                  onChange={(e) => handleInvoiceSettingChange('default_due_days', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Default Tax Rate (%)"
                  type="number"
                  placeholder="10"
                  value={invoiceSettings.default_tax_rate?.toString() || ''}
                  onChange={(e) => handleInvoiceSettingChange('default_tax_rate', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="mt-4">
                <CurrencySelector
                  selectedCurrency={invoiceSettings.default_currency || 'XAF'}
                  onCurrencyChange={(currency) => handleInvoiceSettingChange('default_currency', currency)}
                />
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Invoice Footer Note
                </label>
                <textarea
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Thank you for your business!"
                  value={invoiceSettings.invoice_footer || ''}
                  onChange={(e) => handleInvoiceSettingChange('invoice_footer', e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="primary"
                icon={<Save size={16} />}
                onClick={handleSaveInvoiceSettings}
                loading={savingInvoice}
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Stripe</p>
                    <p className="text-xs text-gray-500">Connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium">PayPal</p>
                    <p className="text-xs text-gray-500">Not connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-gray-500">Get notified about new invoices</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Payment Notifications</p>
                    <p className="text-xs text-gray-500">Get notified about payments</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={<Lock size={16} />}
                onClick={() => setShowChangePasswordModal(true)}
              >
                Change Password
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={<Shield size={16} />}
              >
                Two-Factor Authentication
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
};

export default SettingsPage;