import React, { useState, useEffect } from 'react';
import { Globe, TrendingUp, RefreshCw, DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import CurrencySelector from '../components/Currency/CurrencySelector';
import { currencyService, Currency, CurrencyConversion } from '../services/currencyService';
import { formatCurrencyEnhanced } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';

const MultiCurrency: React.FC = () => {
  const [baseCurrency, setBaseCurrency] = useState('XAF');
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [amount, setAmount] = useState(1000);
  const [conversion, setConversion] = useState<CurrencyConversion | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
  const { showToast } = useToast();

  useEffect(() => {
    setCurrencies(currencyService.getSupportedCurrencies());
    loadExchangeRates();
  }, []);

  useEffect(() => {
    if (amount > 0) {
      handleConversion();
    }
  }, [amount, baseCurrency, targetCurrency]);

  const loadExchangeRates = async () => {
    const popularCurrencies = ['USD', 'EUR', 'GBP', 'XAF', 'NGN', 'ZAR'];
    const rates: { [key: string]: number } = {};

    for (const currency of popularCurrencies) {
      if (currency !== 'USD') {
        try {
          const rate = await currencyService.getExchangeRate('USD', currency);
          rates[`USD-${currency}`] = rate;
        } catch (error) {
          console.error(`Failed to get rate for USD-${currency}:`, error);
        }
      }
    }

    setExchangeRates(rates);
  };

  const handleConversion = async () => {
    if (amount <= 0 || baseCurrency === targetCurrency) {
      setConversion(null);
      return;
    }

    setIsConverting(true);
    try {
      const result = await currencyService.convertCurrency(amount, baseCurrency, targetCurrency);
      setConversion(result);
    } catch (error) {
      showToast('error', 'Failed to convert currency');
      setConversion(null);
    } finally {
      setIsConverting(false);
    }
  };

  const getRegionalCurrencies = (region: string) => {
    return currencyService.getRegionalCurrencies(region);
  };

  const regions = [
    { name: 'Africa', key: 'africa', icon: '🌍' },
    { name: 'Europe', key: 'europe', icon: '🇪🇺' },
    { name: 'Americas', key: 'americas', icon: '🌎' },
    { name: 'Asia', key: 'asia', icon: '🌏' }
  ];

  const getCurrencyFlag = (currencyCode: string): string => {
    const flagMap: { [key: string]: string } = {
      'USD': '🇺🇸', 'EUR': '🇪🇺', 'GBP': '🇬🇧', 'XAF': '🇨🇲', 'NGN': '🇳🇬',
      'ZAR': '🇿🇦', 'KES': '🇰🇪', 'GHS': '🇬🇭', 'CAD': '🇨🇦', 'AUD': '🇦🇺',
      'JPY': '🇯🇵', 'CNY': '🇨🇳', 'INR': '🇮🇳', 'MAD': '🇲🇦', 'EGP': '🇪🇬'
    };
    return flagMap[currencyCode] || '🌍';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center">
            <Globe className="mr-3 h-7 w-7 text-blue-900" />
            Multi-Currency Management
          </h1>
          <p className="text-black mt-1">
            Manage multiple currencies and real-time exchange rates
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadExchangeRates}
          icon={<RefreshCw className="h-4 w-4" />}
        >
          Refresh Rates
        </Button>
      </div>

      {/* Currency Converter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Currency Converter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">From</label>
                  <CurrencySelector
                    value={baseCurrency}
                    onChange={setBaseCurrency}
                    showConverter={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">To</label>
                  <CurrencySelector
                    value={targetCurrency}
                    onChange={setTargetCurrency}
                    showConverter={false}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              {isConverting ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-2"></div>
                  <p className="text-black">Converting...</p>
                </div>
              ) : conversion ? (
                <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="text-3xl font-bold text-black mb-2">
                    {formatCurrencyEnhanced(conversion.convertedAmount, conversion.toCurrency)}
                  </div>
                  <div className="text-sm text-black mb-2">
                    {formatCurrencyEnhanced(conversion.amount, conversion.fromCurrency)} = {formatCurrencyEnhanced(conversion.convertedAmount, conversion.toCurrency)}
                  </div>
                  <div className="text-xs text-black">
                    Rate: 1 {conversion.fromCurrency} = {conversion.exchangeRate.toFixed(4)} {conversion.toCurrency}
                  </div>
                  <div className="text-xs text-black mt-1">
                    Updated: {new Date(conversion.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center text-black">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p>Enter amount to see conversion</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Currencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {regions.map((region) => {
          const regionalCurrencies = getRegionalCurrencies(region.key);
          return (
            <Card key={region.key}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2 text-xl">{region.icon}</span>
                  {region.name} Currencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {regionalCurrencies.map((currency) => (
                    <div key={currency.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{getCurrencyFlag(currency.code)}</span>
                        <div>
                          <p className="font-medium text-black">{currency.code}</p>
                          <p className="text-sm text-black">{currency.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-black">{currency.symbol}</p>
                        {exchangeRates[`USD-${currency.code}`] && (
                          <p className="text-xs text-black">
                            1 USD = {exchangeRates[`USD-${currency.code}`].toFixed(2)} {currency.code}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Exchange Rate Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Popular Exchange Rates (Base: USD)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Rate (1 USD =)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Example
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(exchangeRates).map(([pair, rate]) => {
                  const [, toCurrency] = pair.split('-');
                  const currency = currencyService.getCurrency(toCurrency);
                  if (!currency) return null;
                  
                  return (
                    <tr key={pair} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-3">{getCurrencyFlag(toCurrency)}</span>
                          <span className="text-sm font-medium text-black">{currency.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-black">{toCurrency}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-black">{rate.toFixed(4)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-black">
                          $100 = {formatCurrencyEnhanced(100 * rate, toCurrency)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Currency Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-black mb-3">Default Currency</h3>
              <CurrencySelector
                value={baseCurrency}
                onChange={setBaseCurrency}
                showConverter={false}
              />
              <p className="text-sm text-black mt-2">
                This will be used as the default currency for new invoices
              </p>
            </div>
            <div>
              <h3 className="font-medium text-black mb-3">Cache Status</h3>
              <div className="space-y-2">
                {(() => {
                  const cacheStatus = currencyService.getCacheStatus();
                  return (
                    <>
                      <p className="text-sm text-black">
                        <strong>Cached Rates:</strong> {cacheStatus.size}
                      </p>
                      <p className="text-sm text-black">
                        <strong>Last Updated:</strong> {new Date(cacheStatus.lastFetch).toLocaleString()}
                      </p>
                      <p className="text-sm text-black">
                        <strong>Status:</strong> {cacheStatus.isExpired ? 'Expired' : 'Fresh'}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiCurrency;
