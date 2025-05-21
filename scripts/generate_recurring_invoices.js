// Script to generate invoices from recurring templates
// This script can be run as a daily cron job
// Usage: node generate_recurring_invoices.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for background tasks

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY not set in .env file');
  process.exit(1);
}

// Create Supabase client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Main function to generate invoices
async function generateRecurringInvoices() {
  try {
    console.log('Starting recurring invoice generation...');
    
    // Get current date in ISO format (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Get all active recurring invoices due today or earlier
    const { data: recurringInvoices, error: fetchError } = await supabase
      .from('recurring_invoices')
      .select(`
        *,
        client:clients(id, name, email, phone, address, company_name)
      `)
      .eq('active', true)
      .lte('next_date', today);
    
    if (fetchError) {
      console.error('Error fetching recurring invoices:', fetchError);
      return;
    }
    
    console.log(`Found ${recurringInvoices.length} recurring invoices to process`);
    
    // Process each recurring invoice
    for (const recurringInvoice of recurringInvoices) {
      try {
        console.log(`Processing recurring invoice: ${recurringInvoice.name} (ID: ${recurringInvoice.id})`);
        
        // Get invoice settings for the user
        const { data: settings, error: settingsError } = await supabase
          .from('invoice_settings')
          .select('invoice_prefix, next_invoice_number')
          .eq('user_id', recurringInvoice.user_id)
          .maybeSingle();
        
        if (settingsError) {
          console.error(`Error fetching invoice settings for user ${recurringInvoice.user_id}:`, settingsError);
          continue;
        }
        
        // Use default settings if none found
        const prefix = settings?.invoice_prefix || 'INV-';
        const nextNumber = settings?.next_invoice_number || 1001;
        const invoiceNumber = `${prefix}${nextNumber}`;
        
        // Create the new invoice from the template
        const newInvoice = {
          number: invoiceNumber,
          status: 'draft',
          issued_date: today,
          due_date: calculateDueDate(new Date(), 30), // Default to 30 days
          subtotal: recurringInvoice.template.subtotal,
          tax: recurringInvoice.template.tax || 0,
          discount: recurringInvoice.template.discount || 0,
          total: recurringInvoice.template.total,
          notes: recurringInvoice.template.notes,
          client_id: recurringInvoice.client_id,
          user_id: recurringInvoice.user_id
        };
        
        // Insert the new invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert(newInvoice)
          .select()
          .single();
        
        if (invoiceError) {
          console.error(`Error creating invoice from recurring template ${recurringInvoice.id}:`, invoiceError);
          continue;
        }
        
        console.log(`Created invoice ${invoice.number} (ID: ${invoice.id})`);
        
        // Insert the invoice items
        const invoiceItems = recurringInvoice.template.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          invoice_id: invoice.id
        }));
        
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);
        
        if (itemsError) {
          console.error(`Error creating invoice items for invoice ${invoice.id}:`, itemsError);
          // Don't continue to avoid orphaned invoices
          await supabase.from('invoices').delete().eq('id', invoice.id);
          continue;
        }
        
        // Calculate the next date based on frequency
        const nextDate = calculateNextDate(recurringInvoice.next_date, recurringInvoice.frequency);
        
        // Update the recurring invoice with the new next_date and last_sent
        const { error: updateError } = await supabase
          .from('recurring_invoices')
          .update({
            next_date: nextDate,
            last_sent: today,
            updated_at: new Date().toISOString()
          })
          .eq('id', recurringInvoice.id);
        
        if (updateError) {
          console.error(`Error updating recurring invoice ${recurringInvoice.id}:`, updateError);
          continue;
        }
        
        // Update the invoice settings with the new next_invoice_number
        if (settings) {
          const { error: settingsUpdateError } = await supabase
            .from('invoice_settings')
            .update({ next_invoice_number: nextNumber + 1 })
            .eq('user_id', recurringInvoice.user_id);
          
          if (settingsUpdateError) {
            console.error(`Error updating invoice settings for user ${recurringInvoice.user_id}:`, settingsUpdateError);
          }
        }
        
        console.log(`Successfully processed recurring invoice ${recurringInvoice.id}`);
        console.log(`Next invoice will be generated on ${nextDate}`);
      } catch (err) {
        console.error(`Error processing recurring invoice ${recurringInvoice.id}:`, err);
      }
    }
    
    console.log('Recurring invoice generation completed');
  } catch (err) {
    console.error('Error in generateRecurringInvoices:', err);
  }
}

// Helper function to calculate the next date based on frequency
function calculateNextDate(currentDate, frequency) {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.toISOString().split('T')[0];
}

// Helper function to calculate due date
function calculateDueDate(issuedDate, dueDays) {
  const dueDate = new Date(issuedDate);
  dueDate.setDate(dueDate.getDate() + dueDays);
  return dueDate.toISOString().split('T')[0];
}

// Run the main function
generateRecurringInvoices()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
