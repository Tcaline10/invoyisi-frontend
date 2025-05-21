import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { User, Mail, Phone, MapPin, Building, Save } from 'lucide-react';
import { Client } from '../../types';
import { clientService } from '../../services/api';

interface ClientFormProps {
  isEditing?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({ isEditing = false }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '', // This will be mapped to company_name in the API
    company_name: '',
    notes: ''
  });

  useEffect(() => {
    // If editing, fetch client data
    if (isEditing && id) {
      const fetchClient = async () => {
        try {
          setLoading(true);
          const data = await clientService.getClient(id);
          setFormData({
            name: data.name,
            email: data.email,
            phone: data.phone || '',
            address: data.address || '',
            company: data.company || '',
            notes: data.notes || ''
          });
        } catch (err) {
          console.error('Error fetching client:', err);
          setError('Failed to load client details');
        } finally {
          setLoading(false);
        }
      };

      fetchClient();
    }
  }, [isEditing, id]);

  const handleChange = (field: keyof Client, value: string) => {
    const updatedData = {
      ...formData,
      [field]: value
    };

    // Sync company and company_name fields
    if (field === 'company') {
      updatedData.company_name = value;
    } else if (field === 'company_name') {
      updatedData.company = value;
    }

    setFormData(updatedData);
  };

  const validateForm = () => {
    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      if (isEditing && id) {
        // Update existing client
        await clientService.updateClient(id, formData);
        setSuccessMessage('Client updated successfully!');
      } else {
        // Create new client
        await clientService.createClient(formData);
        setSuccessMessage('Client created successfully!');
      }

      // Navigate back to clients list after a short delay
      setTimeout(() => {
        navigate('/clients');
      }, 1500);

    } catch (err) {
      console.error('Error saving client:', err);
      setError('Failed to save client. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/clients');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-medium text-gray-900">Loading client details...</h2>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Client' : 'Add New Client'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-md">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md">
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              placeholder="Client name"
              icon={<User size={16} />}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="client@example.com"
              icon={<Mail size={16} />}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              placeholder="+1 (555) 123-4567"
              icon={<Phone size={16} />}
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
            <Input
              label="Company"
              placeholder="Company name"
              icon={<Building size={16} />}
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
            />
          </div>

          <Input
            label="Address"
            placeholder="Full address"
            icon={<MapPin size={16} />}
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Additional notes about this client"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            {saving && (
              <span className="text-blue-600 flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                Saving...
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              type="button"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={<Save size={16} />}
              disabled={saving}
            >
              {isEditing ? 'Update Client' : 'Save Client'}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ClientForm;
