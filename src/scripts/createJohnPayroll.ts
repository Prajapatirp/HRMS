import connectDB from '../lib/mongodb';
import Payroll from '../models/Payroll';

async function createJohnPayroll() {
  try {
    await connectDB();
    
    // John's employee ID from the previous setup
    const johnEmployeeId = 'EMP1758094397026';
    
    // Check if payroll already exists
    const existingPayroll = await Payroll.findOne({
      employeeId: johnEmployeeId,
      month: 1,
      year: 2024,
    });

    if (existingPayroll) {
      console.log('✅ John already has a payroll record for January 2024!');
      console.log(`Net Salary: $${existingPayroll.netSalary.toLocaleString()}`);
      return;
    }

    // Create a sample payroll record for John
    const johnPayroll = new Payroll({
      employeeId: johnEmployeeId,
      month: 1,
      year: 2024,
      basicSalary: 6250, // $75,000 / 12 months
      allowances: {
        housing: 625, // 10% of basic salary
        transport: 312.50, // 5% of basic salary
        medical: 187.50, // 3% of basic salary
        other: 100, // Bonus
      },
      deductions: {
        tax: 750, // 10% of basic salary
        insurance: 375, // 5% of basic salary
        loan: 0,
        other: 0,
      },
      overtime: 500,
      bonus: 200,
      netSalary: 6250 + 625 + 312.50 + 187.50 + 100 + 500 + 200 - 750 - 375, // $6,950
      status: 'paid',
      paidAt: new Date(),
    });

    await johnPayroll.save();
    
    console.log('✅ John payroll record created successfully!');
    console.log(`Employee ID: ${johnEmployeeId}`);
    console.log(`Month: January 2024`);
    console.log(`Basic Salary: $${johnPayroll.basicSalary.toLocaleString()}`);
    console.log(`Net Salary: $${johnPayroll.netSalary.toLocaleString()}`);
    console.log(`Status: ${johnPayroll.status}`);
    console.log('');
    console.log('🎉 John can now see his payroll record when he logs in!');
    
  } catch (error) {
    console.error('❌ Error creating John payroll:', error);
  }
}

createJohnPayroll();
