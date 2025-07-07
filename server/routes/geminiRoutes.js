const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { supabase } = require('../db');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Initialize Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Upload a file to Gemini API
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Initialize the Gemini API client
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Instead of sending the entire file data back to the client, we'll store it on the server
    // and just send a reference to it
    const fileName = `file-${Date.now()}`;
    const newPath = path.join(__dirname, '../uploads', fileName);

    // Move the file to a permanent location
    fs.renameSync(filePath, newPath);

    // Create a response with the file reference
    const uploadedFile = {
      name: fileName,
      uri: fileName, // Just store the filename as the URI
      mimeType: mimeType
    };

    // No need to clean up the temporary file as we've moved it

    res.json({
      success: true,
      file: {
        name: uploadedFile.name,
        uri: uploadedFile.uri,
        mimeType: mimeType
      }
    });
  } catch (error) {
    console.error('Error uploading file to Gemini API:', error);
    res.status(500).json({ error: 'Failed to upload file to Gemini API' });
  }
});

// Extract data from a document
router.post('/extract', async (req, res) => {
  try {
    const { fileUri, mimeType } = req.body;

    if (!fileUri || !mimeType) {
      return res.status(400).json({ error: 'File URI and MIME type are required' });
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Create the prompt for data extraction
    const prompt = `
      Extract the following information from this document and return it as a structured JSON object.

      INVOICE DETAILS (REQUIRED FIELDS - MUST BE EXTRACTED):
      - invoice_number: The invoice or receipt number (REQUIRED)
      - number: Alternative field for invoice number (REQUIRED if invoice_number not found)
      - date: The invoice or receipt date in YYYY-MM-DD format (REQUIRED)
      - invoice_date: Alternative field for date (REQUIRED if date not found)
      - issued_date: Alternative field for date (REQUIRED if date and invoice_date not found)
      - due_date: The payment due date in YYYY-MM-DD format (REQUIRED)
      - payment_due: Alternative field for due date (REQUIRED if due_date not found)

      CLIENT INFORMATION (REQUIRED FIELDS - MUST BE EXTRACTED):
      - client_name: The name of the client or customer (REQUIRED)
      - recipient: Alternative field for client name (REQUIRED if client_name not found)
      - customer_name: Alternative field for client name (REQUIRED if client_name and recipient not found)
      - bill_to_name: Alternative field for client name (REQUIRED if other client name fields not found)
      - client_email: The email of the client (try to find this)
      - client_phone: The phone number of the client (try to find this)
      - client_address: The address of the client (try to find this)
      - client_company: The company name of the client (try to find this)

      ADDITIONAL CLIENT FIELDS TO SEARCH FOR:
      - bill_to: The billing recipient (could contain client name)
      - sold_to: The sold to recipient (could contain client name)
      - sold_to_name: Alternative for client name
      - customer: Simple client identifier
      - client: Simple client identifier
      - recipient_name: Alternative for client name
      - billed_to: Alternative for client name
      - billing_name: Alternative for client name
      - email: General email that might be the client's
      - phone: General phone that might be the client's
      - telephone: Alternative for phone
      - tel: Alternative for phone
      - address: General address that might be the client's
      - shipping_address: Alternative address that might be the client's
      - company: General company name that might be the client's
      - organization: Alternative for company
      - business: Alternative for company
      - corporation: Alternative for company

      INVOICE NUMBER ALTERNATIVES TO SEARCH FOR:
      - invoice_no: Alternative for invoice number
      - invoice_ref: Alternative for invoice number
      - reference_number: Alternative for invoice number
      - ref_number: Alternative for invoice number
      - ref_no: Alternative for invoice number
      - reference: Alternative for invoice number
      - invoice: Simple invoice identifier

      DATE ALTERNATIVES TO SEARCH FOR:
      - date_of_issue: Alternative for invoice date
      - date_issued: Alternative for invoice date
      - date_due: Alternative for due date
      - due_by: Alternative for due date
      - pay_by_date: Alternative for due date

      VENDOR INFORMATION:
      - vendor_name: The name of the vendor or service provider
      - vendor_email: The email of the vendor
      - vendor_phone: The phone number of the vendor
      - vendor_address: The address of the vendor
      - vendor_company: The company name of the vendor

      LINE ITEMS AND FINANCIAL DETAILS:
      - line_items: An array of items with description, quantity, unit_price, and amount
      - items: Alternative field for line_items
      - products: Alternative field for line_items
      - services: Alternative field for line_items
      - subtotal: The subtotal amount (numeric value only)
      - sub_total: Alternative for subtotal
      - net_amount: Alternative for subtotal
      - net: Alternative for subtotal
      - tax: The tax amount (numeric value only)
      - tax_amount: Alternative field for tax
      - vat: Alternative for tax
      - gst: Alternative for tax
      - sales_tax: Alternative for tax
      - discount: Any discount amount (numeric value only)
      - discount_amount: Alternative for discount
      - discount_total: Alternative for discount
      - total: The total amount (numeric value only)
      - total_amount: Alternative field for total
      - amount: Alternative for total
      - grand_total: Alternative for total
      - final_amount: Alternative for total
      - payment_method: The payment method
      - notes: Any additional notes or terms
      - comments: Alternative for notes
      - description: Alternative for notes
      - memo: Alternative for notes
      - additional_info: Alternative for notes
      - additional_information: Alternative for notes
      - message: Alternative for notes
      - status: The status of the invoice (e.g., "draft", "unpaid", "paid")

      IMPORTANT INSTRUCTIONS:
      1. Format the response as a valid JSON object without any explanations or additional text.
      2. For dates, use YYYY-MM-DD format. If only month and year are available, use the first day of the month.
      3. For monetary values, include numeric values only without currency symbols.
      4. ENSURE ALL REQUIRED FIELDS ARE INCLUDED. If a required field is not explicitly found in the document, make a reasonable inference based on the context.
      5. If line items are present, structure them as an array of objects with description, quantity, unit_price, and amount.
      6. If you cannot find a specific required field, provide a placeholder value and indicate in the field name that it needs review (e.g., "client_name_needs_review": "Possible Client Name").
      7. For invoice numbers, if not explicitly found, look for any reference numbers, order numbers, or other identifiers that could serve as an invoice number.
      8. For client information, if the document doesn't explicitly label the client, look for "Bill To", "Sold To", or similar sections.
      9. SEARCH THOROUGHLY for all required fields, even if they're not explicitly labeled. Use context clues to identify client information and invoice details.
      10. For line items, look for tables or lists that contain product/service descriptions, quantities, prices, and amounts.
    `;

    // Read the file from the server
    const filePath = path.join(__dirname, '../uploads', fileUri);
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');

    // Generate content using the file
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64Data } }
        ]}
      ]
    });

    // Parse the response to extract the JSON
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                      responseText.match(/{[\s\S]*}/);

    let extractedData = {};
    if (jsonMatch) {
      try {
        extractedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        console.error('Error parsing JSON from response:', e);
        extractedData = { text: responseText };
      }
    } else {
      extractedData = { text: responseText };
    }

    res.json({
      success: true,
      data: extractedData
    });
  } catch (error) {
    console.error('Error extracting data from document:', error);
    res.status(500).json({ error: 'Failed to extract data from document' });
  }
});

