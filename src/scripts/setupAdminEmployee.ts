import connectDB from '../lib/mongodb';
import User from '../models/User';
import Employee from '../models/Employee';

async function setupAdminEmployee() {
  try {
    await connectDB();
    
    // Find the admin user
    const admin = await User.findOne({ email: 'admin@hrms.com' });
    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }

    // Check if admin already has an employee profile
    if (admin.employeeId) {
      console.log('✅ Admin already has an employee profile!');
      console.log(`Employee ID: ${admin.employeeId}`);
      return;
    }

    // Generate unique employee ID
    const employeeId = `ADM${Date.now()}`;
    
    // Create employee profile for admin
    const employee = new Employee({
      employeeId,
      personalInfo: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@hrms.com',
        phone: '+1234567890',
        address: {
          street: '123 Admin Street',
          city: 'Admin City',
          state: 'AC',
          zipCode: '12345',
          country: 'USA'
        },
        dateOfBirth: new Date('1990-01-01'),
        gender: 'other',
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Friend',
          phone: '+1234567890'
        }
      },
      jobInfo: {
        designation: 'System Administrator',
        department: 'IT',
        employmentType: 'full-time',
        joiningDate: new Date(),
        salary: 100000,
        workLocation: 'Head Office',
        reportingManager: null
      },
      status: 'active'
    });

    await employee.save();

    // Update admin user with employeeId
    admin.employeeId = employeeId;
    await admin.save();
    
    console.log('✅ Admin employee profile created successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`👤 Employee ID: ${employeeId}`);
    console.log(`🏢 Position: System Administrator`);
    console.log(`📅 Start Date: ${employee.jobInfo.startDate.toDateString()}`);
    console.log('');
    console.log('🎉 Admin can now track attendance!');
    
  } catch (error) {
    console.error('❌ Error setting up admin employee profile:', error);
  }
}

setupAdminEmployee();
