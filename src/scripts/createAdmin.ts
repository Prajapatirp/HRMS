import connectDB from '../lib/mongodb';
import User from '../models/User';
import { hashPassword } from '../lib/auth';

async function createAdmin() {
  try {
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@yopmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      return;
    }

    // Create admin user
    const hashedPassword = await hashPassword('Admin@123');
    
    const admin = new User({
      email: 'admin@yopmail.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });

    await admin.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@yopmail.com');
    console.log('🔑 Password: Admin@123');
    console.log('👤 Role: Admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

createAdmin();
