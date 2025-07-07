import React, { useState } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { geminiService } from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';

interface ClientSummaryProps {
  clientId: string;
  clientName: string;
}

const ClientSummary: React.FC<ClientSummaryProps> = ({ clientId, clientName }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const generateSummary = async () => {
    try {
      setIsLoading(true);
      showToast('info', 'Generating client summary...');

      const result = await geminiService.generateSummary(null, null, clientId);

      setSummary(result.summary);
      showToast('success', 'Summary generated successfully');
    } catch (error) {
      console.error('Error generating client summary:', error);
      showToast('error', 'Failed to generate client summary');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <ClipboardList className="mr-2" size={20} />
          Client Summary
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={generateSummary}
          isLoading={isLoading}
          disabled={isLoading}
          icon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
        >
          {summary ? 'Refresh' : 'Generate'} Summary
        </Button>
      </CardHeader>
      <CardContent>
        {summary ? (
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="whitespace-pre-line">{summary}</p>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">
              Generate an AI-powered summary of {clientName}'s invoice history to gain insights into their payment patterns and trends.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientSummary;
