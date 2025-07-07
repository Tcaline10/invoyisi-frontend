import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const { invoiceId } = await req.json();
    
    // Get invoice details
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
      
    if (error) throw error;
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(invoice.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        invoiceId: invoice.id,
      },
    });
    
    // Update invoice with payment intent ID
    await supabase
      .from('invoices')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', invoiceId);
    
    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});