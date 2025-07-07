# I-Invoyisi User Manual

Welcome to I-Invoyisi, your AI-powered invoice management system. This user manual will guide you through all the features and functionalities of the application.

## Table of Contents

1. [Dashboard](#dashboard)
2. [Clients](#clients)
3. [Invoices](#invoices)
4. [Payments](#payments)
5. [Document Processing](#document-processing)
6. [Reports](#reports)
7. [Settings](#settings)

## Dashboard

The dashboard is your central hub for monitoring your financial status at a glance.

![Dashboard Overview](../images/dashboard.png)

### Key Features

1. **Financial Summary Cards**
   - Total Paid: Sum of all paid invoices
   - Total Due: Sum of all unpaid invoices
   - Overdue: Sum of invoices past their due date
   - Upcoming: Sum of draft invoices and those due in the next 7 days

2. **Revenue Chart**
   - Visual representation of your revenue over time
   - Toggle between total view and breakdown by status
   - Hover over data points to see detailed information

3. **Invoice Status Distribution**
   - Pie chart showing the distribution of invoices by status
   - Click on segments to filter the invoice list

4. **Recent Invoices**
   - Quick access to your most recent invoices
   - Click on any invoice to view details

5. **Quick Actions**
   - Create new invoice
   - Add new client
   - View reports

## Clients

The Clients section allows you to manage your client information.

### Client List

![Client List](../images/client-list.png)

1. **Search and Filter**
   - Search clients by name, email, or company
   - Filter by active status

2. **Client Actions**
   - View client details
   - Edit client information
   - Delete client (with confirmation)

3. **Add New Client**
   - Click the "New Client" button
   - Fill in the required information
   - Click "Save" to create the client

### Client Details

![Client Details](../images/client-details.png)

1. **Client Information**
   - Contact details
   - Billing address
   - Notes

2. **Client Invoices**
   - List of all invoices for this client
   - Filter by status
   - Create new invoice for this client

3. **Client Summary**
   - AI-generated summary of client history
   - Payment patterns
   - Total billing information

## Invoices

The Invoices section is where you manage all your invoices.

### Invoice List

![Invoice List](../images/invoice-list.png)

1. **Filter and Search**
   - Search by invoice number or client name
   - Filter by status (draft, unpaid, paid, overdue)

2. **Invoice Actions**
   - View details
   - Edit invoice
   - Delete invoice
   - Download PDF

3. **Create New Invoice**
   - Click "New Invoice"
   - Select client
   - Add line items
   - Set due date
   - Add notes
   - Save as draft or finalize

### Invoice Detail

![Invoice Detail](../images/invoice-detail.png)

1. **Invoice Information**
   - Invoice number
   - Issue date and due date
   - Client information
   - Status indicator

2. **Line Items**
   - Description
   - Quantity
   - Unit price
   - Total amount

3. **Totals**
   - Subtotal
   - Tax
   - Discount
   - Final total

4. **Actions**
   - Edit invoice
   - Mark as paid/unpaid
   - Record payment
   - Send to client
   - Download PDF

### Invoice Status Workflow

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  Draft  │─────▶│ Unpaid  │─────▶│  Paid   │
└─────────┘      └─────────┘      └─────────┘
                      │
                      ▼
                 ┌─────────┐
                 │ Overdue │
                 └─────────┘
```

1. **Draft**: Initial state when creating an invoice
2. **Unpaid**: After finalizing the invoice
3. **Paid**: After recording full payment
4. **Overdue**: Automatically set when due date passes

## Payments

The Payments section allows you to record and track payments for invoices.

### Recording a Payment

![Record Payment](../images/record-payment.png)

1. **Select Invoice**
   - Choose the invoice being paid
   - View invoice details and amount due

2. **Payment Details**
   - Enter payment amount
   - Select payment method
   - Add reference number
   - Add notes

3. **Confirmation**
   - Review payment details
   - Submit payment
   - Invoice status updates automatically

### Payment History

![Payment History](../images/payment-history.png)

1. **Filter and Search**
   - Search by invoice number or client
   - Filter by date range
   - Filter by payment method

2. **Payment Details**
   - Date
   - Amount
   - Method
   - Reference
   - Associated invoice

## Document Processing

The Document Processing feature uses AI to extract data from invoices and receipts.

### Upload and Process

![Document Processing](../images/document-processing.png)

1. **Upload Document**
   - Click "Upload" or drag and drop
   - Supported formats: PDF, JPG, PNG

2. **Processing**
   - AI analyzes the document
   - Extracts relevant information
   - Classifies document type

3. **Review Extracted Data**
   - View highlighted fields
   - Edit any incorrect information
   - Add missing details

4. **Create Records**
   - Create new client if needed
   - Create invoice with extracted data
   - All data is editable before saving

### Processing Workflow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Upload  │────▶│ Process │────▶│ Review  │────▶│ Create  │
│Document │     │   AI    │     │  Data   │     │ Records │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
```

## Reports

The Reports section provides insights into your financial data.

### Available Reports

![Reports](../images/reports.png)

1. **Revenue Report**
   - Monthly revenue breakdown
   - Comparison with previous periods
   - Trends and projections

2. **Client Report**
   - Top clients by revenue
   - Payment behavior
   - Outstanding balances

3. **Invoice Aging Report**
   - Overdue invoices by time period
   - Collection rate
   - Average days to payment

4. **Custom Reports**
   - Select date range
   - Choose metrics
   - Export to CSV or PDF

## Settings

The Settings section allows you to customize your I-Invoyisi experience.

### Profile Settings

![Profile Settings](../images/profile-settings.png)

1. **User Information**
   - Update name and email
   - Change password
   - Upload profile picture

2. **Company Details**
   - Company name
   - Logo
   - Address
   - Tax information

3. **Invoice Settings**
   - Default due days
   - Default tax rate
   - Invoice numbering format
   - Terms and conditions template

## Tips and Best Practices

1. **Regular Backups**
   - Export important data regularly
   - Keep backup copies of critical invoices

2. **Efficient Workflow**
   - Use document processing for bulk invoice creation
   - Set up recurring invoices for regular clients
   - Use the dashboard to identify overdue invoices quickly

3. **Document Organization**
   - Use consistent naming for invoices
   - Add detailed notes to clients and invoices
   - Tag invoices for easier searching

4. **Security**
   - Use a strong password
   - Don't share your login credentials
   - Log out when using shared computers

## Troubleshooting

### Common Issues

1. **Document Processing Errors**
   - Ensure document is clear and legible
   - Try a different file format
   - Manually enter data if extraction fails

2. **Invoice Calculations**
   - Verify tax rates are correct
   - Check that line items add up to subtotal
   - Ensure discounts are applied correctly

3. **Client Data Issues**
   - Update client information regularly
   - Check for duplicate client records
   - Verify email addresses for sending invoices

For additional help, contact support at [calinetetong@gmail.com](mailto:calinetetong@gmail.com).
