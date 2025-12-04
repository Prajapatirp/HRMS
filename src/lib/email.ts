import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || 'smtp.gmail.com',
//   port: parseInt(process.env.SMTP_PORT || '587'),
//   secure: false, // true for 465, false for other ports
service: 'Gmail',
port: 25,
secure: false,
  auth: {
    user: 'ravi.praeclarum@gmail.com',
    pass: 'bbpc alkp cxwu edni',
  },
});

export const sendResetPasswordEmail = async (email: string, resetToken: string) => {
  // URL encode the token to ensure it's properly formatted in the email link
  const encodedToken = encodeURIComponent(resetToken);
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dmhrms.vercel.app'}/reset-password?token=${encodedToken}`;

  const mailOptions = {
    from: 'admin@yopmail.com',
    to: email,
    subject: 'HRMS - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">HRMS Password Reset</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="font-size: 16px; color: #374151;">Hello,</p>
          <p style="font-size: 16px; color: #374151;">
            You have requested to reset your password for your HRMS account. Click the button below to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">
            Or copy and paste this link into your browser:
          </p>
          <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">
            ${resetUrl}
          </p>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </p>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            Best regards,<br>
            HRMS Team
          </p>
        </div>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

