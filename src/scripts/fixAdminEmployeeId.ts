import connectDB from '../lib/mongodb';
import User from '../models/User';
import Employee from '../models/Employee';

async function fixAdminEmployeeId() {
  try {
    await connectDB();
    
    // Find the admin user
    const admin = await User.findOne({ email: 'admin@hrms.com' });
    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('🔍 Current admin user:');
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Employee ID: ${admin.employeeId || 'Not set'}`);
    console.log('');

    // Find the admin employee record
    const adminEmployee = await Employee.findOne({ 
      'personalInfo.email': 'admin@hrms.com' 
    });
    
    if (!adminEmployee) {
      console.log('❌ Admin employee record not found!');
      return;
    }

    console.log('🔍 Found admin employee record:');
    console.log(`Employee ID: ${adminEmployee.employeeId}`);
    console.log(`Name: ${adminEmployee.personalInfo.firstName} ${adminEmployee.personalInfo.lastName}`);
    console.log(`Email: ${adminEmployee.personalInfo.email}`);
    console.log('');

    // Check if the employeeId matches
    if (admin.employeeId === adminEmployee.employeeId) {
      console.log('✅ Admin user already has the correct employeeId!');
      return;
    }

    // Update the admin user with the correct employeeId
    admin.employeeId = adminEmployee.employeeId;
    await admin.save();

    console.log('✅ Admin user updated successfully!');
    console.log(`New Employee ID: ${admin.employeeId}`);
    console.log('');
    console.log('🎉 Admin can now track attendance!');
    
  } catch (error) {
    console.error('❌ Error fixing admin employeeId:', error);
  }
}

fixAdminEmployeeId();
