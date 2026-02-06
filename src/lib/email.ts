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

export const sendCheckoutReminderEmail = async (email: string, employeeName: string) => {
  const mailOptions = {
    from: 'admin@yopmail.com',
    to: email,
    subject: 'HRMS - Check-Out Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">HRMS Check-Out Reminder</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="font-size: 16px; color: #374151;">Hello ${employeeName},</p>
          <p style="font-size: 16px; color: #374151;">
            This is a reminder that you have checked in today but haven't checked out yet.
          </p>
          <p style="font-size: 16px; color: #374151;">
            Please remember to check out before leaving for the day. If you don't check out before 12 AM, the system will automatically check you out, but it won't be counted in your attendance record.
          </p>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="font-size: 14px; color: #92400e; margin: 0;">
              <strong>Note:</strong> Auto-checkout at midnight will not be considered for attendance calculation.
            </p>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
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
    console.error('Error sending checkout reminder email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendTicketCreatedEmailToAdmin = async (adminEmail: string, ticketId: string, employeeName: string, ticketType: string, subject: string, priority: string) => {
  const priorityColors: Record<string, string> = {
    'High': '#dc2626',
    'Medium': '#f59e0b',
    'Low': '#10b981',
  };

  const mailOptions = {
    from: 'admin@yopmail.com',
    to: adminEmail,
    subject: `HRMS - New Ticket Created: ${ticketId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Support Ticket Created</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="font-size: 16px; color: #374151;">Hello Admin,</p>
          <p style="font-size: 16px; color: #374151;">
            A new support ticket has been created by an employee. Please review and take appropriate action.
          </p>
          <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Ticket ID:</td>
                <td style="padding: 8px 0; color: #6b7280;">${ticketId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Employee Name:</td>
                <td style="padding: 8px 0; color: #6b7280;">${employeeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Ticket Type:</td>
                <td style="padding: 8px 0; color: #6b7280;">${ticketType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Subject:</td>
                <td style="padding: 8px 0; color: #6b7280;">${subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Priority:</td>
                <td style="padding: 8px 0;">
                  <span style="background-color: ${priorityColors[priority] || '#6b7280'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                    ${priority}
                  </span>
                </td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dmhrms.vercel.app'}/admin/tickets" 
               style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Ticket
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
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
    console.error('Error sending ticket created email to admin:', error);
    throw new Error('Failed to send email');
  }
};

export const sendTicketUpdateEmailToEmployee = async (employeeEmail: string, employeeName: string, ticketId: string, status: string, note?: string) => {
  const statusColors: Record<string, string> = {
    'Open': '#3b82f6',
    'InProgress': '#8b5cf6',
    'Closed': '#10b981',
  };

  const mailOptions = {
    from: 'admin@yopmail.com',
    to: employeeEmail,
    subject: `HRMS - Ticket ${ticketId} Status Updated`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Ticket Status Updated</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="font-size: 16px; color: #374151;">Hello ${employeeName},</p>
          <p style="font-size: 16px; color: #374151;">
            Your support ticket status has been updated by the admin.
          </p>
          <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Ticket ID:</td>
                <td style="padding: 8px 0; color: #6b7280;">${ticketId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">New Status:</td>
                <td style="padding: 8px 0;">
                  <span style="background-color: ${statusColors[status] || '#6b7280'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                    ${status}
                  </span>
                </td>
              </tr>
              ${note ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Note:</td>
                <td style="padding: 8px 0; color: #6b7280;">${note}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dmhrms.vercel.app'}/tickets" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Ticket
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
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
    console.error('Error sending ticket update email to employee:', error);
    throw new Error('Failed to send email');
  }
};
