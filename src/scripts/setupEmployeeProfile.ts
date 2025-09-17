import connectDB from '../lib/mongodb';
import User from '../models/User';
import Employee from '../models/Employee';

async function setupEmployeeProfile() {
  try {
    await connectDB();
    
    // Find users without employeeId (excluding admins)
    const usersWithoutEmployeeId = await User.find({
      employeeId: { $exists: false },
      role: { $ne: 'admin' }
    });

    if (usersWithoutEmployeeId.length === 0) {
      console.log('✅ All non-admin users already have employee profiles!');
      return;
    }

    console.log(`📋 Found ${usersWithoutEmployeeId.length} users without employee profiles:`);
    
    for (const user of usersWithoutEmployeeId) {
      console.log(`\n👤 Setting up employee profile for: ${user.email}`);
      
      // Generate unique employee ID
      const employeeId = `EMP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      // Create employee record with basic info
      const employee = new Employee({
        employeeId,
        personalInfo: {
          firstName: user.email.split('@')[0], // Use email prefix as first name
          lastName: 'User',
          email: user.email,
          phone: '000-000-0000', // Placeholder
          dateOfBirth: new Date('1990-01-01'), // Placeholder
          gender: 'other',
          address: {
            street: '123 Main St',
            city: 'City',
            state: 'State',
            zipCode: '12345',
            country: 'Country'
          },
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Family',
            phone: '000-000-0000'
          }
        },
        jobInfo: {
          department: 'General',
          designation: 'Employee',
          employmentType: 'full-time',
          joiningDate: new Date(),
          salary: 50000, // Placeholder
          workLocation: 'Office'
        },
        status: 'active'
      });

      await employee.save();
      
      // Update user with employee ID
      user.employeeId = employeeId;
      await user.save();
      
      console.log(`✅ Created employee profile with ID: ${employeeId}`);
    }

    console.log('\n🎉 All employee profiles have been set up successfully!');
    console.log('📝 Note: Users should update their personal information in their profile.');
    
  } catch (error) {
    console.error('❌ Error setting up employee profiles:', error);
  }
}

setupEmployeeProfile();
