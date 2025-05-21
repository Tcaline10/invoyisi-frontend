# I-Invoyisi: Getting Started Guide

## Overview

I-Invoyisi is a smart invoice management system powered by artificial intelligence. This guide will help you set up and run the application on your local machine.

## System Requirements

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection (for API access)

## Installation

Follow these steps to set up the I-Invoyisi application:

### 1. Clone the Repository

```bash
git clone https://github.com/Tcaline10/Tcaline.git
cd Tcaline
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Server Configuration
PORT=5000
```

### 4. Start the Server

```bash
cd server
node server.js
```

### 5. Start the Development Server

In a new terminal window:

```bash
npm run dev
```

The application should now be running at `http://localhost:5173`.

## Project Structure

```
project/
├── docs/                  # Documentation
├── public/                # Static assets
├── server/                # Backend server
│   ├── routes/            # API routes
│   ├── uploads/           # Uploaded files
│   └── server.js          # Server entry point
├── src/                   # Frontend source code
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── layouts/           # Layout components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── styles/            # CSS styles
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main App component
│   └── main.tsx           # Entry point
└── package.json           # Project dependencies
```

## Key Features

- **AI-Powered Document Processing**: Upload invoices and let our AI extract all relevant information automatically.
- **Client Management**: Create and manage client profiles with detailed information.
- **Invoice Management**: Create, edit, and track invoices with status updates.
- **Dashboard**: Get a visual overview of your financial status with charts and statistics.
- **Payment Tracking**: Record and track payments for invoices.
- **Document Processing**: Extract data from invoices and receipts using AI.

## Troubleshooting

### Common Issues

1. **API Connection Errors**:
   - Ensure the server is running on port 5000
   - Check that the Vite proxy is configured correctly in `vite.config.ts`

2. **Database Connection Issues**:
   - Verify your Supabase credentials in the `.env` file
   - Check the Supabase console for any service disruptions

3. **AI Processing Errors**:
   - Ensure your Gemini API key is valid
   - Check that the document format is supported (PDF, JPG, PNG)

### Getting Help

If you encounter any issues not covered in this guide, please:

1. Check the [GitHub repository](https://github.com/Tcaline10/Tcaline.git) for known issues
2. Contact the developer at [calinetetong@gmail.com](mailto:calinetetong@gmail.com)

## Next Steps

After setting up the application, we recommend:

1. Exploring the [User Manual](./user-manual/README.md) to learn how to use the application
2. Reviewing the [System Design](./system-design/README.md) to understand the architecture
3. Checking out the [Class Diagrams](./diagrams/README.md) to understand the code structure
