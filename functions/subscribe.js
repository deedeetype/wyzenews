// Netlify Function: Subscribe to Daily Digest
// Saves subscriber email to Supabase

const { createClient } = require('@supabase/supabase-js');

// Supabase config (will be set via Netlify environment variables)
// Support both naming conventions (Netlify integration vs manual setup)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

exports.handler = async (event, context) => {
  console.log('[Subscribe] Function invoked');
  console.log('[Subscribe] Method:', event.httpMethod);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('[Subscribe] Method not allowed:', event.httpMethod);
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
    console.log('[Subscribe] Handling preflight request');
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Parse request body
    const { email } = JSON.parse(event.body);
    console.log('[Subscribe] Email received:', email);

    // Validate email
    if (!email || !isValidEmail(email)) {
      console.log('[Subscribe] Invalid email:', email);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email address' })
      };
    }

    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('[Subscribe] ERROR: Supabase credentials not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    console.log('[Subscribe] Connecting to Supabase:', SUPABASE_URL);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Check if email already exists
    console.log('[Subscribe] Checking for existing subscription...');
    const { data: existing, error: checkError } = await supabase
      .from('digest_subscribers')
      .select('id, email, active')
      .eq('email', email.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = not found (which is OK)
      console.error('[Subscribe] ERROR: Database check failed:', checkError);
      throw new Error('Database error');
    }

    if (existing) {
      // Email already exists - reactivate if inactive
      console.log('[Subscribe] Email already exists:', email);
      
      // Update to active=true (in case they unsubscribed before)
      const { error: updateError } = await supabase
        .from('digest_subscribers')
        .update({ 
          active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (updateError) {
        console.error('[Subscribe] ERROR: Reactivation failed:', updateError);
      } else {
        console.log('[Subscribe] Reactivated subscription:', email);
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Subscription reactivated',
          alreadySubscribed: true
        })
      };
    }

    // Insert new subscriber
    console.log('[Subscribe] Inserting new subscriber:', email);
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
      console.error('[Subscribe] ERROR: Insert failed:', error);
      throw new Error('Failed to save subscription');
    }
    
    console.log('[Subscribe] Successfully inserted subscriber:', data[0]?.email);

    // Send welcome email asynchronously (don't block response)
    const newSubscriber = data[0];
    if (newSubscriber && newSubscriber.unsubscribe_token) {
      // Call welcome email function
      console.log('[Subscribe] Triggering welcome email for:', newSubscriber.email);
      try {
        await fetch(`${process.env.URL}/.netlify/functions/send-welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: newSubscriber.email,
            unsubscribeToken: newSubscriber.unsubscribe_token
          })
        });
        console.log('[Subscribe] Welcome email triggered successfully');
      } catch (emailError) {
        // Log but don't fail subscription
        console.error('[Subscribe] WARNING: Welcome email failed (non-critical):', emailError);
      }
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
