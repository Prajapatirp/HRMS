import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Employee from '@/models/Employee';
import { requireAuth } from '@/middleware/auth';

async function handler(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    
    // Get user details
    const userDetails = await User.findById(user.userId).select('-password');
    if (!userDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get employee details if employeeId exists
    let employeeDetails = null;
    if (userDetails.employeeId) {
      employeeDetails = await Employee.findOne({ employeeId: userDetails.employeeId });
    }

    return NextResponse.json({
      user: {
        id: userDetails._id,
        email: userDetails.email,
        role: userDetails.role,
        employeeId: userDetails.employeeId,
        isActive: userDetails.isActive,
        createdAt: userDetails.createdAt,
      },
      employee: employeeDetails,
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(handler);