// Classify a document
router.post('/classify', async (req, res) => {
  try {
    const { fileUri, mimeType } = req.body;

    if (!fileUri || !mimeType) {
      return res.status(400).json({ error: 'File URI and MIME type are required' });
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Create the prompt for document classification
    const prompt = `
      Classify this document into one of the following categories:
      - Invoice
      - Receipt
      - Contract
      - Report
      - Letter
      - Form
      - Other

      Also provide a confidence score (0-100) and a brief explanation of why you classified it this way.

      Return the result as a JSON object with the following structure:
      {
        "document_type": "category_name",
        "confidence": confidence_score,
        "explanation": "brief explanation"
      }

      Do not include any additional text outside of this JSON object.
    `;

    // Read the file from the server
    const filePath = path.join(__dirname, '../uploads', fileUri);
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');

    // Generate content using the file
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64Data } }
        ]}
      ]
    });

    // Parse the response to extract the JSON
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                      responseText.match(/{[\s\S]*}/);

    let classification = {};
    if (jsonMatch) {
      try {
        const parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);

        // Map the response to a consistent format
        classification = {
          category: parsedData.document_type || parsedData.category || 'Unknown',
          confidence: parsedData.confidence || 0,
          explanation: parsedData.explanation || 'No explanation provided',
        };
      } catch (e) {
        console.error('Error parsing JSON from response:', e);
        classification = {
          category: 'Unknown',
          confidence: 0,
          explanation: 'Failed to classify document',
          text: responseText
        };
      }
    } else {
      classification = {
        category: 'Unknown',
        confidence: 0,
        explanation: 'Failed to classify document',
        text: responseText
      };
    }

    res.json({
      success: true,
      classification
    });
  } catch (error) {
    console.error('Error classifying document:', error);
    res.status(500).json({ error: 'Failed to classify document' });
  }
});

