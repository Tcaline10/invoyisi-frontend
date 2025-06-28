import React, { useState } from 'react';
import { X, AlertTriangle, Lock } from 'lucide-react';
import Button from '../ui/Button';
import { supabase } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate confirmation text
    if (confirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type DELETE MY ACCOUNT to confirm');
      return;
    }

    setLoading(true);

    try {
      // First, verify the password by trying to sign in
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email;
      
      if (!userEmail) {
        setError('Unable to verify your identity');
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      });

      if (signInError) {
        setError('Password is incorrect');
        setLoading(false);
        return;
      }

      // Get the user ID
      const userId = userData.user?.id;
      
      if (!userId) {
        setError('Unable to retrieve your account information');
        setLoading(false);
        return;
      }

      // Delete user data from database tables
      // This should be done in a transaction or with cascading deletes in the database
      
      // 1. Delete user's companies
      await supabase.from('companies').delete().eq('user_id', userId);
      
      // 2. Delete user's invoice items (through invoices)
      const { data: invoices } = await supabase.from('invoices').select('id').eq('user_id', userId);
      if (invoices && invoices.length > 0) {
        const invoiceIds = invoices.map(invoice => invoice.id);
        await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds);
      }
      
      // 3. Delete user's invoices
      await supabase.from('invoices').delete().eq('user_id', userId);
      
      // 4. Delete user's recurring invoices
      await supabase.from('recurring_invoices').delete().eq('user_id', userId);
      
      // 5. Delete user's clients
      await supabase.from('clients').delete().eq('user_id', userId);
      
      // 6. Delete user's profile
      await supabase.from('users').delete().eq('id', userId);
      
      // 7. Finally, delete the auth user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Sign out
      await supabase.auth.signOut();
      
      // Redirect to signin page
      navigate('/signin');
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting your account');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-red-600 flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            Delete Account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            <p className="font-medium">Warning: This action cannot be undone</p>
            <p className="mt-1 text-sm">
              Deleting your account will permanently remove all your data, including invoices, clients, and settings.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Enter your password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Type "DELETE MY ACCOUNT" to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="block w-full py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="DELETE MY ACCOUNT"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                type="submit"
                loading={loading}
              >
                Delete Account
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
