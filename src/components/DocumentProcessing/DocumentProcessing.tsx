import React, { useState } from 'react';
import { Upload, File, Check, X, Search, ClipboardList, Plus, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { geminiService } from '../../services/geminiService';
import { invoiceService, clientService } from '../../services/api';
import DocumentUploader from './DocumentUploader';
import DocumentViewer from './DocumentViewer';
import EnhancedDocumentSummary from './EnhancedDocumentSummary';
import ConfirmDialog from '../ui/ConfirmDialog';
import DataPreviewDialog from './DataPreviewDialog';
import { useToast } from '../../contexts/ToastContext';

interface DocumentProcessingProps {
  onDataExtracted?: (data: any) => void;
}

const DocumentProcessing: React.FC<DocumentProcessingProps> = ({ onDataExtracted }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [documentSummary, setDocumentSummary] = useState<string | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showBothDialog, setShowBothDialog] = useState(false);
  const [showClientPreview, setShowClientPreview] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [clientPreviewData, setClientPreviewData] = useState<any>(null);
  const [invoicePreviewData, setInvoicePreviewData] = useState<any>(null);
  const { showToast } = useToast();

  const handleFileUpload = async (file: File) => {
    try {
      setFile(file);
      setIsUploading(true);
      showToast('info', 'Uploading document...');

      const result = await geminiService.uploadFile(file);

      setFileUri(result.file.uri);
      setFileName(result.file.name);
      setMimeType(result.file.mimeType);

      showToast('success', 'Document uploaded successfully');

      // Automatically classify the document
      await classifyDocument(result.file.uri, result.file.mimeType);
    } catch (error) {
      console.error('Error uploading document:', error);
      showToast('error', 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const classifyDocument = async (uri: string, type: string) => {
    try {
      setIsProcessing(true);
      showToast('info', 'Classifying document...');

      const result = await geminiService.classifyDocument(uri, type);

      setDocumentType(result.classification.category);
      showToast('success', `Document classified as: ${result.classification.category}`);
    } catch (error) {
      console.error('Error classifying document:', error);
      showToast('error', 'Failed to classify document');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractDocumentData = async () => {
    if (!fileUri || !mimeType) {
      showToast('error', 'No document uploaded');
      return;
    }

    try {
      setIsProcessing(true);
      showToast('info', 'Extracting data from document...');

      const result = await geminiService.extractDocumentData(fileUri, mimeType);

      setExtractedData(result.data);

      if (onDataExtracted) {
        onDataExtracted(result.data);
      }

      showToast('success', 'Data extracted successfully');
    } catch (error) {
      console.error('Error extracting data from document:', error);
      showToast('error', 'Failed to extract data from document');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSummary = async () => {
    if (!fileUri || !mimeType) {
      showToast('error', 'No document uploaded');
      return;
    }

    try {
      setIsProcessing(true);
      showToast('info', 'Generating document summary...');

      const result = await geminiService.generateSummary(fileUri, mimeType);

      setDocumentSummary(result.summary);
      showToast('success', 'Summary generated successfully');
    } catch (error) {
      console.error('Error generating summary:', error);
      showToast('error', 'Failed to generate summary');
    } finally {
      setIsProcessing(false);
    }
  };

  const prepareClientData = () => {
    if (!extractedData) {
      showToast('error', 'No data available to create client');
      return null;
    }

    // Enhanced field mapping with more comprehensive search for client information
    // This includes looking for fields that might contain client information but with different naming conventions

    // Find client name with expanded search
    const clientName =
      extractedData.client_name ||
      extractedData.recipient ||
      extractedData.customer_name ||
      extractedData.buyer_name ||
      extractedData.bill_to_name ||
      extractedData.bill_to ||
      extractedData.sold_to_name ||
      extractedData.sold_to ||
      extractedData.customer ||
      extractedData.client ||
      extractedData.recipient_name ||
      extractedData.billed_to ||
      extractedData.billing_name ||
      // Look for any field that might contain "name" and "client" or similar terms
      findFieldWithKeywords(extractedData, ['client', 'customer', 'recipient', 'buyer'], ['name']) ||
      '';

    // Find client email with expanded search
    const clientEmail =
      extractedData.client_email ||
      extractedData.recipient_email ||
      extractedData.customer_email ||
      extractedData.buyer_email ||
      extractedData.bill_to_email ||
      extractedData.email ||
      // Look for any field that might contain "email" and "client" or similar terms
      findFieldWithKeywords(extractedData, ['client', 'customer', 'recipient', 'buyer'], ['email', 'e-mail']) ||
      '';

    // Find client phone with expanded search
    const clientPhone =
      extractedData.client_phone ||
      extractedData.recipient_phone ||
      extractedData.customer_phone ||
      extractedData.buyer_phone ||
      extractedData.bill_to_phone ||
      extractedData.phone ||
      extractedData.telephone ||
      extractedData.tel ||
      // Look for any field that might contain "phone" and "client" or similar terms
      findFieldWithKeywords(extractedData, ['client', 'customer', 'recipient', 'buyer'], ['phone', 'telephone', 'tel', 'mobile']) ||
      '';

    // Find client address with expanded search
    const clientAddress =
      extractedData.client_address ||
      extractedData.recipient_address ||
      extractedData.customer_address ||
      extractedData.buyer_address ||
      extractedData.bill_to_address ||
      extractedData.billing_address ||
      extractedData.address ||
      extractedData.shipping_address ||
      // Look for any field that might contain "address" and "client" or similar terms
      findFieldWithKeywords(extractedData, ['client', 'customer', 'recipient', 'buyer', 'bill', 'billing'], ['address', 'location', 'street']) ||
      '';

    // Find client company with expanded search
    const clientCompany =
      extractedData.client_company ||
      extractedData.recipient_company ||
      extractedData.customer_company ||
      extractedData.buyer_company ||
      extractedData.bill_to_company ||
      extractedData.company ||
      extractedData.organization ||
      extractedData.business ||
      extractedData.corporation ||
      // Look for any field that might contain "company" and "client" or similar terms
      findFieldWithKeywords(extractedData, ['client', 'customer', 'recipient', 'buyer'], ['company', 'organization', 'business', 'corporation']) ||
      '';

    // Extract client information from the data with more comprehensive field mapping
    const clientData = {
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      address: clientAddress,
      company_name: clientCompany,
      notes: `Created from document processing on ${new Date().toLocaleDateString()}`
    };

    console.log('Prepared client data:', clientData);
    return clientData;
  };

  // Helper function to find fields that contain specific keywords
  const findFieldWithKeywords = (data: any, prefixKeywords: string[], suffixKeywords: string[]): string | null => {
    if (!data) return null;

    // First, try to find exact matches with combined keywords
    for (const prefix of prefixKeywords) {
      for (const suffix of suffixKeywords) {
        const exactKey = `${prefix}_${suffix}`;
        if (data[exactKey] && typeof data[exactKey] === 'string' && data[exactKey].trim() !== '') {
          return data[exactKey];
        }
      }
    }

    // Then, try to find fields that contain both keywords
    for (const key in data) {
      if (typeof data[key] === 'string' && data[key].trim() !== '') {
        const lowerKey = key.toLowerCase();

        // Check if the key contains any prefix keyword AND any suffix keyword
        const hasPrefix = prefixKeywords.some(prefix => lowerKey.includes(prefix.toLowerCase()));
        const hasSuffix = suffixKeywords.some(suffix => lowerKey.includes(suffix.toLowerCase()));

        if (hasPrefix && hasSuffix) {
          return data[key];
        }
      }
    }

    // Finally, try to find fields that contain any suffix keyword
    for (const key in data) {
      if (typeof data[key] === 'string' && data[key].trim() !== '') {
        const lowerKey = key.toLowerCase();

        // Check if the key contains any suffix keyword
        const hasSuffix = suffixKeywords.some(suffix => lowerKey.includes(suffix.toLowerCase()));

        if (hasSuffix) {
          return data[key];
        }
      }
    }

    return null;
  };

  const showClientPreviewDialog = () => {
    const clientData = prepareClientData();
    if (clientData) {
      setClientPreviewData(clientData);
      setShowClientPreview(true);
    }
  };

  const createClientFromData = async (updatedData?: any) => {
    const dataToUse = updatedData || clientPreviewData;

    if (!dataToUse) {
      showToast('error', 'No client data available');
      return null;
    }

    try {
      setIsCreatingClient(true);
      showToast('info', 'Creating client from extracted data...');

      // Create the client
      const newClient = await clientService.createClient(dataToUse);

      showToast('success', 'Client created successfully');

      // Close the preview dialog
      setShowClientPreview(false);

      return newClient;
    } catch (error) {
      console.error('Error creating client:', error);
      showToast('error', `Failed to create client: ${error.message || 'Unknown error'}`);
      return null;
    } finally {
      setIsCreatingClient(false);
    }
  };

  const prepareInvoiceData = (clientId?: number) => {
    if (!extractedData) {
      showToast('error', 'No data available to create invoice');
      return null;
    }

    // Enhanced invoice number extraction with more comprehensive search
    const invoiceNumber =
      extractedData.invoice_number ||
      extractedData.number ||
      extractedData.invoice_id ||
      extractedData.invoice_no ||
      extractedData.invoice_ref ||
      extractedData.reference_number ||
      extractedData.ref_number ||
      extractedData.ref_no ||
      extractedData.reference ||
      extractedData.invoice ||
      // Look for any field that might contain "invoice" and "number" or similar terms
      findFieldWithKeywords(extractedData, ['invoice', 'inv'], ['number', 'no', 'id', 'ref']) ||
      `INV-${new Date().getTime().toString().slice(-6)}`;

    // Get current date in YYYY-MM-DD format for default dates
    const today = new Date().toISOString().split('T')[0];

    // Default due date is 7 days from today
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];

    // Enhanced date extraction with more comprehensive search
    const issuedDate =
      extractedData.date ||
      extractedData.invoice_date ||
      extractedData.issue_date ||
      extractedData.issued_date ||
      extractedData.invoice_date ||
      extractedData.date_of_issue ||
      extractedData.date_issued ||
      // Look for any field that might contain "date" and "invoice" or similar terms
      findFieldWithKeywords(extractedData, ['invoice', 'issue'], ['date']) ||
      today;

    // Enhanced due date extraction with more comprehensive search
    const dueDate =
      extractedData.due_date ||
      extractedData.payment_due ||
      extractedData.payment_date ||
      extractedData.date_due ||
      extractedData.due_by ||
      extractedData.pay_by_date ||
      // Look for any field that might contain "due" and "date" or similar terms
      findFieldWithKeywords(extractedData, ['due', 'payment'], ['date']) ||
      defaultDueDateStr;

    // Enhanced notes extraction with more comprehensive search
    const notes =
      extractedData.notes ||
      extractedData.comments ||
      extractedData.description ||
      extractedData.memo ||
      extractedData.additional_info ||
      extractedData.additional_information ||
      extractedData.message ||
      // Look for any field that might contain notes-related terms
      findFieldWithKeywords(extractedData, [], ['notes', 'comments', 'description', 'memo', 'message']) ||
      'Created from document processing';

    // Map extracted data to invoice format with comprehensive field mapping
    const invoiceData: any = {
      status: 'draft',
      client_id: clientId,
      number: invoiceNumber,
      issued_date: issuedDate,
      due_date: dueDate,
      items: [],
      notes: notes,
    };

    // Enhanced line items extraction with more comprehensive search
    let items = [];
    if (extractedData.line_items || extractedData.items) {
      items = extractedData.line_items || extractedData.items || [];
    } else if (extractedData.products || extractedData.services) {
      items = extractedData.products || extractedData.services || [];
    } else {
      // Look for any field that might contain line items
      const possibleItemsField = findObjectArrayField(extractedData);
      if (possibleItemsField) {
        items = possibleItemsField;
      }
    }

    // Map line items if available
    if (items && items.length > 0) {
      invoiceData.items = items.map((item: any) => ({
        description: item.description || item.name || item.item || item.product || item.service || 'Item',
        quantity: parseFloat(item.quantity || item.qty || item.count || 1),
        unit_price: parseFloat(item.unit_price || item.price || item.rate || item.cost || 0),
        amount: parseFloat(item.amount || item.total || item.line_total || item.subtotal || 0),
      }));
    } else {
      // Create a default item if none are available
      invoiceData.items = [{
        description: 'Service',
        quantity: 1,
        unit_price: parseFloat(extractedData.total || extractedData.total_amount || extractedData.amount || 0),
        amount: parseFloat(extractedData.total || extractedData.total_amount || extractedData.amount || 0)
      }];
    }

    // Calculate subtotal from items if not provided
    let subtotal = 0;
    if (invoiceData.items && invoiceData.items.length > 0) {
      subtotal = invoiceData.items.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);
    }

    // Enhanced financial data extraction with more comprehensive search
    const extractedSubtotal =
      extractedData.subtotal ||
      extractedData.sub_total ||
      extractedData.net_amount ||
      extractedData.net ||
      // Look for any field that might contain "subtotal" or similar terms
      findFieldWithKeywords(extractedData, [], ['subtotal', 'sub_total', 'net_amount', 'net']) ||
      subtotal.toString();

    const extractedTax =
      extractedData.tax_amount ||
      extractedData.tax ||
      extractedData.vat ||
      extractedData.gst ||
      extractedData.sales_tax ||
      // Look for any field that might contain "tax" or similar terms
      findFieldWithKeywords(extractedData, [], ['tax', 'vat', 'gst', 'sales_tax']) ||
      '0';

    const extractedDiscount =
      extractedData.discount ||
      extractedData.discount_amount ||
      extractedData.discount_total ||
      // Look for any field that might contain "discount" or similar terms
      findFieldWithKeywords(extractedData, [], ['discount', 'reduction', 'deduction']) ||
      '0';

    const extractedTotal =
      extractedData.total_amount ||
      extractedData.total ||
      extractedData.amount ||
      extractedData.grand_total ||
      extractedData.final_amount ||
      // Look for any field that might contain "total" or similar terms
      findFieldWithKeywords(extractedData, [], ['total', 'amount', 'grand_total', 'final_amount']) ||
      '0';

    // Map totals with fallbacks
    invoiceData.subtotal = parseFloat(extractedSubtotal);
    invoiceData.tax = parseFloat(extractedTax);
    invoiceData.discount = parseFloat(extractedDiscount);

    // Calculate total if not provided
    const calculatedTotal = invoiceData.subtotal + invoiceData.tax - invoiceData.discount;
    invoiceData.total = parseFloat(extractedTotal) || calculatedTotal;

    console.log('Prepared invoice data:', invoiceData);
    return invoiceData;
  };

  // Helper function to find an array of objects in the extracted data that might be line items
  const findObjectArrayField = (data: any): any[] | null => {
    if (!data) return null;

    for (const key in data) {
      if (Array.isArray(data[key]) && data[key].length > 0 && typeof data[key][0] === 'object') {
        // Check if the array items have properties that suggest they are line items
        const firstItem = data[key][0];
        const hasItemProperties =
          ('description' in firstItem || 'name' in firstItem || 'item' in firstItem || 'product' in firstItem) &&
          ('quantity' in firstItem || 'qty' in firstItem || 'count' in firstItem) &&
          ('price' in firstItem || 'unit_price' in firstItem || 'rate' in firstItem || 'cost' in firstItem || 'amount' in firstItem);

        if (hasItemProperties) {
          return data[key];
        }
      }
    }

    return null;
  };

  // State to track clients for selection
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Function to load clients from the database
  const loadClients = async () => {
    try {
      setIsLoadingClients(true);
      const clients = await clientService.getClients();
      setAvailableClients(clients);
      return clients;
    } catch (error) {
      console.error('Error loading clients:', error);
      showToast('error', 'Failed to load clients');
      return [];
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Function to find a matching client based on extracted data
  const findMatchingClient = (clients: any[], extractedClientData: any) => {
    if (!clients || !clients.length || !extractedClientData) return null;

    const clientName = extractedClientData.name?.toLowerCase();
    const clientEmail = extractedClientData.email?.toLowerCase();
    const clientCompany = extractedClientData.company_name?.toLowerCase();

    // Try to find an exact match by email (most reliable)
    if (clientEmail) {
      const emailMatch = clients.find(c =>
        c.email && c.email.toLowerCase() === clientEmail
      );
      if (emailMatch) return emailMatch;
    }

    // Try to find a match by company name
    if (clientCompany) {
      const companyMatch = clients.find(c =>
        c.company_name && c.company_name.toLowerCase() === clientCompany
      );
      if (companyMatch) return companyMatch;
    }

    // Try to find a match by client name
    if (clientName) {
      const nameMatch = clients.find(c =>
        c.name && c.name.toLowerCase() === clientName
      );
      if (nameMatch) return nameMatch;
    }

    // Try to find a partial match by name or company
    if (clientName || clientCompany) {
      const partialMatch = clients.find(c =>
        (clientName && c.name && c.name.toLowerCase().includes(clientName)) ||
        (clientName && c.name && clientName.includes(c.name.toLowerCase())) ||
        (clientCompany && c.company_name && c.company_name.toLowerCase().includes(clientCompany)) ||
        (clientCompany && c.company_name && clientCompany.includes(c.company_name.toLowerCase()))
      );
      if (partialMatch) return partialMatch;
    }

    return null;
  };

  const showInvoicePreviewDialog = async (clientId?: number) => {
    console.log('showInvoicePreviewDialog called with clientId:', clientId);
    console.log('extractedData:', extractedData);

    // Check if clientId is provided and ensure it's a number
    if (clientId !== undefined) {
      clientId = Number(clientId);
      if (isNaN(clientId)) {
        console.error('Invalid client ID provided:', clientId);
        clientId = undefined;
      } else {
        console.log('Using provided client ID (converted to number):', clientId);
      }
    }

    // Check URL for client parameter
    if (!clientId) {
      const urlParams = new URLSearchParams(window.location.search);
      const clientParam = urlParams.get('client');
      if (clientParam && !isNaN(Number(clientParam))) {
        clientId = Number(clientParam);
        console.log('Using client ID from URL parameter:', clientId);
      }
    }

    // If still no client ID, try to find a matching client
    if (!clientId && extractedData) {
      console.log('No clientId provided, trying to find a matching client');

      // Prepare client data from the extracted data
      const clientData = prepareClientData();
      console.log('Prepared client data:', clientData);

      // Load clients if not already loaded
      let clients = availableClients;
      if (!clients.length) {
        console.log('Loading clients...');
        clients = await loadClients();
        console.log('Loaded clients:', clients);
      } else {
        console.log('Using existing clients:', clients);
      }

      // Try to find a matching client
      if (clientData && clients.length) {
        console.log('Trying to find matching client for:', clientData);
        const matchingClient = findMatchingClient(clients, clientData);
        console.log('Matching client found:', matchingClient);
        if (matchingClient) {
          clientId = Number(matchingClient.id);
          console.log('Using matching client ID:', clientId);
        }
      }
    }

    // Prepare invoice data with the client ID (if found)
    console.log('Preparing invoice data with clientId:', clientId);
    const invoiceData = prepareInvoiceData(clientId);
    console.log('Prepared invoice data:', invoiceData);

    if (invoiceData) {
      // If we have clients loaded, include them in the preview data for selection
      if (availableClients.length) {
        console.log('Adding available clients to invoice data');
        invoiceData._availableClients = availableClients;
      } else {
        console.log('No available clients to add to invoice data');
      }

      // Store the client ID in both formats to ensure compatibility
      if (clientId) {
        invoiceData.client_id = clientId;
        invoiceData._selectedClientId = clientId;
        console.log('Set client ID in invoice data:', clientId);
      }

      console.log('Setting invoice preview data and showing dialog');
      setInvoicePreviewData(invoiceData);
      setShowInvoicePreview(true);
    } else {
      console.error('Failed to prepare invoice data');
    }
  };

  const createInvoiceFromData = async (updatedData?: any, clientId?: number) => {
    console.log('createInvoiceFromData called with:', { updatedData, clientId });
    console.log('Current invoicePreviewData:', invoicePreviewData);

    // If clientId is provided, ensure it's a number
    if (clientId !== undefined) {
      clientId = Number(clientId);
      if (isNaN(clientId)) {
        console.error('Invalid client ID provided:', clientId);
        clientId = undefined;
      } else {
        console.log('Using provided client ID (converted to number):', clientId);
      }
    }

    // If we're creating directly (not from preview), prepare the data first
    if (!updatedData && !invoicePreviewData && clientId) {
      console.log('No data provided, preparing invoice data with clientId:', clientId);
      const invoiceData = prepareInvoiceData(clientId);
      console.log('Prepared invoice data:', invoiceData);

      if (!invoiceData) {
        console.error('Failed to prepare invoice data');
        return null;
      }

      // Store the client ID in both formats to ensure compatibility
      invoiceData.client_id = clientId;
      invoiceData._selectedClientId = clientId;

      console.log('Setting invoice preview data and showing dialog');
      setInvoicePreviewData(invoiceData);
      // Show the preview dialog instead of creating immediately
      setShowInvoicePreview(true);
      return null;
    }

    const dataToUse = updatedData || invoicePreviewData;
    console.log('Data to use for invoice creation:', dataToUse);

    if (!dataToUse) {
      console.error('No invoice data available');
      showToast('error', 'No invoice data available');
      return null;
    }

    try {
      setIsCreatingInvoice(true);
      showToast('info', 'Creating invoice from extracted data...');

      // Check for client ID in different formats
      let finalClientId: number | null = null;

      // First check for _selectedClientId (our special field)
      if (dataToUse._selectedClientId && !isNaN(Number(dataToUse._selectedClientId))) {
        finalClientId = Number(dataToUse._selectedClientId);
        console.log('Using _selectedClientId for final client ID:', finalClientId);
      }
      // Then check for client_id
      else if (dataToUse.client_id && !isNaN(Number(dataToUse.client_id))) {
        finalClientId = Number(dataToUse.client_id);
        console.log('Using client_id for final client ID:', finalClientId);
      }
      // Check URL for client parameter as last resort
      else {
        const urlParams = new URLSearchParams(window.location.search);
        const clientParam = urlParams.get('client');
        if (clientParam && !isNaN(Number(clientParam))) {
          finalClientId = Number(clientParam);
          console.log('Using URL client parameter for final client ID:', finalClientId);
        }
      }

      // Validate required fields
      if (!finalClientId) {
        console.error('Missing client ID in invoice data');
        throw new Error('Client ID is required. Please create a client first or select an existing client.');
      }

      // Create a copy of the data without internal fields
      const invoiceDataToSave = { ...dataToUse };
      console.log('Initial invoice data to save:', invoiceDataToSave);

      // Set the final client ID
      invoiceDataToSave.client_id = finalClientId;
      console.log('Set final client_id in invoice data:', finalClientId);

      // Remove internal fields (prefixed with _)
      Object.keys(invoiceDataToSave).forEach(key => {
        if (key.startsWith('_')) {
          console.log('Removing internal field:', key);
          delete invoiceDataToSave[key];
        }
      });

      console.log('Final invoice data to save:', invoiceDataToSave);

      // Create the invoice
      console.log('Calling invoiceService.createInvoice');
      const newInvoice = await invoiceService.createInvoice(invoiceDataToSave);
      console.log('Invoice created successfully:', newInvoice);

      showToast('success', 'Invoice created successfully');

      // Close the preview dialog
      setShowInvoicePreview(false);

      return newInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      showToast('error', `Failed to create invoice: ${error.message || 'Unknown error'}`);
      return null;
    } finally {
      console.log('Setting isCreatingInvoice to false');
      setIsCreatingInvoice(false);
    }
  };

  const prepareClientAndInvoiceData = () => {
    // Prepare client data
    const clientData = prepareClientData();
    if (!clientData) {
      return null;
    }

    // Show client preview dialog
    setClientPreviewData(clientData);
    setShowClientPreview(true);
  };

  const createClientAndInvoice = async () => {
    if (!clientPreviewData) {
      showToast('error', 'No client data available');
      return;
    }

    try {
      // First create the client
      const newClient = await createClientFromData();

      if (newClient) {
        // Prepare invoice data with the new client ID
        showInvoicePreviewDialog(newClient.id);
      } else {
        showToast('error', 'Client creation failed, invoice was not created');
      }
    } catch (error) {
      console.error('Error creating client and invoice:', error);
      showToast('error', `Failed to create client and invoice: ${error.message || 'Unknown error'}`);
    }
  };

  const resetDocument = async () => {
    try {
      if (fileName) {
        await geminiService.deleteFile(fileName);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    } finally {
      setFile(null);
      setFileUri(null);
      setFileName(null);
      setMimeType(null);
      setDocumentType(null);
      setExtractedData(null);
      setDocumentSummary(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2" size={20} />
            Document Processing
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!file ? (
            <DocumentUploader onFileUpload={handleFileUpload} isUploading={isUploading} />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <File className="mr-2" size={20} />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {documentType ? `Type: ${documentType}` : 'Analyzing...'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetDocument}
                  icon={<X size={16} />}
                >
                  Remove
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={extractDocumentData}
                  isLoading={isProcessing}
                  disabled={isProcessing || !fileUri}
                  icon={<Check size={16} />}
                >
                  Extract Data
                </Button>
                <Button
                  variant="outline"
                  onClick={generateSummary}
                  isLoading={isProcessing}
                  disabled={isProcessing || !fileUri}
                  icon={<ClipboardList size={16} />}
                >
                  Generate Summary
                </Button>
              </div>

              {extractedData && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">Extracted Data</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={showClientPreviewDialog}
                        isLoading={isCreatingClient}
                        disabled={isCreatingClient || isCreatingInvoice}
                        icon={<User size={16} />}
                      >
                        Create Client
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('Create Invoice button clicked');
                          showInvoicePreviewDialog();
                        }}
                        isLoading={isCreatingInvoice}
                        disabled={isCreatingClient || isCreatingInvoice}
                        icon={<File size={16} />}
                      >
                        Create Invoice
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={prepareClientAndInvoiceData}
                        isLoading={isCreatingClient || isCreatingInvoice}
                        disabled={isCreatingClient || isCreatingInvoice}
                        icon={<Plus size={16} />}
                      >
                        Create Both
                      </Button>
                    </div>
                  </div>
                  <DocumentViewer data={extractedData} />
                </div>
              )}

              {documentSummary && (
                <div className="mt-6">
                  <EnhancedDocumentSummary summary={documentSummary} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Preview Dialogs */}
      <DataPreviewDialog
        isOpen={showClientPreview}
        title="Create Client"
        data={clientPreviewData || {}}
        requiredFields={['name']}
        fieldLabels={{
          name: 'Client Name',
          email: 'Email',
          phone: 'Phone',
          address: 'Address',
          company_name: 'Company Name',
          notes: 'Notes'
        }}
        onConfirm={createClientFromData}
        onCancel={() => setShowClientPreview(false)}
        isLoading={isCreatingClient}
        editableFields={['name', 'email', 'phone', 'address', 'company_name', 'notes']}
      />

      <DataPreviewDialog
        isOpen={showInvoicePreview}
        title="Create Invoice"
        data={invoicePreviewData || {}}
        requiredFields={['number', 'client_id', 'issued_date', 'due_date']}
        fieldLabels={{
          number: 'Invoice Number',
          client_id: 'Client',
          issued_date: 'Issue Date',
          due_date: 'Due Date',
          status: 'Status',
          subtotal: 'Subtotal',
          tax: 'Tax',
          discount: 'Discount',
          total: 'Total',
          notes: 'Notes',
          items: 'Line Items'
        }}
        onConfirm={createInvoiceFromData}
        onCancel={() => setShowInvoicePreview(false)}
        isLoading={isCreatingInvoice}
        editableFields={['number', 'issued_date', 'due_date', 'status', 'subtotal', 'tax', 'discount', 'total', 'notes']}
        isInvoice={true}
      />

      {/* Confirmation Dialogs - Kept for backward compatibility */}
      <ConfirmDialog
        isOpen={showClientDialog}
        onCancel={() => setShowClientDialog(false)}
        onConfirm={() => {
          setShowClientDialog(false);
          showClientPreviewDialog();
        }}
        title="Create Client"
        message="Are you sure you want to create a client from the extracted data? This will add a new client to your database."
        confirmText="Continue"
        isLoading={isCreatingClient}
      />

      <ConfirmDialog
        isOpen={showInvoiceDialog}
        onCancel={() => setShowInvoiceDialog(false)}
        onConfirm={() => {
          setShowInvoiceDialog(false);
          showInvoicePreviewDialog();
        }}
        title="Create Invoice"
        message="Are you sure you want to create an invoice from the extracted data? This will add a new invoice to your database."
        confirmText="Continue"
        isLoading={isCreatingInvoice}
      />

      <ConfirmDialog
        isOpen={showBothDialog}
        onCancel={() => setShowBothDialog(false)}
        onConfirm={() => {
          setShowBothDialog(false);
          prepareClientAndInvoiceData();
        }}
        title="Create Client and Invoice"
        message="Are you sure you want to create both a client and an invoice from the extracted data? This will add a new client and a new invoice to your database."
        confirmText="Continue"
        isLoading={isCreatingClient || isCreatingInvoice}
      />
    </div>
  );
};

export default DocumentProcessing;
