import connectDB from '../lib/mongodb';
import User from '../models/User';
import { generateToken, verifyToken } from '../lib/auth';

async function verifyAdminToken() {
  try {
    await connectDB();
    
    // Find the admin user
    const admin = await User.findOne({ email: 'admin@hrms.com' });
    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('🔍 Admin user details:');
    console.log(`ID: ${admin._id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Employee ID: ${admin.employeeId || 'Not set'}`);
    console.log('');

    // Generate a new token
    const token = generateToken({
      userId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      employeeId: admin.employeeId,
    });

    console.log('🔑 Generated token:');
    console.log(token);
    console.log('');

    // Verify the token
    try {
      const payload = verifyToken(token);
      console.log('✅ Token verification successful:');
      console.log(`User ID: ${payload.userId}`);
      console.log(`Email: ${payload.email}`);
      console.log(`Role: ${payload.role}`);
      console.log(`Employee ID: ${payload.employeeId || 'Not set'}`);
    } catch (error) {
      console.log('❌ Token verification failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Error verifying admin token:', error);
  }
}

verifyAdminToken();
