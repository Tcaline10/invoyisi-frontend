import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Plus, Trash2, Save, Send, ChevronDown, CheckCircle, CreditCard, Eye, Globe } from 'lucide-react';
import { InvoiceItem, Client } from '../../types';
import { invoiceService, clientService } from '../../services/api';
import Modal from '../ui/Modal';
import CurrencySelector from '../Currency/CurrencySelector';

interface InvoiceFormProps {
  isEditing?: boolean;
  isInModal?: boolean;
  invoiceId?: string;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ isEditing = false, isInModal = false, invoiceId }) => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    number: `INV-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    issued_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    client_id: 0,
    status: 'draft'
  });

  // Items state
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: Date.now(), description: '', quantity: 1, unit_price: 0, amount: 0, invoice_id: 0 } as any,
  ]);

  // Calculations
  const [subtotal, setSubtotal] = useState(0);
  const [taxRate, setTaxRate] = useState(10);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [currency, setCurrency] = useState('XAF');

  // UI state
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await clientService.getClients();
        setClients(data);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients');
      }
    };

    fetchClients();

    // If editing, fetch invoice data
    if (isEditing && invoiceId) {
      fetchInvoice(invoiceId);
    }

    // Add event listener for save-as-draft custom event
    const handleSaveAsDraft = () => {
      if (selectedClient) {
        saveInvoice('draft');
      } else {
        setError('Please select a client');
      }
    };

    const form = document.getElementById('invoice-form');
    form?.addEventListener('save-as-draft', handleSaveAsDraft);

    return () => {
      form?.removeEventListener('save-as-draft', handleSaveAsDraft);
    };
  }, [isEditing, invoiceId, selectedClient]);

  // Fetch invoice data when editing
  const fetchInvoice = async (id: string) => {
    try {
      setLoading(true);
      const invoice = await invoiceService.getInvoice(id);

      // Set form data
      setFormData({
        number: invoice.number,
        issued_date: invoice.issued_date,
        due_date: invoice.due_date,
        notes: invoice.notes || '',
        client_id: invoice.client_id,
        status: invoice.status
      });

      // Set items
      if (invoice.items && invoice.items.length > 0) {
        setItems(invoice.items);
      }

      // Set selected client
      const client = clients.find(c => c.id === invoice.client_id);
      if (client) {
        setSelectedClient(client);
      }

      // Calculate totals
      setSubtotal(invoice.subtotal);
      setTaxAmount(invoice.tax || 0);
      setTotal(invoice.total);

      // Calculate tax rate
      if (invoice.subtotal > 0 && invoice.tax) {
        setTaxRate((invoice.tax / invoice.subtotal) * 100);
      }

    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  const calculateLineAmount = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const addItem = () => {
    // Generate a unique temporary ID
    const tempId = Date.now() + Math.floor(Math.random() * 1000);

    // Create a new item with default values
    const newItem: InvoiceItem = {
      id: tempId,
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0, // Will be calculated when user enters values
      invoice_id: invoiceId || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any;

    console.log('Adding new item:', newItem);
    setItems([...items, newItem]);

    // Clear any error when adding a new item
    if (error) {
      setError(null);
    }
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));

      // Recalculate totals after removing an item
      const remainingItems = items.filter(item => item.id !== id);
      const newSubtotal = remainingItems.reduce((sum, item) => sum + item.amount, 0);
      const newTaxAmount = (newSubtotal * taxRate) / 100;

      setSubtotal(newSubtotal);
      setTaxAmount(newTaxAmount);
      setTotal(newSubtotal + newTaxAmount);
    }
  };

  const updateItem = (id: number, field: keyof InvoiceItem, value: any) => {
    try {
      // Ensure numeric values are properly formatted
      let formattedValue = value;
      if (field === 'quantity') {
        formattedValue = parseInt(value) || 0;
        if (formattedValue < 0) formattedValue = 0;
      } else if (field === 'unit_price') {
        formattedValue = parseFloat(value) || 0;
        if (formattedValue < 0) formattedValue = 0;
      }

      const updatedItems = items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: formattedValue };

          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.amount = calculateLineAmount(
              field === 'quantity' ? formattedValue : item.quantity,
              field === 'unit_price' ? formattedValue : item.unit_price
            );
          }

          return updatedItem;
        }
        return item;
      });

      setItems(updatedItems);

      // Recalculate totals
      const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const newTaxAmount = (newSubtotal * taxRate) / 100;

      setSubtotal(newSubtotal);
      setTaxAmount(newTaxAmount);
      setTotal(newSubtotal + newTaxAmount);

      // Clear any error when user makes changes
      if (error) {
        setError(null);
      }

      console.log('Updated item, new totals:', {
        subtotal: newSubtotal,
        taxAmount: newTaxAmount,
        total: newSubtotal + newTaxAmount
      });
    } catch (err) {
      console.error('Error updating item:', err);
      // Don't set form error for item updates to avoid disrupting the user
    }
  };

  // Handle form field changes
  const handleFormChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });

    // Clear any error when user makes changes
    if (error) {
      setError(null);
    }
  };

  // Handle client selection
  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      ...formData,
      client_id: client.id
    });
    setShowClientDropdown(false);
  };

  // State for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);

  // Save invoice
  const saveInvoice = async (status: 'draft' | 'sent' = 'draft') => {
    try {
      setLoading(true);
      setError(null);

      // Validate form data
      if (!selectedClient) {
        setError('Please select a client');
        setLoading(false);
        return;
      }

      // Validate items - ensure at least one item has a description
      const hasValidItem = items.some(item => item.description && item.description.trim() !== '');
      if (!hasValidItem) {
        setError('Please add at least one item with a description');
        setLoading(false);
        return;
      }

      // Set default values for empty items to prevent validation errors
      const validatedItems = items.map(item => ({
        ...item,
        description: item.description || 'Item',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        amount: item.amount || 0
      }));

      // Prepare invoice data
      const invoiceData = {
        ...formData,
        status,
        subtotal,
        tax: taxAmount,
        total,
        items: validatedItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount
        }))
      };

      console.log('Saving invoice with data:', invoiceData);

      let result;

      if (isEditing && invoiceId) {
        // Update existing invoice
        result = await invoiceService.updateInvoice(invoiceId, invoiceData);

        // Navigate to invoice details page
        navigate(`/invoices/${result.id}`);
      } else {
        // Create new invoice
        result = await invoiceService.createInvoice(invoiceData);

        // Show success modal for new invoices
        setSavedInvoiceId(result.id);
        setShowSuccessModal(true);
      }

      console.log('Invoice saved successfully:', result);

    } catch (err: any) {
      console.error('Error saving invoice:', err);
      // Display a more specific error message if available
      setError(err.message || 'Failed to save invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle view invoice after creation
  const handleViewInvoice = () => {
    if (savedInvoiceId) {
      navigate(`/invoices/${savedInvoiceId}`);
    }
  };

  // Handle proceed to payment after creation
  const handleProceedToPayment = () => {
    if (savedInvoiceId) {
      navigate(`/payments/new?invoice=${savedInvoiceId}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      setError('Please select a client');
      return;
    }

    // Save as sent by default when in modal
    saveInvoice(isInModal ? 'sent' : 'draft');
  };

  return (
    <>
      <Card className={isInModal ? "" : "mb-6"}>
        {!isInModal && (
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Invoice' : 'Create New Invoice'}</CardTitle>
          </CardHeader>
        )}

        <form id="invoice-form" onSubmit={handleSubmit}>

      {loading ? (
        <CardContent>
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-medium text-gray-900">Loading invoice data...</h2>
          </div>
        </CardContent>
      ) : error ? (
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto mb-4 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900">{error}</h2>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </CardContent>
      ) : (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bill From</h3>
              <div className="space-y-4">
                <Input
                  label="Company Name"
                  placeholder="Your Company Name"
                  defaultValue="Your Company"
                />
                <Input
                  label="Email Address"
                  placeholder="your@email.com"
                  type="email"
                  defaultValue="billing@yourcompany.com"
                />
                <Input
                  label="Address"
                  placeholder="Street Address"
                  defaultValue="123 Business Ave."
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    placeholder="City"
                    defaultValue="Your City"
                  />
                  <Input
                    label="Zip Code"
                    placeholder="Zip Code"
                    defaultValue="12345"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bill To</h3>
              <div className="space-y-4">
                <div className="relative">
                    <Input
                      label="Client"
                      placeholder="Select a client"
                      value={selectedClient ? selectedClient.name : ''}
                      onClick={() => setShowClientDropdown(!showClientDropdown)}
                      suffix={<ChevronDown size={16} className="cursor-pointer" />}
                      readOnly
                    />
                    {showClientDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                        <ul className="py-1 max-h-60 overflow-auto">
                          {clients.length === 0 ? (
                            <li className="px-4 py-2 text-gray-500">No clients found</li>
                          ) : (
                            clients.map(client => (
                              <li
                                key={client.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent blur event
                                  selectClient(client);
                                }}
                              >
                                {client.name}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    )}
                </div>
                <Input
                  label="Email Address"
                  placeholder="client@email.com"
                  type="email"
                  value={selectedClient ? selectedClient.email : ''}
                  readOnly
                />
                <Input
                  label="Address"
                  placeholder="Street Address"
                  value={selectedClient ? selectedClient.address || '' : ''}
                  readOnly
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Phone"
                    placeholder="Phone"
                    value={selectedClient ? selectedClient.phone || '' : ''}
                    readOnly
                  />
                  <Input
                    label="Company"
                    placeholder="Company"
                    value={selectedClient ? selectedClient.company || '' : ''}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <Input
                label="Invoice Number"
                placeholder="INV-001"
                value={formData.number}
                onChange={(e) => handleFormChange('number', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Issue Date"
                type="date"
                value={formData.issued_date}
                onChange={(e) => handleFormChange('issued_date', e.target.value)}
              />
              <Input
                label="Due Date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleFormChange('due_date', e.target.value)}
              />
            </div>

            {/* Currency Selection */}
            <div className="mb-6">
              <CurrencySelector
                value={currency}
                onChange={setCurrency}
                showConverter={false}
                region="africa"
              />
            </div>
          </div>

        <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-full">Item Description</th>
                <th className="px-4 py-3 whitespace-nowrap">Qty</th>
                <th className="px-4 py-3 whitespace-nowrap">Price</th>
                <th className="px-4 py-3 whitespace-nowrap">Amount</th>
                <th className="px-4 py-3 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id || Math.random()} className="bg-white border-b">
                  <td className="px-4 py-3">
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                      className="w-20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      prefix="$"
                      className="w-32"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ${item.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length <= 1}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<Plus size={16} />}
          onClick={addItem}
          className="mb-8"
        >
          Add Item
        </Button>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-grow">
            <Input
              label="Notes"
              placeholder="Additional notes or payment information"
              className="h-32"
              as="textarea"
              value={formData.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
            />
          </div>

          <div className="md:w-64">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Tax:</span>
                <div className="flex items-center">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => {
                      const newTaxRate = parseFloat(e.target.value) || 0;
                      setTaxRate(newTaxRate);
                      const newTaxAmount = (subtotal * newTaxRate) / 100;
                      setTaxAmount(newTaxAmount);
                      setTotal(subtotal + newTaxAmount);
                    }}
                    className="w-16 mr-2"
                  />
                  <span>%</span>
                </div>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-600">Tax Amount:</span>
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-900 font-semibold">Total:</span>
                <span className="text-gray-900 font-semibold">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        </CardContent>
      )}

      {!isInModal && (
        <CardFooter className="flex justify-between">
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/invoices')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              type="button"
              icon={<Save size={16} />}
              onClick={() => saveInvoice('draft')}
              disabled={loading || !selectedClient}
            >
              {loading ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={<Send size={16} />}
              disabled={loading || !selectedClient}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Invoice' : 'Send Invoice'}
            </Button>
          </div>
        </CardFooter>
      )}
      </form>
    </Card>

    {/* Success Modal */}
    <Modal
      isOpen={showSuccessModal}
      onClose={() => navigate(`/invoices/${savedInvoiceId}`)}
      title="Invoice Created Successfully"
      size="sm"
      footer={
        <div className="flex justify-end space-x-2 w-full">
          <Button
            variant="outline"
            onClick={handleViewInvoice}
          >
            <Eye size={16} className="mr-2" />
            View Invoice
          </Button>
          <Button
            variant="primary"
            onClick={handleProceedToPayment}
          >
            <CreditCard size={16} className="mr-2" />
            Proceed to Payment
          </Button>
        </div>
      }
    >
      <div className="text-center py-6">
        <div className="mx-auto mb-4 text-green-500">
          <CheckCircle size={48} className="mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Invoice Created Successfully</h3>
        <p className="text-gray-600 mb-4">
          Your invoice has been created successfully. You can now view the invoice or proceed to record a payment.
        </p>
      </div>
    </Modal>
    </>
  );
};

export default InvoiceForm;