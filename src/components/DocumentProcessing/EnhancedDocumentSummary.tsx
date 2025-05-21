import React from 'react';
import { Calendar, DollarSign, FileText, User, Clock, FileCheck } from 'lucide-react';

interface EnhancedDocumentSummaryProps {
  summary: string;
}

const EnhancedDocumentSummary: React.FC<EnhancedDocumentSummaryProps> = ({ summary }) => {
  // Parse the summary to extract key information
  const documentType = extractInfo(summary, 'Document Type');
  const parties = extractParties(summary);
  const dates = extractDates(summary);
  const financials = extractFinancials(summary);
  const terms = extractInfo(summary, 'Main Terms/Conditions');

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <div className="bg-blue-900 text-white px-4 py-3 flex items-center">
        <FileText className="mr-2" size={20} />
        <h3 className="font-semibold">Document Summary</h3>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Document Type */}
        <div className="flex items-start">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <FileCheck className="text-blue-700" size={18} />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Document Type</h4>
            <p className="text-gray-700">{documentType || 'Not specified'}</p>
          </div>
        </div>
        
        {/* Parties */}
        <div className="flex items-start">
          <div className="bg-green-100 p-2 rounded-full mr-3">
            <User className="text-green-700" size={18} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Parties Involved</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
              {parties.map((party, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded border border-gray-200">
                  <p className="text-gray-700">{party}</p>
                </div>
              ))}
              {parties.length === 0 && <p className="text-gray-500">No parties specified</p>}
            </div>
          </div>
        </div>
        
        {/* Dates */}
        <div className="flex items-start">
          <div className="bg-purple-100 p-2 rounded-full mr-3">
            <Calendar className="text-purple-700" size={18} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Important Dates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
              {dates.map((date, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center">
                  <Clock className="text-gray-400 mr-1" size={14} />
                  <p className="text-gray-700">{date}</p>
                </div>
              ))}
              {dates.length === 0 && <p className="text-gray-500">No dates specified</p>}
            </div>
          </div>
        </div>
        
        {/* Financial Figures */}
        <div className="flex items-start">
          <div className="bg-amber-100 p-2 rounded-full mr-3">
            <DollarSign className="text-amber-700" size={18} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Key Financial Figures</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
              {financials.map((financial, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded border border-gray-200">
                  <p className="text-gray-700">{financial}</p>
                </div>
              ))}
              {financials.length === 0 && <p className="text-gray-500">No financial figures specified</p>}
            </div>
          </div>
        </div>
        
        {/* Terms & Conditions */}
        {terms && (
          <div className="flex items-start">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <FileText className="text-red-700" size={18} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Terms & Conditions</h4>
              <p className="text-gray-700 mt-1 bg-gray-50 p-2 rounded border border-gray-200">{terms}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions to extract information from the summary
function extractInfo(summary: string, section: string): string {
  const regex = new RegExp(`\\*\\*${section}:\\*\\*\\s*(.+?)(?=\\n\\*\\*|$)`, 's');
  const match = summary.match(regex);
  return match ? match[1].trim() : '';
}

function extractParties(summary: string): string[] {
  const partiesSection = extractInfo(summary, 'Parties Involved');
  if (!partiesSection) return [];
  
  // Extract bullet points or lines
  const parties = partiesSection.split('\n')
    .map(line => line.replace(/^\*\s*/, '').trim())
    .filter(line => line.length > 0);
  
  return parties;
}

function extractDates(summary: string): string[] {
  const datesSection = extractInfo(summary, 'Important Dates');
  if (!datesSection) return [];
  
  // Extract bullet points or lines
  const dates = datesSection.split('\n')
    .map(line => line.replace(/^\*\s*/, '').trim())
    .filter(line => line.length > 0);
  
  return dates;
}

function extractFinancials(summary: string): string[] {
  const financialsSection = extractInfo(summary, 'Key Financial Figures');
  if (!financialsSection) return [];
  
  // Extract bullet points or lines
  const financials = financialsSection.split('\n')
    .map(line => line.replace(/^\*\s*/, '').trim())
    .filter(line => line.length > 0);
  
  return financials;
}

export default EnhancedDocumentSummary;
