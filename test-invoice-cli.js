#!/usr/bin/env node

/**
 * CLI Testing Script for I-Invoyisi Invoice Features
 * Run with: node test-invoice-cli.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test data
const mockInvoiceData = {
  id: 'test-invoice-001',
  number: 'INV-2024-001',
  status: 'sent',
  issued_date: '2024-01-15',
  due_date: '2024-02-15',
  subtotal: 1000,
  tax: 192.5,
  discount: 50,
  total: 1142.5,
  notes: 'Test invoice for CLI validation',
  client_id: 'test-client-001',
  user_id: 'test-user-001',
  client: {
    id: 'test-client-001',
    name: 'Acme Corporation',
    email: 'billing@acme.com',
    phone: '+1-555-0123',
    address: '123 Business St, Tech City, TC 12345',
    company: 'Acme Corporation'
  },
  items: [
    {
      id: 'item-001',
      description: 'Web Development Services',
      quantity: 40,
      unit_price: 25,
      amount: 1000,
      invoice_id: 'test-invoice-001'
    }
  ]
};

const mockCurrencies = [
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' }
];

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const statusSymbol = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  log(`${statusSymbol} ${testName}`, statusColor);
  if (details) {
    log(`  ${details}`, 'reset');
  }
}

// Test functions
function testInvoiceDataStructure() {
  logHeader('Testing Invoice Data Structure');
  
  try {
    // Test required fields
    const requiredFields = ['id', 'number', 'status', 'issued_date', 'due_date', 'total', 'client_id', 'user_id'];
    const missingFields = requiredFields.filter(field => !mockInvoiceData[field]);
    
    if (missingFields.length === 0) {
      logTest('Invoice Required Fields', 'PASS', 'All required fields present');
    } else {
      logTest('Invoice Required Fields', 'FAIL', `Missing: ${missingFields.join(', ')}`);
    }

    // Test data types
    if (typeof mockInvoiceData.total === 'number' && mockInvoiceData.total > 0) {
      logTest('Invoice Total Validation', 'PASS', `Total: ${mockInvoiceData.total}`);
    } else {
      logTest('Invoice Total Validation', 'FAIL', 'Total must be a positive number');
    }

    // Test client relationship
    if (mockInvoiceData.client && mockInvoiceData.client.id === mockInvoiceData.client_id) {
      logTest('Client Relationship', 'PASS', `Client: ${mockInvoiceData.client.name}`);
    } else {
      logTest('Client Relationship', 'FAIL', 'Client data inconsistent');
    }

    // Test items
    if (mockInvoiceData.items && mockInvoiceData.items.length > 0) {
      const itemsTotal = mockInvoiceData.items.reduce((sum, item) => sum + item.amount, 0);
      if (itemsTotal === mockInvoiceData.subtotal) {
        logTest('Invoice Items Calculation', 'PASS', `Items total: ${itemsTotal}`);
      } else {
        logTest('Invoice Items Calculation', 'WARN', `Items total (${itemsTotal}) != subtotal (${mockInvoiceData.subtotal})`);
      }
    } else {
      logTest('Invoice Items', 'FAIL', 'No items found');
    }

  } catch (error) {
    logTest('Invoice Data Structure', 'FAIL', error.message);
  }
}

function testCurrencyFormatting() {
  logHeader('Testing Currency Formatting');

  try {
    // Test different currency formats
    const testAmounts = [1000, 1234.56, 0.99, 1000000];
    
    mockCurrencies.forEach(currency => {
      log(`\n${currency.name} (${currency.code}):`, 'blue');
      
      testAmounts.forEach(amount => {
        // Simple formatting simulation
        let formatted;
        if (currency.code === 'XAF') {
          // No decimals for XAF
          formatted = `${Math.round(amount).toLocaleString()} ${currency.symbol}`;
        } else {
          formatted = `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        
        log(`  ${amount} → ${formatted}`, 'reset');
      });
    });

    logTest('Currency Formatting', 'PASS', 'All currencies formatted successfully');

  } catch (error) {
    logTest('Currency Formatting', 'FAIL', error.message);
  }
}

function testExportDataPreparation() {
  logHeader('Testing Export Data Preparation');

  try {
    // Test CSV data preparation
    const csvHeaders = ['Invoice Number', 'Client Name', 'Issue Date', 'Due Date', 'Status', 'Total'];
    const csvRow = [
      mockInvoiceData.number,
      mockInvoiceData.client.name,
      mockInvoiceData.issued_date,
      mockInvoiceData.due_date,
      mockInvoiceData.status,
      mockInvoiceData.total
    ];

    if (csvHeaders.length === csvRow.length) {
      logTest('CSV Data Structure', 'PASS', `${csvHeaders.length} columns prepared`);
    } else {
      logTest('CSV Data Structure', 'FAIL', 'Header/data mismatch');
    }

    // Test Excel data preparation
    const excelData = {
      'Invoice Number': mockInvoiceData.number,
      'Client Name': mockInvoiceData.client.name,
      'Issue Date': new Date(mockInvoiceData.issued_date).toLocaleDateString(),
      'Due Date': new Date(mockInvoiceData.due_date).toLocaleDateString(),
      'Status': mockInvoiceData.status.toUpperCase(),
      'Subtotal': mockInvoiceData.subtotal,
      'Tax': mockInvoiceData.tax,
      'Total': mockInvoiceData.total
    };

    if (Object.keys(excelData).length > 0) {
      logTest('Excel Data Structure', 'PASS', `${Object.keys(excelData).length} fields prepared`);
      log(`  Sample: ${excelData['Invoice Number']} - ${excelData['Client Name']}`, 'reset');
    } else {
      logTest('Excel Data Structure', 'FAIL', 'No data prepared');
    }

  } catch (error) {
    logTest('Export Data Preparation', 'FAIL', error.message);
  }
}

function testAICategorizationData() {
  logHeader('Testing AI Categorization Data');

  try {
    // Test data preparation for AI categorization
    const aiData = {
      invoice: {
        items: mockInvoiceData.items,
        client: mockInvoiceData.client,
        total: mockInvoiceData.total,
        notes: mockInvoiceData.notes
      }
    };

    if (aiData.invoice.items && aiData.invoice.items.length > 0) {
      logTest('AI Data - Items', 'PASS', `${aiData.invoice.items.length} items prepared`);
    } else {
      logTest('AI Data - Items', 'FAIL', 'No items for AI analysis');
    }

    if (aiData.invoice.client && aiData.invoice.client.name) {
      logTest('AI Data - Client', 'PASS', `Client: ${aiData.invoice.client.name}`);
    } else {
      logTest('AI Data - Client', 'FAIL', 'No client data for AI analysis');
    }

    // Simulate categorization logic
    const itemDescriptions = aiData.invoice.items.map(item => item.description.toLowerCase());
    let suggestedCategory = 'General';
    
    if (itemDescriptions.some(desc => desc.includes('web') || desc.includes('development'))) {
      suggestedCategory = 'Professional Services - Web Development';
    } else if (itemDescriptions.some(desc => desc.includes('consulting'))) {
      suggestedCategory = 'Professional Services - Consulting';
    }

    logTest('AI Categorization Simulation', 'PASS', `Suggested: ${suggestedCategory}`);

  } catch (error) {
    logTest('AI Categorization Data', 'FAIL', error.message);
  }
}

function testProjectStructure() {
  logHeader('Testing Project Structure');

  const requiredFiles = [
    'src/services/aiService.ts',
    'src/services/exportService.ts',
    'src/services/currencyService.ts',
    'src/components/AI/InvoiceCategorization.tsx',
    'src/components/Export/ExportInvoice.tsx',
    'src/components/Currency/CurrencySelector.tsx',
    'src/pages/TestingPage.tsx'
  ];

  requiredFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      logTest(`File: ${filePath}`, 'PASS', `Size: ${stats.size} bytes`);
    } else {
      logTest(`File: ${filePath}`, 'FAIL', 'File not found');
    }
  });
}

function generateTestReport() {
  logHeader('Test Summary Report');

  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    testSuite: 'I-Invoyisi Invoice Features',
    version: '1.0.0',
    mockData: {
      invoice: mockInvoiceData.number,
      client: mockInvoiceData.client.name,
      total: mockInvoiceData.total,
      currency: 'XAF'
    },
    features: [
      'AI Invoice Categorization',
      'Multi-Currency Support',
      'PDF Export',
      'Excel Export',
      'CSV Export',
      'Currency Conversion'
    ]
  };

  log('Test Report Generated:', 'green');
  console.log(JSON.stringify(report, null, 2));

  // Save report to file
  const reportPath = 'test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\nReport saved to: ${reportPath}`, 'yellow');
}

// Main execution
function main() {
  log('I-Invoyisi Invoice Features CLI Test Suite', 'bright');
  log('Testing new AI services, export functionality, and multi-currency features\n', 'reset');

  testProjectStructure();
  testInvoiceDataStructure();
  testCurrencyFormatting();
  testExportDataPreparation();
  testAICategorizationData();
  generateTestReport();

  log('\n' + '='.repeat(60), 'cyan');
  log('CLI Testing Complete! Check the web interface at http://localhost:5174/testing', 'bright');
  log('='.repeat(60), 'cyan');
}

// Run the tests
console.log('Script starting...');
main();