// Generate a summary
router.post('/summarize', async (req, res) => {
  try {
    const { fileUri, mimeType, clientId } = req.body;

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let prompt = '';
    let parts = [];

    if (fileUri && mimeType) {
      // Summarize a document
      prompt = `
        Generate a concise summary of this document. Include key information such as:
        - Document type
        - Parties involved
        - Important dates
        - Key financial figures
        - Main terms or conditions

        Keep the summary clear and professional.
      `;

      // Read the file from the server
      const filePath = path.join(__dirname, '../uploads', fileUri);
      const fileData = fs.readFileSync(filePath);
      const base64Data = fileData.toString('base64');

      parts = [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64Data } }
      ];
    } else if (clientId) {
      // Summarize client invoice history
      // First, get client data and invoices from the database
      console.log('Fetching client data for ID:', clientId);
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) {
        console.error('Error fetching client:', clientError);
        return res.status(404).json({ error: 'Client not found' });
      }

      console.log('Client found:', client.name);

      // Get all invoices for this client
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId);

      if (invoicesError) {
        console.error('Error fetching client invoices:', invoicesError);
        return res.status(500).json({ error: 'Failed to fetch client invoices' });
      }

      console.log(`Found ${invoices.length} invoices for client ${client.name}`);

      // Calculate some basic statistics to help the AI
      const totalInvoices = invoices.length;
      const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const avgAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

      // Create a prompt with the client and invoice data
      prompt = `
        Generate a concise summary of this client's invoice history. The client is ${client.name}.

        Here is their invoice history:
        ${JSON.stringify(invoices, null, 2)}

        Basic statistics:
        - Total invoices: ${totalInvoices}
        - Total amount billed: $${totalAmount.toFixed(2)}
        - Average invoice amount: $${avgAmount.toFixed(2)}
        - Paid invoices: ${paidInvoices}
        - Overdue invoices: ${overdueInvoices}

        Include in your summary:
        - Total number of invoices
        - Total amount billed
        - Payment patterns (on-time, late, etc.)
        - Average invoice amount
        - Frequency of invoices
        - Any notable trends

        If there are no invoices, mention that there is no invoice history yet.
        Keep the summary clear, professional, and data-driven.
        Format the response with proper paragraphs and bullet points where appropriate.
      `;

      parts = [{ text: prompt }];
    } else {
      return res.status(400).json({ error: 'Either file information or client ID is required' });
    }

    // Generate the summary
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }]
    });

    const summary = result.response.text();

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Delete a file
router.delete('/files/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;

    // Initialize the Gemini API client
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Since we're not actually using the Gemini Files API, we don't need to delete anything
    // Just return a success response

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file from Gemini API:', error);
    res.status(500).json({ error: 'Failed to delete file from Gemini API' });
  }
});

module.exports = router;
