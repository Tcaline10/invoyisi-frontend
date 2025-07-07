import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Check, ChevronDown } from 'lucide-react';

// Common currencies with their symbols and codes
const currencies = [
  { code: 'XAF', name: 'Central African CFA franc', symbol: 'FCFA' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
];

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCurrencies, setFilteredCurrencies] = useState(currencies);

  // Get the selected currency details
  const currentCurrency = currencies.find(c => c.code === selectedCurrency) || currencies[0];

  // Filter currencies based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = currencies.filter(
        currency => 
          currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          currency.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCurrencies(filtered);
    } else {
      setFilteredCurrencies(currencies);
    }
  }, [searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-500">
          Select the currency to use for all invoices and payments.
        </div>
        
        <div className="relative">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="flex items-center">
              <span className="mr-2">{currentCurrency.symbol}</span>
              <span>{currentCurrency.code} - {currentCurrency.name}</span>
            </span>
            <ChevronDown size={16} />
          </Button>
          
          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search currencies..."
                  className="w-full p-2 border border-gray-200 rounded-md text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                      currency.code === selectedCurrency ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      onCurrencyChange(currency.code);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <span className="flex items-center">
                      <span className="mr-2">{currency.symbol}</span>
                      <span>{currency.code} - {currency.name}</span>
                    </span>
                    {currency.code === selectedCurrency && <Check size={16} className="text-blue-600" />}
                  </button>
                ))}
                {filteredCurrencies.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No currencies found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-500 mt-4">
          <p>Current currency: <strong>{currentCurrency.symbol} {currentCurrency.code}</strong></p>
          <p className="mt-2">This will be used as the default currency for all new invoices.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencySelector;
