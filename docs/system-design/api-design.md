# I-Invoyisi: API Design

## Overview

This document outlines the API design for the I-Invoyisi application. The API follows RESTful principles and is organized around resources. All endpoints return JSON responses and accept JSON payloads where applicable.

## Base URL

```
https://api.i-invoyisi.com/v1
```

## Authentication

All API requests (except for authentication endpoints) require authentication using JWT tokens.

### Headers

```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Authentication

#### Register a new user

```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2023-01-01T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2023-01-01T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Clients

#### Get all clients

```
GET /clients
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of results per page (default: 20)
- `search` (optional): Search term to filter clients by name or email

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Acme Corporation",
      "email": "contact@acme.com",
      "phone": "123-456-7890",
      "company_name": "Acme Inc.",
      "created_at": "2023-01-01T12:00:00Z"
    },
    // More clients...
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

#### Get a specific client

```
GET /clients/:id
```

**Response:**
```json
{
  "id": 1,
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "123-456-7890",
  "address": "123 Main St, Anytown, USA",
  "company_name": "Acme Inc.",
  "notes": "Important client with multiple projects",
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-15T14:30:00Z"
}
```

#### Create a new client

```
POST /clients
```

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "123-456-7890",
  "address": "123 Main St, Anytown, USA",
  "company_name": "Acme Inc.",
  "notes": "Important client with multiple projects"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "123-456-7890",
  "address": "123 Main St, Anytown, USA",
  "company_name": "Acme Inc.",
  "notes": "Important client with multiple projects",
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-01T12:00:00Z"
}
```

#### Update a client

```
PUT /clients/:id
```

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "email": "new-contact@acme.com",
  "phone": "123-456-7890",
  "address": "456 New St, Anytown, USA",
  "company_name": "Acme Inc.",
  "notes": "Updated client notes"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Acme Corporation",
  "email": "new-contact@acme.com",
  "phone": "123-456-7890",
  "address": "456 New St, Anytown, USA",
  "company_name": "Acme Inc.",
  "notes": "Updated client notes",
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-15T14:30:00Z"
}
```

#### Delete a client

```
DELETE /clients/:id
```

**Response:**
```json
{
  "message": "Client deleted successfully"
}
```

#### Get client invoices

```
GET /clients/:id/invoices
```

**Query Parameters:**
- `status` (optional): Filter by invoice status (draft, unpaid, paid, overdue)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of results per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "number": "INV-001",
      "issued_date": "2023-01-10",
      "due_date": "2023-02-10",
      "total": 1250.00,
      "status": "paid",
      "created_at": "2023-01-10T10:00:00Z"
    },
    // More invoices...
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### Invoices

#### Get all invoices

```
GET /invoices
```

**Query Parameters:**
- `status` (optional): Filter by invoice status (draft, unpaid, paid, overdue)
- `client_id` (optional): Filter by client ID
- `start_date` (optional): Filter by issued date range start
- `end_date` (optional): Filter by issued date range end
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of results per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "number": "INV-001",
      "client": {
        "id": 1,
        "name": "Acme Corporation"
      },
      "issued_date": "2023-01-10",
      "due_date": "2023-02-10",
      "total": 1250.00,
      "status": "paid",
      "created_at": "2023-01-10T10:00:00Z"
    },
    // More invoices...
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

#### Get a specific invoice

```
GET /invoices/:id
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "number": "INV-001",
  "client": {
    "id": 1,
    "name": "Acme Corporation",
    "email": "contact@acme.com"
  },
  "issued_date": "2023-01-10",
  "due_date": "2023-02-10",
  "subtotal": 1000.00,
  "tax": 250.00,
  "discount": 0.00,
  "total": 1250.00,
  "notes": "Payment due within 30 days",
  "status": "paid",
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "description": "Web Development Services",
      "quantity": 10,
      "unit_price": 100.00,
      "amount": 1000.00
    }
  ],
  "payments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "amount": 1250.00,
      "payment_date": "2023-02-05",
      "method": "bank_transfer",
      "reference": "TRX123456"
    }
  ],
  "created_at": "2023-01-10T10:00:00Z",
  "updated_at": "2023-02-05T15:30:00Z"
}
```

#### Create a new invoice

```
POST /invoices
```

**Request Body:**
```json
{
  "client_id": 1,
  "issued_date": "2023-01-10",
  "due_date": "2023-02-10",
  "notes": "Payment due within 30 days",
  "status": "unpaid",
  "items": [
    {
      "description": "Web Development Services",
      "quantity": 10,
      "unit_price": 100.00
    }
  ],
  "tax": 250.00,
  "discount": 0.00
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "number": "INV-001",
  "client_id": 1,
  "issued_date": "2023-01-10",
  "due_date": "2023-02-10",
  "subtotal": 1000.00,
  "tax": 250.00,
  "discount": 0.00,
  "total": 1250.00,
  "notes": "Payment due within 30 days",
  "status": "unpaid",
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "description": "Web Development Services",
      "quantity": 10,
      "unit_price": 100.00,
      "amount": 1000.00
    }
  ],
  "created_at": "2023-01-10T10:00:00Z",
  "updated_at": "2023-01-10T10:00:00Z"
}
```

#### Update an invoice

```
PUT /invoices/:id
```

**Request Body:**
```json
{
  "client_id": 1,
  "issued_date": "2023-01-10",
  "due_date": "2023-02-15",
  "notes": "Updated payment terms",
  "status": "unpaid",
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "description": "Web Development Services",
      "quantity": 12,
      "unit_price": 100.00
    }
  ],
  "tax": 300.00,
  "discount": 100.00
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "number": "INV-001",
  "client_id": 1,
  "issued_date": "2023-01-10",
  "due_date": "2023-02-15",
  "subtotal": 1200.00,
  "tax": 300.00,
  "discount": 100.00,
  "total": 1400.00,
  "notes": "Updated payment terms",
  "status": "unpaid",
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "description": "Web Development Services",
      "quantity": 12,
      "unit_price": 100.00,
      "amount": 1200.00
    }
  ],
  "created_at": "2023-01-10T10:00:00Z",
  "updated_at": "2023-01-15T14:30:00Z"
}
```

#### Delete an invoice

```
DELETE /invoices/:id
```

**Response:**
```json
{
  "message": "Invoice deleted successfully"
}
```

#### Update invoice status

```
PATCH /invoices/:id/status
```

**Request Body:**
```json
{
  "status": "paid"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "paid",
  "updated_at": "2023-02-05T15:30:00Z"
}
```

### Payments

#### Get all payments

```
GET /payments
```

**Query Parameters:**
- `invoice_id` (optional): Filter by invoice ID
- `start_date` (optional): Filter by payment date range start
- `end_date` (optional): Filter by payment date range end
- `method` (optional): Filter by payment method
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of results per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "invoice_id": "550e8400-e29b-41d4-a716-446655440001",
      "invoice_number": "INV-001",
      "client": {
        "id": 1,
        "name": "Acme Corporation"
      },
      "amount": 1250.00,
      "payment_date": "2023-02-05",
      "method": "bank_transfer",
      "created_at": "2023-02-05T15:30:00Z"
    },
    // More payments...
  ],
  "pagination": {
    "total": 30,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

#### Record a payment

```
POST /payments
```

**Request Body:**
```json
{
  "invoice_id": "550e8400-e29b-41d4-a716-446655440001",
  "amount": 1250.00,
  "payment_date": "2023-02-05",
  "method": "bank_transfer",
  "reference": "TRX123456",
  "notes": "Full payment received"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "invoice_id": "550e8400-e29b-41d4-a716-446655440001",
  "amount": 1250.00,
  "payment_date": "2023-02-05",
  "method": "bank_transfer",
  "reference": "TRX123456",
  "notes": "Full payment received",
  "created_at": "2023-02-05T15:30:00Z",
  "updated_at": "2023-02-05T15:30:00Z"
}
```

### Documents

#### Upload a document

```
POST /documents/upload
```

**Request Body:**
Form data with file field named "document"

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "filename": "invoice.pdf",
  "size": 125000,
  "mime_type": "application/pdf",
  "url": "https://storage.i-invoyisi.com/documents/550e8400-e29b-41d4-a716-446655440004.pdf",
  "created_at": "2023-03-01T10:00:00Z"
}
```

