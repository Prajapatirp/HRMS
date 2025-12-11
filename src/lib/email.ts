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

export const sendLeaveNotification = async (
  email: string,
  type: 'submit' | 'approve' | 'reject' | 'reminder',
  leaveData: {
    employeeName?: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string;
    rejectionReason?: string;
    approverName?: string;
  }
) => {
  const subjectMap = {
    submit: 'New Leave Request Submitted',
    approve: 'Leave Request Approved',
    reject: 'Leave Request Rejected',
    reminder: 'Pending Leave Request Reminder',
  };

  const getEmailContent = () => {
    switch (type) {
      case 'submit':
        return `
          <p style="font-size: 16px; color: #374151;">
            A new leave request has been submitted and requires your approval.
          </p>
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Employee:</strong> ${leaveData.employeeName || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveData.leaveType}</p>
            <p style="margin: 5px 0;"><strong>Start Date:</strong> ${leaveData.startDate}</p>
            <p style="margin: 5px 0;"><strong>End Date:</strong> ${leaveData.endDate}</p>
            <p style="margin: 5px 0;"><strong>Total Days:</strong> ${leaveData.totalDays}</p>
            ${leaveData.reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${leaveData.reason}</p>` : ''}
          </div>
          <p style="font-size: 14px; color: #6b7280;">
            Please review and approve or reject this leave request in the HRMS system.
          </p>
        `;
      case 'approve':
        return `
          <p style="font-size: 16px; color: #374151;">
            Your leave request has been approved${leaveData.approverName ? ` by ${leaveData.approverName}` : ''}.
          </p>
          <div style="background-color: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveData.leaveType}</p>
            <p style="margin: 5px 0;"><strong>Start Date:</strong> ${leaveData.startDate}</p>
            <p style="margin: 5px 0;"><strong>End Date:</strong> ${leaveData.endDate}</p>
            <p style="margin: 5px 0;"><strong>Total Days:</strong> ${leaveData.totalDays}</p>
          </div>
        `;
      case 'reject':
        return `
          <p style="font-size: 16px; color: #374151;">
            Your leave request has been rejected${leaveData.approverName ? ` by ${leaveData.approverName}` : ''}.
          </p>
          <div style="background-color: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveData.leaveType}</p>
            <p style="margin: 5px 0;"><strong>Start Date:</strong> ${leaveData.startDate}</p>
            <p style="margin: 5px 0;"><strong>End Date:</strong> ${leaveData.endDate}</p>
            <p style="margin: 5px 0;"><strong>Total Days:</strong> ${leaveData.totalDays}</p>
            ${leaveData.rejectionReason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${leaveData.rejectionReason}</p>` : ''}
          </div>
        `;
      case 'reminder':
        return `
          <p style="font-size: 16px; color: #374151;">
            You have a pending leave request that requires your attention.
          </p>
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Employee:</strong> ${leaveData.employeeName || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveData.leaveType}</p>
            <p style="margin: 5px 0;"><strong>Start Date:</strong> ${leaveData.startDate}</p>
            <p style="margin: 5px 0;"><strong>End Date:</strong> ${leaveData.endDate}</p>
            <p style="margin: 5px 0;"><strong>Total Days:</strong> ${leaveData.totalDays}</p>
          </div>
          <p style="font-size: 14px; color: #6b7280;">
            Please review and take action on this leave request as soon as possible.
          </p>
        `;
      default:
        return '';
    }
  };

  const mailOptions = {
    from: 'admin@yopmail.com',
    to: email,
    subject: `HRMS - ${subjectMap[type]}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">HRMS Leave Management</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          ${getEmailContent()}
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
    console.error('Error sending leave notification email:', error);
    throw new Error('Failed to send leave notification email');
  }
};

