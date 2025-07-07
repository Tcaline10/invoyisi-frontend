/**
 * Utility functions for formatting data
 */

/**
 * Format a date string to a more readable format
 * @param dateString - Date string in ISO format (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "Jan 1, 2023")
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

// Currency configuration
export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  locale?: string;
  decimalPlaces?: number;
}

// Import the new currency service
import { currencyService } from '../services/currencyService';

// Legacy currency config interface for backward compatibility
export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  decimalPlaces?: number;
}

// Common currencies with their symbols and codes (kept for backward compatibility)
export const currencies: CurrencyConfig[] = [
  { code: 'XAF', name: 'Central African CFA franc', symbol: 'FCFA', locale: 'fr-FR', decimalPlaces: 0 },
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', decimalPlaces: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', locale: 'en-NG' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', locale: 'en-ZA' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', locale: 'en-KE' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', locale: 'en-GH' },
];

// Get currency configuration by code (enhanced with new service)
export const getCurrencyConfig = (code: string): CurrencyConfig => {
  const currency = currencyService.getCurrency(code);
  if (currency) {
    return {
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      locale: currency.locale,
      decimalPlaces: currency.decimalPlaces
    };
  }
  return currencies.find(c => c.code === code) || currencies[0];
};

/**
 * Format a number as currency
 * @param amount - Number to format as currency
 * @param currencyCode - Currency code (default: XAF)
 * @param options - Additional formatting options
 * @returns Formatted currency string (e.g., "FCFA 1,235")
 */
export const formatCurrency = (
  amount: number,
  currencyCode = 'XAF',
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  if (amount === undefined || amount === null) return '';

  const currencyConfig = getCurrencyConfig(currencyCode);
  const locale = currencyConfig.locale || 'en-US';
  const decimalPlaces = currencyConfig.decimalPlaces !== undefined ? currencyConfig.decimalPlaces : 2;

  const minimumFractionDigits = options?.minimumFractionDigits !== undefined
    ? options.minimumFractionDigits
    : decimalPlaces;

  const maximumFractionDigits = options?.maximumFractionDigits !== undefined
    ? options.maximumFractionDigits
    : decimalPlaces;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits,
    maximumFractionDigits,
    currencyDisplay: options?.showSymbol === false ? 'code' : 'symbol'
  }).format(amount);
};

/**
 * Enhanced currency formatting using the new currency service
 * @param amount - Number to format as currency
 * @param currencyCode - Currency code (default: XAF)
 * @returns Formatted currency string with proper positioning
 */
export const formatCurrencyEnhanced = (amount: number, currencyCode: string = 'XAF'): string => {
  try {
    return currencyService.formatCurrency(amount, currencyCode);
  } catch (error) {
    // Fallback to existing formatCurrency function
    return formatCurrency(amount, currencyCode);
  }
};

/**
 * Convert and format currency
 * @param amount - Amount to convert and format
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Promise<string> - Formatted converted amount
 */
export const convertAndFormatCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<string> => {
  try {
    const conversion = await currencyService.convertCurrency(amount, fromCurrency, toCurrency);
    return formatCurrencyEnhanced(conversion.convertedAmount, toCurrency);
  } catch (error) {
    console.error('Error converting currency:', error);
    return formatCurrencyEnhanced(amount, fromCurrency);
  }
};

/**
 * Convert amount from one currency to another
 * Note: In a real app, this would use live exchange rates from an API
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Converted amount
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  if (fromCurrency === toCurrency) return amount;

  // Sample exchange rates (as of May 2023)
  // In a real app, these would come from an API
  const exchangeRates: Record<string, Record<string, number>> = {
    'USD': {
      'XAF': 600.0,
      'EUR': 0.92,
      'GBP': 0.80,
      'CAD': 1.35,
      'AUD': 1.50,
      'JPY': 135.0,
      'CNY': 7.0,
      'INR': 82.0,
      'NGN': 460.0,
      'ZAR': 18.0,
      'KES': 135.0,
      'GHS': 11.0
    },
    'XAF': {
      'USD': 0.00167,
      'EUR': 0.00152,
      'GBP': 0.00133,
      'CAD': 0.00225,
      'AUD': 0.00250,
      'JPY': 0.225,
      'CNY': 0.0117,
      'INR': 0.137,
      'NGN': 0.767,
      'ZAR': 0.030,
      'KES': 0.225,
      'GHS': 0.0183
    }
  };

  // Convert to USD first if direct rate not available
  if (fromCurrency !== 'USD' && !exchangeRates[fromCurrency]) {
    const usdAmount = amount / exchangeRates['USD'][fromCurrency];
    return convertCurrency(usdAmount, 'USD', toCurrency);
  }

  // Direct conversion
  if (exchangeRates[fromCurrency] && exchangeRates[fromCurrency][toCurrency]) {
    return amount * exchangeRates[fromCurrency][toCurrency];
  }

  // Convert through USD
  if (exchangeRates['USD'][fromCurrency] && exchangeRates['USD'][toCurrency]) {
    const usdAmount = amount / exchangeRates['USD'][fromCurrency];
    return usdAmount * exchangeRates['USD'][toCurrency];
  }

  // Fallback: no conversion
  console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
  return amount;
};

/**
 * Format a number as a percentage
 * @param value - Number to format as percentage
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string (e.g., "12.34%")
 */
export const formatPercentage = (value: number, decimals = 2): string => {
  if (value === undefined || value === null) return '';

  return `${value.toFixed(decimals)}%`;
};

/**
 * Format a phone number to a standard format
 * @param phone - Phone number string
 * @returns Formatted phone number (e.g., "(123) 456-7890")
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Check if it's a valid US phone number
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  // Return original if not a standard format
  return phone;
};

/**
 * Truncate text to a specified length and add ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation (default: 50)
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength = 50): string => {
  if (!text) return '';

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format a file size in bytes to a human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size (e.g., "1.23 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format a time string to a localized time format
 * @param timeString - ISO date string or Date object
 * @returns Formatted time string (e.g., "3:45 PM")
 */
export const formatTime = (
  timeString: string | Date
): string => {
  if (!timeString) return 'N/A';

  try {
    const date = typeof timeString === 'string' ? new Date(timeString) : timeString;
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};

/**
 * Format a date range
 * @param startDate - Start date string or Date object
 * @param endDate - End date string or Date object
 * @returns Formatted date range string
 */
export const formatDateRange = (
  startDate: string | Date,
  endDate: string | Date
): string => {
  if (!startDate || !endDate) return 'N/A';

  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    // If same day, show only one date
    if (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate()
    ) {
      return `${formatDate(start.toISOString())}`;
    }

    // If same month and year, show abbreviated format
    if (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth()
    ) {
      return `${start.getDate()} - ${formatDate(end.toISOString())}`;
    }

    // Otherwise show full range
    return `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return 'Invalid date range';
  }
};

/**
 * Format a relative time (time ago)
 * @param dateString - ISO date string or Date object
 * @returns Formatted relative time string (e.g., "2 hours ago")
 */
export const formatTimeAgo = (dateString: string | Date): string => {
  if (!dateString) return 'N/A';

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    const diffWeek = Math.round(diffDay / 7);
    const diffMonth = Math.round(diffDay / 30);
    const diffYear = Math.round(diffDay / 365);

    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay < 7) return `${diffDay} days ago`;
    if (diffWeek < 4) return `${diffWeek} weeks ago`;
    if (diffMonth < 12) return `${diffMonth} months ago`;
    return `${diffYear} years ago`;
  } catch (error) {
    console.error('Error formatting time ago:', error);
    return 'Invalid date';
  }
};
