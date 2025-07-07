import React, { useState, useEffect } from 'react';
import { Brain, FileText, TrendingUp, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import InvoiceCategorization from '../components/AI/InvoiceCategorization';
import { useInvoices } from '../hooks/useInvoices';
import { useToast } from '../contexts/ToastContext';
import { aiService, InvoiceCategory } from '../services/aiService';
import { Invoice } from '../types';

const AICategorization: React.FC = () => {
  const { invoices, loading } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [categorizedInvoices, setCategorizedInvoices] = useState<{ [key: string]: InvoiceCategory }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();

  // Filter recent invoices for categorization
  const recentInvoices = invoices.slice(0, 10);

  const handleCategoryUpdate = (invoiceId: string, category: InvoiceCategory) => {
    setCategorizedInvoices(prev => ({
      ...prev,
      [invoiceId]: category
    }));
  };

  const processBatchCategorization = async () => {
    if (recentInvoices.length === 0) {
      showToast('warning', 'No invoices available for categorization');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const invoice of recentInvoices.slice(0, 5)) { // Process first 5 invoices
        try {
          const category = await aiService.categorizeInvoice(invoice);
          handleCategoryUpdate(invoice.id, category);
          successCount++;
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error categorizing invoice ${invoice.number}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        showToast('success', `Successfully categorized ${successCount} invoices`);
      }
      if (errorCount > 0) {
        showToast('warning', `Failed to categorize ${errorCount} invoices`);
      }
    } catch (error) {
      showToast('error', 'Batch categorization failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCategoryStats = () => {
    const categories: { [key: string]: number } = {};
    Object.values(categorizedInvoices).forEach(category => {
      categories[category.category] = (categories[category.category] || 0) + 1;
    });
    return categories;
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center">
            <Brain className="mr-3 h-7 w-7 text-blue-900" />
            AI Invoice Categorization
          </h1>
          <p className="text-black mt-1">
            Automatically categorize your invoices using artificial intelligence
          </p>
        </div>
        <Button
          variant="primary"
          onClick={processBatchCategorization}
          isLoading={isProcessing}
          icon={<Zap className="h-4 w-4" />}
        >
          {isProcessing ? 'Processing...' : 'Categorize Recent Invoices'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-900" />
              <div className="ml-4">
                <p className="text-sm font-medium text-black">Total Invoices</p>
                <p className="text-2xl font-bold text-black">{invoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-emerald-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-black">Categorized</p>
                <p className="text-2xl font-bold text-black">{Object.keys(categorizedInvoices).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-black">Categories</p>
                <p className="text-2xl font-bold text-black">{Object.keys(categoryStats).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-black">Success Rate</p>
                <p className="text-2xl font-bold text-black">
                  {invoices.length > 0 ? Math.round((Object.keys(categorizedInvoices).length / invoices.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      {Object.keys(categoryStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(categoryStats).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black">{category}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-blue-900 h-2 rounded-full"
                        style={{
                          width: `${(count / Object.values(categoryStats).reduce((a, b) => a + b, 0)) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-black font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Selection and Categorization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Invoice to Categorize</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
                <p className="text-black mt-2">Loading invoices...</p>
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-black">No invoices found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedInvoice?.id === invoice.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-black">{invoice.number}</p>
                        <p className="text-sm text-black">{invoice.client?.name || 'No client'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-black">${invoice.total}</p>
                        {categorizedInvoices[invoice.id] && (
                          <p className="text-xs text-emerald-600">
                            {categorizedInvoices[invoice.id].category}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          {selectedInvoice ? (
            <InvoiceCategorization
              invoice={selectedInvoice}
              onCategoryUpdate={(category) => handleCategoryUpdate(selectedInvoice.id, category)}
              autoAnalyze={false}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-black">Select an invoice to start AI categorization</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>How AI Categorization Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-blue-900" />
              </div>
              <h3 className="font-medium text-black mb-2">Document Analysis</h3>
              <p className="text-sm text-black">
                AI analyzes invoice content, items, and client information to understand the context
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Brain className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-medium text-black mb-2">Smart Classification</h3>
              <p className="text-sm text-black">
                Machine learning algorithms classify invoices into relevant business categories
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-black mb-2">Continuous Learning</h3>
              <p className="text-sm text-black">
                The system improves accuracy over time by learning from your business patterns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AICategorization;
