// PDF Generation utility for payroll slips
// This is a simple HTML-to-PDF solution using browser's print functionality

export interface PayrollRecord {
  _id: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: {
    housing: number;
    transport: number;
    medical: number;
    other: number;
  };
  deductions: {
    tax: number;
    insurance: number;
    loan: number;
    other: number;
  };
  overtime: number;
  bonus: number;
  netSalary: number;
  status: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function generatePayrollPDF(payroll: PayrollRecord, employeeName?: string) {
  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalAllowances = Object.values(payroll.allowances).reduce((sum, val) => sum + val, 0);
  const totalDeductions = Object.values(payroll.deductions).reduce((sum, val) => sum + val, 0);

  // Create HTML content for the PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payroll Slip - ${getMonthName(payroll.month)} ${payroll.year}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
        }
        .payroll-title {
          font-size: 18px;
          color: #374151;
          margin-bottom: 10px;
        }
        .pay-period {
          font-size: 14px;
          color: #6b7280;
        }
        .employee-info {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .info-label {
          font-weight: 600;
          color: #374151;
        }
        .info-value {
          color: #6b7280;
        }
        .breakdown {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .section {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .section-header {
          background: #f3f4f6;
          padding: 12px;
          font-weight: bold;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        .section-content {
          padding: 15px;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .item-row:last-child {
          border-bottom: none;
        }
        .total-row {
          background: #f0f9ff;
          padding: 12px;
          border-radius: 6px;
          margin-top: 10px;
          font-weight: bold;
        }
        .earnings-total {
          color: #059669;
        }
        .deductions-total {
          color: #dc2626;
        }
        .net-salary {
          background: #f0fdf4;
          border: 2px solid #22c55e;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin-top: 20px;
        }
        .net-salary-label {
          font-size: 16px;
          color: #374151;
          margin-bottom: 5px;
        }
        .net-salary-amount {
          font-size: 28px;
          font-weight: bold;
          color: #22c55e;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">HRMS System</div>
        <div class="payroll-title">PAYROLL SLIP</div>
        <div class="pay-period">${getMonthName(payroll.month)} ${payroll.year}</div>
      </div>

      <div class="employee-info">
        <div class="info-row">
          <span class="info-label">Employee:</span>
          <span class="info-value">${employeeName || 'Employee'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Pay Period:</span>
          <span class="info-value">${getMonthName(payroll.month)} ${payroll.year}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value">${payroll.status.toUpperCase()}</span>
        </div>
        ${payroll.paidAt ? `
        <div class="info-row">
          <span class="info-label">Paid Date:</span>
          <span class="info-value">${formatDate(payroll.paidAt)}</span>
        </div>
        ` : ''}
      </div>

      <div class="breakdown">
        <div class="section">
          <div class="section-header">EARNINGS</div>
          <div class="section-content">
            <div class="item-row">
              <span>Basic Salary</span>
              <span>${formatCurrency(payroll.basicSalary)}</span>
            </div>
            <div class="item-row">
              <span>Housing Allowance</span>
              <span>${formatCurrency(payroll.allowances.housing)}</span>
            </div>
            <div class="item-row">
              <span>Transport Allowance</span>
              <span>${formatCurrency(payroll.allowances.transport)}</span>
            </div>
            <div class="item-row">
              <span>Medical Allowance</span>
              <span>${formatCurrency(payroll.allowances.medical)}</span>
            </div>
            <div class="item-row">
              <span>Other Allowances</span>
              <span>${formatCurrency(payroll.allowances.other)}</span>
            </div>
            <div class="item-row">
              <span>Overtime Pay</span>
              <span>${formatCurrency(payroll.overtime)}</span>
            </div>
            <div class="item-row">
              <span>Bonus</span>
              <span>${formatCurrency(payroll.bonus)}</span>
            </div>
            <div class="total-row earnings-total">
              <span>Total Earnings</span>
              <span>${formatCurrency(payroll.basicSalary + totalAllowances + payroll.overtime + payroll.bonus)}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">DEDUCTIONS</div>
          <div class="section-content">
            <div class="item-row">
              <span>Tax</span>
              <span>${formatCurrency(payroll.deductions.tax)}</span>
            </div>
            <div class="item-row">
              <span>Insurance</span>
              <span>${formatCurrency(payroll.deductions.insurance)}</span>
            </div>
            <div class="item-row">
              <span>Loan Deduction</span>
              <span>${formatCurrency(payroll.deductions.loan)}</span>
            </div>
            <div class="item-row">
              <span>Other Deductions</span>
              <span>${formatCurrency(payroll.deductions.other)}</span>
            </div>
            <div class="total-row deductions-total">
              <span>Total Deductions</span>
              <span>${formatCurrency(totalDeductions)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="net-salary">
        <div class="net-salary-label">NET SALARY</div>
        <div class="net-salary-amount">${formatCurrency(payroll.netSalary)}</div>
      </div>

      <div class="footer">
        <p>This is a computer-generated payroll slip. No signature required.</p>
        <p>Generated on: ${formatDate(new Date())}</p>
      </div>
    </body>
    </html>
  `;

  // Create a new window with the HTML content
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close the window after printing (optional)
        // printWindow.close();
      }, 250);
    };
  } else {
    alert('Please allow popups to download the PDF');
  }
}
