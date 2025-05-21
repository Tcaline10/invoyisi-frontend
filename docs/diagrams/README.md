# I-Invoyisi: Class and Sequence Diagrams

This document provides the class diagrams and sequence diagrams for the I-Invoyisi application, illustrating the structure and interactions between different components of the system.

## Class Diagram

The class diagram below represents the main entities and their relationships in the I-Invoyisi application:

```mermaid
classDiagram
    class User {
        +id: string
        +name: string
        +email: string
        +avatar: string
        +role: string
        +companyId: string
        +authenticate()
        +updateProfile()
    }

    class Company {
        +id: string
        +name: string
        +logo: string
        +address: string
        +phone: string
        +email: string
        +website: string
        +taxNumber: string
        +updateDetails()
    }

    class Client {
        +id: string
        +name: string
        +email: string
        +phone: string
        +address: string
        +company: string
        +company_name: string
        +notes: string
        +user_id: string
        +created_at: Date
        +updated_at: Date
        +createClient()
        +updateClient()
        +deleteClient()
        +getClientInvoices()
    }

    class Invoice {
        +id: string
        +number: string
        +clientId: string
        +issuedDate: Date
        +dueDate: Date
        +items: InvoiceItem[]
        +subtotal: number
        +taxRate: number
        +taxAmount: number
        +total: number
        +notes: string
        +status: InvoiceStatus
        +paymentMethod: string
        +createdAt: Date
        +updatedAt: Date
        +createInvoice()
        +updateInvoice()
        +deleteInvoice()
        +markAsPaid()
        +markAsUnpaid()
        +sendInvoice()
    }

    class InvoiceItem {
        +id: string
        +description: string
        +quantity: number
        +unitPrice: number
        +amount: number
        +calculateAmount()
    }

    class Payment {
        +id: string
        +amount: number
        +date: Date
        +method: string
        +reference: string
        +notes: string
        +invoice_id: string
        +user_id: string
        +created_at: Date
        +updated_at: Date
        +recordPayment()
        +updatePayment()
        +deletePayment()
    }

    class RecurringInvoice {
        +id: string
        +name: string
        +client_id: string
        +frequency: string
        +next_date: Date
        +last_sent: Date
        +template: object
        +user_id: string
        +created_at: Date
        +updated_at: Date
        +createRecurringInvoice()
        +updateRecurringInvoice()
        +deleteRecurringInvoice()
        +generateInvoice()
    }

    class GeminiService {
        +uploadFile()
        +extractDocumentData()
        +classifyDocument()
        +generateSummary()
        +deleteFile()
    }

    class InvoiceService {
        +getInvoices()
        +getInvoice()
        +createInvoice()
        +updateInvoice()
        +deleteInvoice()
        +getInvoicesByStatus()
        +getInvoicesByClient()
    }

    class ClientService {
        +getClients()
        +getClient()
        +createClient()
        +updateClient()
        +deleteClient()
        +getClientInvoices()
    }

    class PaymentService {
        +getPayments()
        +getPayment()
        +createPayment()
        +updatePayment()
        +deletePayment()
        +getPaymentsByInvoice()
    }

    User "1" -- "1" Company : belongs to
    User "1" -- "*" Client : manages
    User "1" -- "*" Invoice : creates
    User "1" -- "*" Payment : records
    Client "1" -- "*" Invoice : has
    Invoice "1" -- "*" InvoiceItem : contains
    Invoice "1" -- "*" Payment : receives
    Client "1" -- "*" RecurringInvoice : has
    InvoiceService -- Invoice : manages
    ClientService -- Client : manages
    PaymentService -- Payment : manages
    GeminiService -- Invoice : processes
```

## Sequence Diagrams

### 1. Invoice Creation Process

This sequence diagram illustrates the process of creating a new invoice:

```mermaid
sequenceDiagram
    actor User
    participant UI as User Interface
    participant IC as InvoiceController
    participant IS as InvoiceService
    participant DB as Database
    participant CS as ClientService
    
    User->>UI: Click "New Invoice"
    UI->>CS: getClients()
    CS->>DB: Query clients
    DB-->>CS: Return clients data
    CS-->>UI: Display client selection
    
    User->>UI: Select client
    User->>UI: Fill invoice details
    User->>UI: Add invoice items
    User->>UI: Click "Save"
    
    UI->>IC: createInvoice(invoiceData)
    IC->>IS: createInvoice(invoiceData)
    IS->>DB: Insert invoice data
    DB-->>IS: Return invoice ID
    IS-->>IC: Return invoice object
    IC-->>UI: Display success message
    UI-->>User: Show invoice details
```

### 2. Document Processing Workflow

This sequence diagram shows the AI-powered document processing workflow:

```mermaid
sequenceDiagram
    actor User
    participant UI as User Interface
    participant DC as DocumentController
    participant GS as GeminiService
    participant AI as AI Service
    participant IS as InvoiceService
    participant CS as ClientService
    participant DB as Database
    
    User->>UI: Upload document
    UI->>DC: uploadDocument(file)
    DC->>GS: uploadFile(file)
    GS->>AI: Process document
    AI-->>GS: Return file URI
    
    GS->>AI: extractDocumentData(fileUri)
    AI-->>GS: Return extracted data
    GS-->>DC: Return processed data
    DC-->>UI: Display extracted data
    
    User->>UI: Verify/Edit data
    User->>UI: Click "Create Invoice"
    
    UI->>CS: findMatchingClient(clientData)
    CS->>DB: Query matching clients
    DB-->>CS: Return matching client
    CS-->>UI: Display client selection
    
    User->>UI: Confirm client
    UI->>IS: createInvoice(invoiceData)
    IS->>DB: Insert invoice data
    DB-->>IS: Return invoice ID
    IS-->>UI: Return invoice object
    UI-->>User: Show success message
```

### 3. Payment Recording Process

This sequence diagram illustrates the process of recording a payment for an invoice:

```mermaid
sequenceDiagram
    actor User
    participant UI as User Interface
    participant PC as PaymentController
    participant PS as PaymentService
    participant IS as InvoiceService
    participant DB as Database
    
    User->>UI: View invoice details
    User->>UI: Click "Record Payment"
    UI->>IS: getInvoice(invoiceId)
    IS->>DB: Query invoice data
    DB-->>IS: Return invoice data
    IS-->>UI: Display invoice details
    
    User->>UI: Enter payment details
    User->>UI: Click "Save Payment"
    
    UI->>PC: createPayment(paymentData)
    PC->>PS: createPayment(paymentData)
    PS->>DB: Insert payment data
    DB-->>PS: Return payment ID
    
    PS->>IS: updateInvoiceStatus(invoiceId, "paid")
    IS->>DB: Update invoice status
    DB-->>IS: Confirm update
    
    PS-->>PC: Return payment object
    PC-->>UI: Display success message
    UI-->>User: Show updated invoice
```

These diagrams provide a high-level overview of the system's structure and key interactions. They can be used as a reference for understanding the application architecture and workflow.
