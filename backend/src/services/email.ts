import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { getVerificationEmailHtml, getPasswordResetEmailHtml } from './email/templates.ts';

const resendApiKey = process.env.RESEND_API_KEY || '';
const emailFrom = process.env.EMAIL_FROM || 'GlowUp <onboarding@resend.dev>';
const appName = 'GlowUp';

// SMTP Configuration
const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const smtpSecure = process.env.SMTP_SECURE === 'true';

let transporter: nodemailer.Transporter | null = null;
let resend: Resend | null = null;

if (smtpHost && !smtpHost.startsWith('placeholder') && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
  console.log(`✉️ SMTP Transport initialized: ${smtpHost}:${smtpPort}`);
} else if (resendApiKey && !resendApiKey.startsWith('placeholder') && resendApiKey !== '') {
  resend = new Resend(resendApiKey);
  console.log('✉️ Resend Service initialized.');
} else {
  console.warn('⚠️ Neither Resend API Key nor SMTP credentials provided. Transactional emails will be LOGGED to console!');
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  /**
   * General purpose send email helper
   */
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // 1. Try sending via SMTP if configured
      if (transporter) {
        const info = await transporter.sendMail({
          from: emailFrom,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });
        console.log(`[Email Service] Email sent successfully via SMTP. MessageID: ${info.messageId}`);
        return { success: true, id: info.messageId };
      }

      // 2. Try sending via Resend if configured
      if (resend) {
        const response = await resend.emails.send({
          from: emailFrom,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });

        if (response.error) {
          console.error('[Resend Error]', response.error);
          return { success: false, error: response.error.message };
        }

        console.log(`[Email Service] Email sent successfully via Resend. ID: ${response.data?.id}`);
        return { success: true, id: response.data?.id };
      }

      // 3. Fallback mock logger for development
      console.log(`\n======================================================`);
      console.log(`📨 [MOCK EMAIL SERVICE]`);
      console.log(`   TO:       ${options.to}`);
      console.log(`   FROM:     ${emailFrom}`);
      console.log(`   SUBJECT:  ${options.subject}`);
      console.log(`   BODY:`);
      console.log(options.html.replace(/<[^>]*>/g, ' ').trim());
      console.log(`======================================================\n`);
      return { success: true, id: `mock-email-id-${Date.now()}` };
    } catch (err: any) {
      console.error('[Email Service] Failed to send email:', err);
      return { success: false, error: err.message || 'Unknown error' };
    }
  }

  /**
   * Send 6-digit OTP Verification Email with premium aesthetic styling
   */
  async sendVerificationOtp(email: string, otp: string): Promise<boolean> {
    const subject = `Verify your ${appName} Account — ${otp}`;
    const html = getVerificationEmailHtml(otp);
    const result = await this.sendEmail({ to: email, subject, html });
    return result.success;
  }

  /**
   * Send Password Reset OTP Email with premium styling
   */
  async sendPasswordResetOtp(email: string, otp: string): Promise<boolean> {
    const subject = `Reset your ${appName} Password — ${otp}`;
    const html = getPasswordResetEmailHtml(otp);
    const result = await this.sendEmail({ to: email, subject, html });
    return result.success;
  }
}

export const emailService = new EmailService();
export default emailService;
