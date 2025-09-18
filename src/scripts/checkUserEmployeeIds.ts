import connectDB from '../lib/mongodb';
import User from '../models/User';
import Employee from '../models/Employee';

async function checkUserEmployeeIds() {
  try {
    await connectDB();
    
    console.log('🔍 Checking all users and their employee IDs...\n');
    
    const users = await User.find({}).select('email role employeeId');
    
    for (const user of users) {
      console.log(`👤 User: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Employee ID: ${user.employeeId || '❌ Not set'}`);
      
      if (user.employeeId) {
        // Check if employee record exists
        const employee = await Employee.findOne({ employeeId: user.employeeId });
        if (employee) {
          console.log(`   ✅ Employee record found: ${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`);
        } else {
          console.log(`   ❌ Employee record not found for ID: ${user.employeeId}`);
        }
      }
      console.log('');
    }
    
    console.log('📊 Summary:');
    const usersWithEmployeeId = users.filter(u => u.employeeId);
    const usersWithoutEmployeeId = users.filter(u => !u.employeeId);
    
    console.log(`   Total users: ${users.length}`);
    console.log(`   Users with employee ID: ${usersWithEmployeeId.length}`);
    console.log(`   Users without employee ID: ${usersWithoutEmployeeId.length}`);
    
    if (usersWithoutEmployeeId.length > 0) {
      console.log('\n❌ Users without employee ID:');
      usersWithoutEmployeeId.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking user employee IDs:', error);
  } finally {
    process.exit(0);
  }
}

checkUserEmployeeIds();
