import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, Phone, MapPin, Building } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { clientService } from '../../services/api';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        setIsSubmitting(true);
        setSubmitError(null);

        // Save the client data to the database
        const newClient = await clientService.createClient(formData);

        // Close modal and navigate to the new client's page
        onClose();
        navigate(`/clients/${newClient.id}`);
      } catch (err) {
        console.error('Error creating client:', err);
        setSubmitError('Failed to create client. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleQuickAdd = async () => {
    if (validateForm()) {
      try {
        setIsSubmitting(true);
        setSubmitError(null);

        // Save the client data to the database
        await clientService.createClient(formData);

        // Close modal and stay on current page
        onClose();
        // Force a refresh of the clients list
        window.location.reload();
      } catch (err) {
        console.error('Error creating client:', err);
        setSubmitError('Failed to create client. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Client"
      size="md"
      footer={
        <>
          {submitError && (
            <div className="text-red-500 text-sm mb-2 w-full">
              {submitError}
            </div>
          )}
          <div className="flex justify-end space-x-2 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleQuickAdd}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Quick Add'}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save & View Details'}
            </Button>
          </div>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Client Name"
          name="name"
          placeholder="Enter client name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          prefix={<Users size={16} className="text-gray-400" />}
          fullWidth
        />

        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="client@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          prefix={<Mail size={16} className="text-gray-400" />}
          fullWidth
        />

        <Input
          label="Phone Number"
          name="phone"
          placeholder="+1 (555) 123-4567"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          prefix={<Phone size={16} className="text-gray-400" />}
          fullWidth
        />

        <Input
          label="Address"
          name="address"
          placeholder="123 Business St, City, Country"
          value={formData.address}
          onChange={handleChange}
          error={errors.address}
          prefix={<MapPin size={16} className="text-gray-400" />}
          fullWidth
        />

        <Input
          label="Company Name"
          name="company"
          placeholder="Company name (optional)"
          value={formData.company}
          onChange={handleChange}
          error={errors.company}
          prefix={<Building size={16} className="text-gray-400" />}
          fullWidth
        />
      </form>
    </Modal>
  );
};

export default AddClientModal;
