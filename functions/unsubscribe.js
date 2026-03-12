// Netlify Function: Unsubscribe from Daily Digest
// Marks subscriber as inactive based on unsubscribe token

const { createClient } = require('@supabase/supabase-js');

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

exports.handler = async (event, context) => {
  console.log('[Unsubscribe] Function invoked');
  console.log('[Unsubscribe] Method:', event.httpMethod);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('[Unsubscribe] Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('[Unsubscribe] Handling preflight request');
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Parse request body
    const { token } = JSON.parse(event.body);
    console.log('[Unsubscribe] Token received:', token?.substring(0, 8) + '...');

    // Validate token
    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing unsubscribe token' })
      };
    }

    // Check Supabase credentials
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase credentials not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Find subscriber by token
    const { data: subscriber, error: findError } = await supabase
      .from('digest_subscribers')
      .select('id, email, active')
      .eq('unsubscribe_token', token)
      .single();

    if (findError || !subscriber) {
      console.error('Subscriber not found:', findError);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid unsubscribe token. Subscriber not found.' 
        })
      };
    }

    // Check if already unsubscribed
    if (!subscriber.active) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Already unsubscribed',
          alreadyUnsubscribed: true
        })
      };
    }

    // Mark as inactive
    const { error: updateError } = await supabase
      .from('digest_subscribers')
      .update({ 
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update subscription status');
    }

    // Success
    console.log(`Unsubscribed: ${subscriber.email}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Successfully unsubscribed'
      })
    };

  } catch (error) {
    console.error('Unsubscribe error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Unsubscribe failed. Please try again or contact support.'
      })
    };
  }
};
