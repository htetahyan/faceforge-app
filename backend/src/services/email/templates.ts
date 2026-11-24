/**
 * HTML verification email template with premium styling
 */
export function getVerificationEmailHtml(otp: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your GlowUp account</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f7f9fa;
        margin: 0;
        padding: 0;
        color: #333333;
      }
      .container {
        max-width: 500px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
        border: 1px solid #f0f2f5;
      }
      .header {
        background: linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%);
        padding: 32px 24px;
        text-align: center;
      }
      .logo {
        font-size: 28px;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: 0.5px;
      }
      .content {
        padding: 32px 24px;
        text-align: center;
      }
      h1 {
        font-size: 22px;
        font-weight: 700;
        margin-top: 0;
        color: #1a1a1a;
      }
      p {
        font-size: 15px;
        line-height: 1.6;
        color: #666666;
        margin-bottom: 24px;
      }
      .otp-container {
        background: #fff5f7;
        border: 1px dashed #ffb3c1;
        border-radius: 12px;
        padding: 20px;
        margin: 24px 0;
        display: inline-block;
        letter-spacing: 6px;
        font-size: 32px;
        font-weight: 800;
        color: #ff4d6d;
      }
      .footer {
        background-color: #fafbfb;
        padding: 24px;
        text-align: center;
        font-size: 12px;
        color: #999999;
        border-top: 1px solid #f0f2f5;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">✨ GlowUp</div>
      </div>
      <div class="content">
        <h1>Welcome to GlowUp!</h1>
        <p>Please use the verification code below to verify your email address and unlock AI portrait generation.</p>
        <div class="otp-container">${otp}</div>
        <p style="font-size: 13px; color: #999999; margin-bottom: 0;">This code is valid for 15 minutes. If you did not sign up for GlowUp, please ignore this email.</p>
      </div>
      <div class="footer">
        &copy; 2026 GlowUp App. Powered by Bun & Hono.
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * HTML password reset email template with premium styling
 */
export function getPasswordResetEmailHtml(otp: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your GlowUp password</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f7f9fa;
        margin: 0;
        padding: 0;
        color: #333333;
      }
      .container {
        max-width: 500px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
        border: 1px solid #f0f2f5;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 32px 24px;
        text-align: center;
      }
      .logo {
        font-size: 28px;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: 0.5px;
      }
      .content {
        padding: 32px 24px;
        text-align: center;
      }
      h1 {
        font-size: 22px;
        font-weight: 700;
        margin-top: 0;
        color: #1a1a1a;
      }
      p {
        font-size: 15px;
        line-height: 1.6;
        color: #666666;
        margin-bottom: 24px;
      }
      .otp-container {
        background: #f0f0ff;
        border: 1px dashed #667eea;
        border-radius: 12px;
        padding: 20px;
        margin: 24px 0;
        display: inline-block;
        letter-spacing: 6px;
        font-size: 32px;
        font-weight: 800;
        color: #667eea;
      }
      .footer {
        background-color: #fafbfb;
        padding: 24px;
        text-align: center;
        font-size: 12px;
        color: #999999;
        border-top: 1px solid #f0f2f5;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">🔐 GlowUp</div>
      </div>
      <div class="content">
        <h1>Password Reset Request</h1>
        <p>We received a request to reset your password. Use the code below to set a new password.</p>
        <div class="otp-container">${otp}</div>
        <p style="font-size: 13px; color: #999999; margin-bottom: 0;">This code is valid for 15 minutes. If you did not request a password reset, please ignore this email — your account is safe.</p>
      </div>
      <div class="footer">
        &copy; 2026 GlowUp App. Powered by Bun & Hono.
      </div>
    </div>
  </body>
  </html>
  `;
}
