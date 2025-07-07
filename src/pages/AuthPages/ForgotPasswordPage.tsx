import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { FileText } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic validation
    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      // In a real implementation, you would connect to your backend to send a password reset email
      // For now, we'll simulate a successful request since we haven't implemented this endpoint yet
      setTimeout(() => {
        console.log('Password reset requested for:', email);
        setSuccess(true);
        setIsLoading(false);
      }, 1500);

      // When the backend endpoint is ready, you would use:
      // const response = await fetch('http://localhost:8000/api/auth/reset-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // });
      // if (response.ok) {
      //   setSuccess(true);
      // } else {
      //   const data = await response.json();
      //   throw new Error(data.detail || 'Failed to send reset email');
      // }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-900 text-white">
            <FileText size={32} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Check your email</h3>
              <p className="mt-2 text-sm text-gray-500">
                We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.
              </p>
              <div className="mt-6">
                <Link
                  to="/signin"
                  className="text-sm font-medium text-blue-900 hover:text-blue-800"
                >
                  Return to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={isLoading}
                  className="relative"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </div>

              <div className="text-center">
                <Link
                  to="/signin"
                  className="text-sm font-medium text-blue-900 hover:text-blue-800"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
