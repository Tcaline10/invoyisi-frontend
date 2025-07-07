#!/bin/bash

# Script to set up the database and storage buckets for InvoiceAI

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up InvoiceAI database and storage...${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Supabase CLI is not installed. Please install it first.${NC}"
    echo "Visit https://supabase.com/docs/guides/cli for installation instructions."
    exit 1
fi

# Check if we have the required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo -e "${YELLOW}SUPABASE_URL or SUPABASE_KEY environment variables not set.${NC}"
    echo -e "${YELLOW}Using values from .env file if available...${NC}"
    
    # Try to load from .env file
    if [ -f .env ]; then
        export $(grep -v '^#' .env | xargs)
        SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
        SUPABASE_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)
    fi
    
    # If still not set, prompt for values
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
        echo -e "${YELLOW}Please enter your Supabase credentials:${NC}"
        read -p "Supabase URL: " SUPABASE_URL
        read -p "Supabase Anon Key: " SUPABASE_KEY
    fi
fi

echo -e "${GREEN}Using Supabase URL: ${SUPABASE_URL}${NC}"

# Run the migrations
echo -e "${YELLOW}Running database migrations...${NC}"

# Base tables
echo -e "${YELLOW}Creating base tables...${NC}"
psql "$SUPABASE_URL/postgres" -f supabase/migrations/20250423003609_rough_island.sql && \
echo -e "${GREEN}Base tables created successfully.${NC}" || \
echo -e "${RED}Failed to create base tables.${NC}"

# Add payments table
echo -e "${YELLOW}Adding payments table...${NC}"
psql "$SUPABASE_URL/postgres" -f supabase/migrations/20250423003610_add_payments.sql && \
echo -e "${GREEN}Payments table added successfully.${NC}" || \
echo -e "${RED}Failed to add payments table.${NC}"

# Create storage buckets
echo -e "${YELLOW}Creating storage buckets...${NC}"
psql "$SUPABASE_URL/postgres" -f supabase/migrations/20250423003611_create_storage_buckets.sql && \
echo -e "${GREEN}Storage buckets created successfully.${NC}" || \
echo -e "${RED}Failed to create storage buckets.${NC}"

# Create companies table
echo -e "${YELLOW}Creating companies table...${NC}"
psql "$SUPABASE_URL/postgres" -f supabase/migrations/20250423003612_create_companies_table.sql && \
echo -e "${GREEN}Companies table created successfully.${NC}" || \
echo -e "${RED}Failed to create companies table.${NC}"

# Fix clients table
echo -e "${YELLOW}Fixing clients table...${NC}"
psql "$SUPABASE_URL/postgres" -f supabase/migrations/20250423003613_fix_clients_table.sql && \
echo -e "${GREEN}Clients table fixed successfully.${NC}" || \
echo -e "${RED}Failed to fix clients table.${NC}"

echo -e "${GREEN}Database setup completed!${NC}"
echo -e "${YELLOW}You can now run the application with:${NC}"
echo -e "${GREEN}npm run dev${NC}"
