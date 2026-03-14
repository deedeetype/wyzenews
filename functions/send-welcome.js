// Netlify Function: Send Welcome Email
// Sends welcome email to new subscriber via Gmail SMTP

const nodemailer = require('nodemailer');

// Gmail SMTP config (from environment variables)
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

exports.handler = async (event, context) => {
  console.log('[SendWelcome] Function invoked');
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('[SendWelcome] Method not allowed:', event.httpMethod);
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

  try {
    const { email, unsubscribeToken } = JSON.parse(event.body);
    console.log('[SendWelcome] Sending to:', email);

    if (!email || !unsubscribeToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing email or token' })
      };
    }

    // Check credentials
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error('Gmail credentials not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Email service not configured' })
      };
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD
      }
    });

    // Get site URL from Netlify or fallback
    const siteUrl = process.env.URL || 'https://wyzenews.netlify.app';
    const unsubscribeUrl = `${siteUrl}/unsubscribe.html?token=${unsubscribeToken}`;

    // Welcome email HTML
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #e0e0e0;
            background-color: #0f0f1e;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1e1e3f 0%, #2a2a4a 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .header-logo {
            margin-bottom: 20px;
        }
        .header-logo img {
            width: 180px;
            max-width: 80%;
            height: auto;
        }
        .header h1 {
            color: #ffffff;
            font-size: 32px;
            margin: 0 0 10px 0;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #ffffff;
            font-size: 24px;
            margin: 0 0 20px 0;
        }
        .content p {
            color: #b8b8d1;
            font-size: 16px;
            margin: 0 0 20px 0;
        }
        .feature-box {
            background: rgba(102, 126, 234, 0.2);
            border-left: 4px solid #667eea;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .feature-box strong {
            color: #ffffff;
        }
        .feature-box {
            color: #ffffff;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            margin: 20px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
        }
        .footer {
            background-color: #0f0f1e;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #7a7a9e;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .unsubscribe {
            margin-top: 15px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-logo">
                <img src="https://wyzenews.com/assets/WyzeNewsLogo.png" alt="WyzeNews Logo">
            </div>
            <h1>🌍 Welcome to WyzeNews!</h1>
        </div>
        
        <div class="content">
            <h2>Thanks for subscribing! 🎉</h2>
            
            <p>You're all set to receive your daily digest of breaking news with stunning comic strip visuals.</p>
            
            <div class="feature-box">
                <strong>📰 What you'll get:</strong><br>
                • 3 curated breaking news stories daily<br>
                • Concise, factual summaries<br>
                • Unique comic strip illustrations<br>
                • Delivered daily to your inbox
            </div>
            
            <p>Your first digest will arrive tomorrow morning. We scan the world's most significant events and present them in an engaging, visual format.</p>
            
            <div style="background: rgba(255, 193, 7, 0.15); border-left: 4px solid #ffc107; padding: 15px 20px; margin: 25px 0; border-radius: 8px;">
                <strong style="color: #ffc107;">📬 Important:</strong>
                <span style="color: #e0e0e0;"> Please check your <strong>Spam/Junk</strong> folder if you don't see our emails. To ensure delivery, add <strong>noreply@wyzenews.com</strong> to your contacts.</span>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://wyzenews.com" class="button">Visit WyzeNews</a>
            </div>
            
            <p style="color: #8b8ba7; font-size: 14px; margin-top: 30px;">
                <strong>Note:</strong> If you didn't sign up for this, you can unsubscribe at any time using the link below.
            </p>
        </div>
        
        <div class="footer">
            <p>
                <strong>WyzeNews</strong> by <a href="https://labwyze.com">Labwyze Inc.</a>
            </p>
            <p class="unsubscribe">
                <a href="${unsubscribeUrl}">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>
    `;

    // Plain text version
    const textContent = `
Welcome to WyzeNews!

Thanks for subscribing! You're all set to receive your daily digest of breaking news with AI-generated comic strip visuals.

What you'll get:
• 3 curated breaking news stories daily
• Concise, factual summaries
• Unique comic strip illustrations
• Delivered daily to your inbox

Your first digest will arrive tomorrow morning.

If you didn't sign up for this, you can unsubscribe here:
${unsubscribeUrl}

---
WyzeNews by Labwyze Inc.
    `;

    // Send email
    const mailOptions = {
      from: '"WyzeNews" <noreply@wyzenews.com>',
      to: email,
      subject: '🌍 Welcome to WyzeNews - Your Daily News Digest',
      text: textContent,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Welcome email error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to send welcome email' })
    };
  }
};
