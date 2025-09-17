import connectDB from '../lib/mongodb';
import User from '../models/User';
import Employee from '../models/Employee';

async function setupJohnEmployee() {
  try {
    await connectDB();
    
    // Check if John user exists
    let johnUser = await User.findOne({ email: 'john@example.com' });
    if (!johnUser) {
      console.log('❌ John user not found! Creating user first...');
      
      // Create John user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      johnUser = new User({
        email: 'john@example.com',
        password: hashedPassword,
        role: 'employee',
        isActive: true,
      });
      
      await johnUser.save();
      console.log('✅ John user created successfully!');
    }

    console.log('🔍 John user details:');
    console.log(`Email: ${johnUser.email}`);
    console.log(`Role: ${johnUser.role}`);
    console.log(`Employee ID: ${johnUser.employeeId || 'Not set'}`);
    console.log('');

    // Check if John employee profile exists
    let johnEmployee = await Employee.findOne({ 
      'personalInfo.email': 'john@example.com' 
    });
    
    if (!johnEmployee) {
      console.log('❌ John employee profile not found! Creating employee profile...');
      
      // Generate unique employee ID
      const employeeId = `EMP${Date.now()}`;
      
      // Create John employee profile
      johnEmployee = new Employee({
        employeeId,
        personalInfo: {
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@example.com',
          phone: '+1234567890',
          address: {
            street: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          },
          dateOfBirth: new Date('1990-05-15'),
          gender: 'male',
          emergencyContact: {
            name: 'Jane Smith',
            relationship: 'Spouse',
            phone: '+1234567891'
          }
        },
        jobInfo: {
          designation: 'Software Developer',
          department: 'IT',
          employmentType: 'full-time',
          joiningDate: new Date(),
          salary: 75000,
          workLocation: 'Office',
          reportingManager: null
        },
        status: 'active'
      });

      await johnEmployee.save();
      console.log('✅ John employee profile created successfully!');
    } else {
      console.log('✅ John employee profile already exists!');
    }

    console.log('🔍 John employee profile details:');
    console.log(`Employee ID: ${johnEmployee.employeeId}`);
    console.log(`Name: ${johnEmployee.personalInfo.firstName} ${johnEmployee.personalInfo.lastName}`);
    console.log(`Email: ${johnEmployee.personalInfo.email}`);
    console.log(`Department: ${johnEmployee.jobInfo.department}`);
    console.log(`Position: ${johnEmployee.jobInfo.designation}`);
    console.log(`Salary: $${johnEmployee.jobInfo.salary?.toLocaleString()}`);
    console.log('');

    // Update John user with employeeId if not set
    if (!johnUser.employeeId) {
      johnUser.employeeId = johnEmployee.employeeId;
      await johnUser.save();
      console.log('✅ John user updated with employee ID!');
    }

    console.log('🎉 John is now ready to view his payroll records!');
    console.log('');
    console.log('📧 Login credentials:');
    console.log('Email: john@example.com');
    console.log('Password: password123');
    console.log(`Employee ID: ${johnEmployee.employeeId}`);
    
  } catch (error) {
    console.error('❌ Error setting up John employee:', error);
  }
}

setupJohnEmployee();
