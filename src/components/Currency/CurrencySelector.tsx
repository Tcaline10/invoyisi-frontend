import React, { useState, useEffect } from 'react';
import { Globe, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { Select } from '../ui/Select';
import Button from '../ui/Button';
import { currencyService, Currency, CurrencyConversion } from '../../services/currencyService';
import { formatCurrencyEnhanced } from '../../utils/formatters';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  showConverter?: boolean;
  region?: string;
  className?: string;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  showConverter = false,
  region,
  className = ''
}) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [converterAmount, setConverterAmount] = useState<number>(100);
  const [converterFrom, setConverterFrom] = useState<string>('USD');
  const [converterTo, setConverterTo] = useState<string>('XAF');
  const [conversion, setConversion] = useState<CurrencyConversion | null>(null);
  const [conversionLoading, setConversionLoading] = useState(false);

  useEffect(() => {
    loadCurrencies();
  }, [region]);

  useEffect(() => {
    if (showConverter) {
      handleConvert();
    }
  }, [converterAmount, converterFrom, converterTo, showConverter]);

  const loadCurrencies = () => {
    setIsLoading(true);
    try {
      let availableCurrencies: Currency[];
      
      if (region) {
        availableCurrencies = currencyService.getRegionalCurrencies(region);
        // If no regional currencies found, fall back to all currencies
        if (availableCurrencies.length === 0) {
          availableCurrencies = currencyService.getSupportedCurrencies();
        }
      } else {
        availableCurrencies = currencyService.getSupportedCurrencies();
      }

      setCurrencies(availableCurrencies);
    } catch (error) {
      console.error('Error loading currencies:', error);
      setCurrencies(currencyService.getSupportedCurrencies());
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!showConverter || converterAmount <= 0) return;

    setConversionLoading(true);
    try {
      const result = await currencyService.convertCurrency(
        converterAmount,
        converterFrom,
        converterTo
      );
      setConversion(result);
    } catch (error) {
      console.error('Error converting currency:', error);
      setConversion(null);
    } finally {
      setConversionLoading(false);
    }
  };

  const getPopularCurrencies = (): Currency[] => {
    const popularCodes = ['USD', 'EUR', 'GBP', 'XAF', 'NGN', 'ZAR'];
    return currencies.filter(c => popularCodes.includes(c.code));
  };

  const getOtherCurrencies = (): Currency[] => {
    const popularCodes = ['USD', 'EUR', 'GBP', 'XAF', 'NGN', 'ZAR'];
    return currencies.filter(c => !popularCodes.includes(c.code));
  };

  const getCurrencyFlag = (currencyCode: string): string => {
    const flagMap: { [key: string]: string } = {
      'USD': '🇺🇸',
      'EUR': '🇪🇺',
      'GBP': '🇬🇧',
      'XAF': '🇨🇲',
      'NGN': '🇳🇬',
      'ZAR': '🇿🇦',
      'KES': '🇰🇪',
      'GHS': '🇬🇭',
      'CAD': '🇨🇦',
      'AUD': '🇦🇺',
      'JPY': '🇯🇵',
      'CNY': '🇨🇳',
      'INR': '🇮🇳',
      'MAD': '🇲🇦',
      'EGP': '🇪🇬'
    };
    return flagMap[currencyCode] || '🌍';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Currency Selector */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          <Globe className="inline h-4 w-4 mr-1" />
          Currency
        </label>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
        >
          {isLoading ? (
            <option>Loading currencies...</option>
          ) : (
            <>
              <optgroup label="Popular Currencies">
                {getPopularCurrencies().map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {getCurrencyFlag(currency.code)} {currency.code} - {currency.name}
                  </option>
                ))}
              </optgroup>
              {getOtherCurrencies().length > 0 && (
                <optgroup label="Other Currencies">
                  {getOtherCurrencies().map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {getCurrencyFlag(currency.code)} {currency.code} - {currency.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </>
          )}
        </Select>
      </div>

      {/* Currency Converter */}
      {showConverter && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-black flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Currency Converter
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleConvert}
              icon={<RefreshCw className="h-3 w-3" />}
            >
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-black mb-1">
                Amount
              </label>
              <input
                type="number"
                value={converterAmount}
                onChange={(e) => setConverterAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black mb-1">
                From
              </label>
              <Select
                value={converterFrom}
                onChange={(e) => setConverterFrom(e.target.value)}
                className="text-sm"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-black mb-1">
                To
              </label>
              <Select
                value={converterTo}
                onChange={(e) => setConverterTo(e.target.value)}
                className="text-sm"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {conversionLoading ? (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : conversion ? (
            <div className="bg-white rounded-md p-3 border">
              <div className="text-center">
                <div className="text-lg font-semibold text-black">
                  {formatCurrencyEnhanced(conversion.amount, conversion.fromCurrency)} = {' '}
                  {formatCurrencyEnhanced(conversion.convertedAmount, conversion.toCurrency)}
                </div>
                <div className="text-xs text-black mt-1">
                  Rate: 1 {conversion.fromCurrency} = {conversion.exchangeRate.toFixed(4)} {conversion.toCurrency}
                </div>
                <div className="text-xs text-black mt-1">
                  Last updated: {new Date(conversion.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-black text-sm">
              <AlertCircle className="h-4 w-4 mx-auto mb-1" />
              Unable to fetch exchange rate
            </div>
          )}
        </div>
      )}

      {/* Currency Info */}
      {value && (
        <div className="text-xs text-black">
          <div className="flex items-center justify-between">
            <span>
              Selected: {getCurrencyFlag(value)} {currencyService.getCurrency(value)?.name}
            </span>
            <span>
              Symbol: {currencyService.getCurrencySymbol(value)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
