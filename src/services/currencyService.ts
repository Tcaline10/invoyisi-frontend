import axios from 'axios';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  decimalPlaces: number;
  position: 'before' | 'after'; // Symbol position
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

export interface CurrencyConversion {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount: number;
  exchangeRate: number;
  timestamp: string;
}

/**
 * Multi-Currency Service for handling currency operations
 */
class CurrencyService {
  private currencies: Currency[] = [
    {
      code: 'XAF',
      name: 'Central African CFA Franc',
      symbol: 'FCFA',
      locale: 'fr-CM',
      decimalPlaces: 0,
      position: 'after'
    },
    {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      locale: 'en-US',
      decimalPlaces: 2,
      position: 'before'
    },
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      locale: 'de-DE',
      decimalPlaces: 2,
      position: 'after'
    },
    {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      locale: 'en-GB',
      decimalPlaces: 2,
      position: 'before'
    },
    {
      code: 'CAD',
      name: 'Canadian Dollar',
      symbol: 'C$',
      locale: 'en-CA',
      decimalPlaces: 2,
      position: 'before'
    },
    {
      code: 'AUD',
      name: 'Australian Dollar',
      symbol: 'A$',
      locale: 'en-AU',
      decimalPlaces: 2,
      position: 'before'
    },
    {
      code: 'JPY',
      name: 'Japanese Yen',
      symbol: '¥',
      locale: 'ja-JP',
      decimalPlaces: 0,
      position: 'before'
    },
    {
      code: 'CNY',
      name: 'Chinese Yuan',
      symbol: '¥',
      locale: 'zh-CN',
      decimalPlaces: 2,
      position: 'before'
    },
    {
      code: 'INR',
      name: 'Indian Rupee',
      symbol: '₹',
      locale: 'en-IN',
      decimalPlaces: 2,
      position: 'before'
    },
    {
      code: 'NGN',
      name: 'Nigerian Naira',
      symbol: '₦',
      locale: 'en-NG',
      decimalPlaces: 2,
      position: 'before'
    },
    {
      code: 'ZAR',
      name: 'South African Rand',
      symbol: 'R',
      locale: 'en-ZA',
      decimalPlaces: 2,
      position: 'before'
    },
    {
      code: 'KES',
      name: 'Kenyan Shilling',
      symbol: 'KSh',
      locale: 'en-KE',
      decimalPlaces: 2,
      position: 'before'
    },
    {
      code: 'GHS',
      name: 'Ghanaian Cedi',
      symbol: '₵',
      locale: 'en-GH',
      decimalPlaces: 2,
      position: 'before'
    },
    {
      code: 'MAD',
      name: 'Moroccan Dirham',
      symbol: 'MAD',
      locale: 'ar-MA',
      decimalPlaces: 2,
      position: 'after'
    },
    {
      code: 'EGP',
      name: 'Egyptian Pound',
      symbol: 'E£',
      locale: 'ar-EG',
      decimalPlaces: 2,
      position: 'before'
    }
  ];

  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private cacheExpiry: number = 60 * 60 * 1000; // 1 hour
  private lastFetch: number = 0;

  /**
   * Get all supported currencies
   * @returns Currency[] - List of supported currencies
   */
  getSupportedCurrencies(): Currency[] {
    return this.currencies;
  }

  /**
   * Get currency by code
   * @param code - Currency code (e.g., 'USD', 'EUR')
   * @returns Currency | undefined
   */
  getCurrency(code: string): Currency | undefined {
    return this.currencies.find(c => c.code === code);
  }

  /**
   * Format amount with currency
   * @param amount - Amount to format
   * @param currencyCode - Currency code
   * @returns string - Formatted currency string
   */
  formatCurrency(amount: number, currencyCode: string): string {
    const currency = this.getCurrency(currencyCode);
    if (!currency) {
      return `${amount} ${currencyCode}`;
    }

    const formattedAmount = amount.toLocaleString(currency.locale, {
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces
    });

    if (currency.position === 'before') {
      return `${currency.symbol}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${currency.symbol}`;
    }
  }

  /**
   * Get exchange rate between two currencies
   * @param from - Source currency code
   * @param to - Target currency code
   * @returns Promise<number> - Exchange rate
   */
  async getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;

    const cacheKey = `${from}-${to}`;
    const cachedRate = this.exchangeRates.get(cacheKey);

    // Check if we have cached data and it's not expired
    if (cachedRate && (Date.now() - this.lastFetch < this.cacheExpiry)) {
      return cachedRate.rate;
    }

    try {
      // Fetch fresh exchange rates
      await this.fetchExchangeRates();
      const rate = this.exchangeRates.get(cacheKey);
      return rate ? rate.rate : 1;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Return cached rate if available, otherwise 1
      return cachedRate ? cachedRate.rate : 1;
    }
  }

  /**
   * Convert amount between currencies
   * @param amount - Amount to convert
   * @param from - Source currency code
   * @param to - Target currency code
   * @returns Promise<CurrencyConversion> - Conversion result
   */
  async convertCurrency(amount: number, from: string, to: string): Promise<CurrencyConversion> {
    const exchangeRate = await this.getExchangeRate(from, to);
    const convertedAmount = amount * exchangeRate;

    return {
      amount,
      fromCurrency: from,
      toCurrency: to,
      convertedAmount,
      exchangeRate,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get popular currencies for a region
   * @param region - Region code (e.g., 'africa', 'europe', 'americas')
   * @returns Currency[] - Popular currencies for the region
   */
  getRegionalCurrencies(region: string): Currency[] {
    const regionalMappings: { [key: string]: string[] } = {
      'africa': ['XAF', 'NGN', 'ZAR', 'KES', 'GHS', 'MAD', 'EGP'],
      'europe': ['EUR', 'GBP'],
      'americas': ['USD', 'CAD'],
      'asia': ['JPY', 'CNY', 'INR'],
      'oceania': ['AUD']
    };

    const codes = regionalMappings[region.toLowerCase()] || [];
    return this.currencies.filter(c => codes.includes(c.code));
  }

  /**
   * Detect currency from locale
   * @param locale - Browser locale (e.g., 'en-US', 'fr-FR')
   * @returns Currency | undefined
   */
  detectCurrencyFromLocale(locale: string): Currency | undefined {
    return this.currencies.find(c => c.locale === locale) || 
           this.currencies.find(c => c.locale.startsWith(locale.split('-')[0]));
  }

  /**
   * Get currency symbol
   * @param currencyCode - Currency code
   * @returns string - Currency symbol
   */
  getCurrencySymbol(currencyCode: string): string {
    const currency = this.getCurrency(currencyCode);
    return currency ? currency.symbol : currencyCode;
  }

  /**
   * Validate currency code
   * @param code - Currency code to validate
   * @returns boolean - Whether the currency is supported
   */
  isValidCurrency(code: string): boolean {
    return this.currencies.some(c => c.code === code);
  }

  /**
   * Get default currency (XAF for African market focus)
   * @returns Currency - Default currency
   */
  getDefaultCurrency(): Currency {
    return this.getCurrency('XAF') || this.currencies[0];
  }

  /**
   * Fetch exchange rates from API
   * @private
   */
  private async fetchExchangeRates(): Promise<void> {
    try {
      // Using a free exchange rate API (you can replace with your preferred service)
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
        timeout: 5000
      });

      const rates = response.data.rates;
      const timestamp = new Date().toISOString();

      // Store exchange rates
      Object.entries(rates).forEach(([currency, rate]) => {
        const cacheKey = `USD-${currency}`;
        this.exchangeRates.set(cacheKey, {
          from: 'USD',
          to: currency as string,
          rate: rate as number,
          lastUpdated: timestamp
        });

        // Also store reverse rate
        const reverseCacheKey = `${currency}-USD`;
        this.exchangeRates.set(reverseCacheKey, {
          from: currency as string,
          to: 'USD',
          rate: 1 / (rate as number),
          lastUpdated: timestamp
        });
      });

      // Calculate cross rates for non-USD pairs
      this.calculateCrossRates(rates);
      
      this.lastFetch = Date.now();
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Use fallback rates if API fails
      this.setFallbackRates();
    }
  }

  /**
   * Calculate cross rates between currencies
   * @private
   */
  private calculateCrossRates(usdRates: { [key: string]: number }): void {
    const currencies = Object.keys(usdRates);
    
    currencies.forEach(fromCurrency => {
      currencies.forEach(toCurrency => {
        if (fromCurrency !== toCurrency) {
          const cacheKey = `${fromCurrency}-${toCurrency}`;
          if (!this.exchangeRates.has(cacheKey)) {
            // Calculate cross rate: FROM -> USD -> TO
            const fromToUsd = 1 / usdRates[fromCurrency];
            const usdToTo = usdRates[toCurrency];
            const crossRate = fromToUsd * usdToTo;

            this.exchangeRates.set(cacheKey, {
              from: fromCurrency,
              to: toCurrency,
              rate: crossRate,
              lastUpdated: new Date().toISOString()
            });
          }
        }
      });
    });
  }

  /**
   * Set fallback exchange rates when API is unavailable
   * @private
   */
  private setFallbackRates(): void {
    const fallbackRates: { [key: string]: number } = {
      'USD-XAF': 600,
      'EUR-XAF': 650,
      'GBP-XAF': 750,
      'USD-NGN': 800,
      'USD-ZAR': 18,
      'USD-KES': 150,
      'USD-GHS': 12,
      'USD-EUR': 0.85,
      'USD-GBP': 0.75,
      'USD-CAD': 1.35,
      'USD-AUD': 1.50,
      'USD-JPY': 150,
      'USD-CNY': 7.2,
      'USD-INR': 83
    };

    Object.entries(fallbackRates).forEach(([pair, rate]) => {
      const [from, to] = pair.split('-');
      this.exchangeRates.set(pair, {
        from,
        to,
        rate,
        lastUpdated: new Date().toISOString()
      });

      // Add reverse rate
      const reversePair = `${to}-${from}`;
      this.exchangeRates.set(reversePair, {
        from: to,
        to: from,
        rate: 1 / rate,
        lastUpdated: new Date().toISOString()
      });
    });

    this.lastFetch = Date.now();
  }

  /**
   * Clear exchange rate cache
   */
  clearCache(): void {
    this.exchangeRates.clear();
    this.lastFetch = 0;
  }

  /**
   * Get cache status
   * @returns object - Cache information
   */
  getCacheStatus(): { size: number; lastFetch: string; isExpired: boolean } {
    return {
      size: this.exchangeRates.size,
      lastFetch: new Date(this.lastFetch).toISOString(),
      isExpired: Date.now() - this.lastFetch > this.cacheExpiry
    };
  }
}

export const currencyService = new CurrencyService();