#### Process a document

```
POST /documents/:id/process
```

**Response:**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440004",
  "document_type": "invoice",
  "extracted_data": {
    "client": {
      "name": "Acme Corporation",
      "email": "contact@acme.com",
      "address": "123 Main St, Anytown, USA"
    },
    "invoice": {
      "number": "INV-001",
      "issued_date": "2023-01-10",
      "due_date": "2023-02-10",
      "subtotal": 1000.00,
      "tax": 250.00,
      "total": 1250.00,
      "items": [
        {
          "description": "Web Development Services",
          "quantity": 10,
          "unit_price": 100.00,
          "amount": 1000.00
        }
      ]
    }
  },
  "confidence_score": 0.92,
  "processing_time": 1.5
}
```

### Dashboard

#### Get dashboard metrics

```
GET /dashboard/metrics
```

**Query Parameters:**
- `period` (optional): Time period for metrics (week, month, quarter, year) (default: month)

**Response:**
```json
{
  "total_paid": 15000.00,
  "total_unpaid": 5000.00,
  "total_overdue": 2500.00,
  "upcoming_due": 7500.00,
  "invoice_counts": {
    "draft": 5,
    "unpaid": 10,
    "paid": 30,
    "overdue": 3
  },
  "revenue_chart": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "datasets": [
      {
        "label": "Revenue",
        "data": [3000, 4500, 2500, 6000, 5000, 7500]
      }
    ]
  },
  "top_clients": [
    {
      "id": 1,
      "name": "Acme Corporation",
      "total_revenue": 7500.00,
      "invoice_count": 5
    },
    // More clients...
  ],
  "recent_activity": [
    {
      "type": "payment_received",
      "date": "2023-06-15T14:30:00Z",
      "details": {
        "invoice_id": "550e8400-e29b-41d4-a716-446655440010",
        "invoice_number": "INV-010",
        "amount": 2500.00,
        "client_name": "Acme Corporation"
      }
    },
    // More activities...
  ]
}
```

## Error Handling

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "resource_not_found",
    "message": "The requested resource was not found",
    "details": {
      "resource": "invoice",
      "id": "550e8400-e29b-41d4-a716-446655440001"
    }
  }
}
```

### Common Error Codes

- `invalid_request`: The request was malformed or contained invalid parameters
- `authentication_required`: Authentication is required for this endpoint
- `permission_denied`: The authenticated user does not have permission for this action
- `resource_not_found`: The requested resource was not found
- `validation_error`: The request data failed validation
- `rate_limit_exceeded`: The client has sent too many requests
- `server_error`: An unexpected error occurred on the server

## Rate Limiting

API requests are rate-limited to prevent abuse. The current limits are:

- 100 requests per minute per IP address
- 1000 requests per hour per user

Rate limit information is included in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1623456789
```

When the rate limit is exceeded, the API returns a 429 Too Many Requests response with a `rate_limit_exceeded` error code.
