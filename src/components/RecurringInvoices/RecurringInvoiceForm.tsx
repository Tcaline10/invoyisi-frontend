import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecurringInvoice, RecurringFrequency, Client, InvoiceItem } from '../../types';
import { invoiceService, clientService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { ArrowLeft, Save, Plus, Trash2, Calculator } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import ErrorDisplay from '../../components/ui/ErrorDisplay';
import { formatCurrency } from '../../utils/formatters';

interface RecurringInvoiceFormProps {
  isEditing?: boolean;
  recurringInvoiceId?: string;
}

const RecurringInvoiceForm: React.FC<RecurringInvoiceFormProps> = ({
  isEditing = false,
  recurringInvoiceId
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextDate, setNextDate] = useState('');
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  // Define addItem function before it's used in useEffect
  const addItem = () => {
    const tempId = `temp-${Date.now()}`;
    const newItem: InvoiceItem = {
      id: tempId,
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
      invoice_id: '',
      created_at: new Date().toISOString()
    };

    setItems([...items, newItem]);
  };

  // Load clients and recurring invoice data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Initializing RecurringInvoiceForm...');

        // Set default next date to tomorrow immediately
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setNextDate(tomorrow.toISOString().split('T')[0]);

        // Add an empty item for new recurring invoices if not editing
        if (!isEditing) {
          addItem();
        }

        // Fetch clients - this should be faster now with caching
        console.log('Fetching clients data...');
        const clientsData = await clientService.getClients();
        setClients(clientsData);
        console.log(`Loaded ${clientsData.length} clients`);

        // If editing, fetch recurring invoice data
        if (isEditing && recurringInvoiceId) {
          console.log(`Fetching recurring invoice data for ID: ${recurringInvoiceId}`);
          const recurringInvoice = await invoiceService.getRecurringInvoice(recurringInvoiceId);

          // Populate form with recurring invoice data
          setName(recurringInvoice.name);
          setFrequency(recurringInvoice.frequency);
          setNextDate(recurringInvoice.next_date);

          // Ensure client_id is a string for the form
          const clientIdStr = recurringInvoice.client_id.toString();
          setClientId(clientIdStr);
          console.log('Setting client ID:', clientIdStr);

          // Set items
          const formattedItems = recurringInvoice.template.items.map((item, index) => ({
            id: `temp-${index}`,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
            invoice_id: '',
            created_at: new Date().toISOString()
          }));
          setItems(formattedItems);

          // Set other fields
          setSubtotal(recurringInvoice.template.subtotal);
          setTax(recurringInvoice.template.tax || 0);
          setDiscount(recurringInvoice.template.discount || 0);
          setTotal(recurringInvoice.template.total);
          setNotes(recurringInvoice.template.notes || '');
          setActive(recurringInvoice.active);
        }
      } catch (err) {
        console.error('Error loading form data:', err);
        setError('Failed to load form data. Please try again.');
      } finally {
        setLoading(false);
        console.log('RecurringInvoiceForm initialization complete');
      }
    };

    fetchData();
  }, [isEditing, recurringInvoiceId]);

  // Calculate totals whenever items, tax, or discount changes
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const newTotal = newSubtotal + tax - discount;

    setSubtotal(newSubtotal);
    setTotal(newTotal);
  }, [items, tax, discount]);

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate amount if quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? parseFloat(value) : newItems[index].quantity;
      const unitPrice = field === 'unit_price' ? parseFloat(value) : newItems[index].unit_price;
      newItems[index].amount = quantity * unitPrice;
    }

    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Validate form
      if (!name) {
        showToast('error', 'Please enter a name for the recurring invoice');
        return;
      }

      if (!clientId) {
        showToast('error', 'Please select a client');
        return;
      }

      if (!nextDate) {
        showToast('error', 'Please select the next invoice date');
        return;
      }

      if (items.length === 0) {
        showToast('error', 'Please add at least one item');
        return;
      }

      // Check if any item is missing description or has zero amount
      const invalidItem = items.find(item => !item.description || item.amount <= 0);
      if (invalidItem) {
        showToast('error', 'Please fill in all item details and ensure amounts are greater than zero');
        return;
      }

      // Create template object
      const template = {
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount
        })),
        subtotal,
        tax,
        discount,
        total,
        notes
      };

      // Create or update recurring invoice
      if (isEditing && recurringInvoiceId) {
        console.log('Updating recurring invoice with client ID:', clientId);
        await invoiceService.updateRecurringInvoice(recurringInvoiceId, {
          name,
          frequency,
          next_date: nextDate,
          template,
          active,
          client_id: clientId
        });

        showToast('success', 'Recurring invoice updated successfully');
      } else {
        console.log('Creating new recurring invoice with client ID:', clientId);
        await invoiceService.createRecurringInvoice({
          name,
          frequency,
          next_date: nextDate,
          template,
          active,
          client_id: clientId
        });

        showToast('success', 'Recurring invoice created successfully');
      }

      // Navigate back to recurring invoices list
      navigate('/recurring-invoices');
    } catch (err) {
      console.error('Error saving recurring invoice:', err);
      showToast('error', 'Failed to save recurring invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleBackClick = () => {
    navigate('/recurring-invoices');
  };

  if (loading) {
    return <LoadingSkeleton type="form" />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Recurring Invoices
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Recurring Invoice' : 'Create Recurring Invoice'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Recurring Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Monthly Website Maintenance"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="client">Client</Label>
                  <Select
                    id="client"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company ? `(${client.company})` : ''}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                    required
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="nextDate">Next Invoice Date</Label>
                  <Input
                    id="nextDate"
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    id="active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="active" className="cursor-pointer">Active</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Invoice Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Description</th>
                      <th className="text-right py-2 px-4 w-24">Quantity</th>
                      <th className="text-right py-2 px-4 w-32">Unit Price</th>
                      <th className="text-right py-2 px-4 w-32">Amount</th>
                      <th className="text-right py-2 px-4 w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2 px-4">
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                            required
                          />
                        </td>
                        <td className="py-2 px-4">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="text-right"
                            required
                          />
                        </td>
                        <td className="py-2 px-4">
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="text-right"
                            required
                          />
                        </td>
                        <td className="py-2 px-4 text-right">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-b">
                      <td colSpan={3} className="py-2 px-4 text-right font-medium">Subtotal</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(subtotal)}</td>
                      <td></td>
                    </tr>
                    <tr className="border-b">
                      <td colSpan={2} className="py-2 px-4 text-right font-medium">Tax</td>
                      <td className="py-2 px-4">
                        <Input
                          type="number"
                          value={tax}
                          onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="text-right"
                        />
                      </td>
                      <td className="py-2 px-4 text-right">{formatCurrency(tax)}</td>
                      <td></td>
                    </tr>
                    <tr className="border-b">
                      <td colSpan={2} className="py-2 px-4 text-right font-medium">Discount</td>
                      <td className="py-2 px-4">
                        <Input
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="text-right"
                        />
                      </td>
                      <td className="py-2 px-4 text-right">{formatCurrency(discount)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-2 px-4 text-right font-medium">Total</td>
                      <td className="py-2 px-4 text-right font-bold">{formatCurrency(total)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or terms..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleBackClick}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update' : 'Create'} Recurring Invoice
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default RecurringInvoiceForm;
