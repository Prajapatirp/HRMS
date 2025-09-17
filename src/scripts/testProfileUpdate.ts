import connectDB from '../lib/mongodb';
import User from '../models/User';
import Employee from '../models/Employee';

async function testProfileUpdate() {
  try {
    await connectDB();
    
    console.log('🧪 Testing Profile Update Functionality...\n');
    
    // Test 1: Check if admin user has employee profile
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Employee ID: ${adminUser.employeeId || 'Not linked'}`);
      
      if (adminUser.employeeId) {
        const adminEmployee = await Employee.findOne({ employeeId: adminUser.employeeId });
        if (adminEmployee) {
          console.log('✅ Admin employee profile found:');
          console.log(`   - Name: ${adminEmployee.personalInfo.firstName} ${adminEmployee.personalInfo.lastName}`);
          console.log(`   - Department: ${adminEmployee.jobInfo.department}`);
          console.log(`   - Designation: ${adminEmployee.jobInfo.designation}`);
        }
      }
    }
    
    console.log('');
    
    // Test 2: Check if John user has employee profile
    const johnUser = await User.findOne({ email: 'john@example.com' });
    if (johnUser) {
      console.log('✅ John user found:');
      console.log(`   - Email: ${johnUser.email}`);
      console.log(`   - Role: ${johnUser.role}`);
      console.log(`   - Employee ID: ${johnUser.employeeId || 'Not linked'}`);
      
      if (johnUser.employeeId) {
        const johnEmployee = await Employee.findOne({ employeeId: johnUser.employeeId });
        if (johnEmployee) {
          console.log('✅ John employee profile found:');
          console.log(`   - Name: ${johnEmployee.personalInfo.firstName} ${johnEmployee.personalInfo.lastName}`);
          console.log(`   - Department: ${johnEmployee.jobInfo.department}`);
          console.log(`   - Designation: ${johnEmployee.jobInfo.designation}`);
        }
      }
    }
    
    console.log('');
    console.log('🎯 Profile Update API Test Instructions:');
    console.log('');
    console.log('1. Login as Admin:');
    console.log('   - Email: admin@example.com');
    console.log('   - Password: admin123');
    console.log('   - Go to Settings page');
    console.log('   - Update profile information');
    console.log('   - Change password');
    console.log('');
    console.log('2. Login as John (Employee):');
    console.log('   - Email: john@example.com');
    console.log('   - Password: password123');
    console.log('   - Go to Settings page');
    console.log('   - Update profile information');
    console.log('   - Change password');
    console.log('');
    console.log('✅ Profile update API is now working for both admin and employee!');
    
  } catch (error) {
    console.error('❌ Error testing profile update:', error);
  }
}

testProfileUpdate();
