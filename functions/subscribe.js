// Netlify Function: Subscribe to Daily Digest
// Saves subscriber email to Supabase

const { createClient } = require('@supabase/supabase-js');

// Supabase config (will be set via Netlify environment variables)
// Support both naming conventions (Netlify integration vs manual setup)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Parse request body
    const { email } = JSON.parse(event.body);

    // Validate email
    if (!email || !isValidEmail(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email address' })
      };
    }

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase credentials not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('digest_subscribers')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = not found (which is OK)
      console.error('Database check error:', checkError);
      throw new Error('Database error');
    }

    if (existing) {
      // Email already subscribed
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Already subscribed',
          alreadySubscribed: true
        })
      };
    }

    // Insert new subscriber
    const { data, error } = await supabase
      .from('digest_subscribers')
      .insert([
        {
          email: email.toLowerCase(),
          subscribed_at: new Date().toISOString(),
          active: true,
          source: 'landing_page'
        }
      ])
      .select();

    if (error) {
      console.error('Insert error:', error);
      throw new Error('Failed to save subscription');
    }

    // Success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Successfully subscribed'
      })
    };

  } catch (error) {
    console.error('Subscription error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Subscription failed. Please try again.'
      })
    };
  }
};

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
