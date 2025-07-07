import React, { useState, useEffect } from 'react';
import { Brain, Tag, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { aiService, InvoiceCategory } from '../../services/aiService';
import { Invoice } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface InvoiceCategorizationProps {
  invoice: Invoice;
  onCategoryUpdate?: (category: InvoiceCategory) => void;
  autoAnalyze?: boolean;
}

const InvoiceCategorization: React.FC<InvoiceCategorizationProps> = ({
  invoice,
  onCategoryUpdate,
  autoAnalyze = false
}) => {
  const [category, setCategory] = useState<InvoiceCategory | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (autoAnalyze && invoice) {
      analyzeInvoice();
    }
  }, [invoice, autoAnalyze]);

  const analyzeInvoice = async () => {
    if (!invoice) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await aiService.categorizeInvoice(invoice);
      setCategory(result);
      
      if (onCategoryUpdate) {
        onCategoryUpdate(result);
      }

      showToast('success', `Invoice categorized as: ${result.category}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to categorize invoice';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'danger';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 0.6) return <AlertCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-blue-900" />
          AI Invoice Categorization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!category && !isAnalyzing && (
            <div className="text-center py-6">
              <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-black mb-4">
                Use AI to automatically categorize this invoice based on its content and client information.
              </p>
              <Button
                variant="primary"
                onClick={analyzeInvoice}
                icon={<Brain className="h-4 w-4" />}
              >
                Analyze Invoice
              </Button>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-4"></div>
              <p className="text-black">Analyzing invoice with AI...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-black">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeInvoice}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          {category && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-900 flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    Category Analysis
                  </h4>
                  <Badge variant={getConfidenceColor(category.confidence)}>
                    {getConfidenceIcon(category.confidence)}
                    <span className="ml-1">
                      {Math.round(category.confidence * 100)}% confidence
                    </span>
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-black">Primary Category:</span>
                    <div className="mt-1">
                      <Badge variant="primary" className="text-sm">
                        {category.category}
                      </Badge>
                    </div>
                  </div>

                  {category.subcategory && (
                    <div>
                      <span className="text-sm font-medium text-black">Subcategory:</span>
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-sm">
                          {category.subcategory}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {category.tags && category.tags.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-black">Tags:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {category.tags.map((tag, index) => (
                          <Badge key={index} variant="info" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={analyzeInvoice}
                  icon={<Brain className="h-4 w-4" />}
                >
                  Re-analyze
                </Button>
                
                <div className="text-xs text-black">
                  Powered by AI • Last analyzed: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* Category Insights */}
          {category && category.confidence > 0.7 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
              <h5 className="font-medium text-emerald-900 flex items-center mb-2">
                <TrendingUp className="h-4 w-4 mr-2" />
                Insights
              </h5>
              <ul className="text-sm text-black space-y-1">
                <li>• This categorization can help with expense tracking and tax reporting</li>
                <li>• Similar invoices will be automatically categorized in the future</li>
                {category.category === 'Professional Services' && (
                  <li>• Consider setting up recurring billing for ongoing services</li>
                )}
                {category.category === 'Office Supplies' && (
                  <li>• Track these expenses for business deductions</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceCategorization;
