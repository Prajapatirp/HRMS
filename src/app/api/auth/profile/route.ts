import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Employee from '@/models/Employee';
import { requireAuth } from '@/middleware/auth';
import { comparePassword, hashPassword } from '@/lib/auth';

async function getProfile(req: NextRequest) {
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
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateProfile(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const updateData = await req.json();
    
    // Get current user
    const currentUser = await User.findById(user.userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user email if provided
    if (updateData.email && updateData.email !== currentUser.email) {
      // Check if email already exists
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser && existingUser._id.toString() !== user.userId) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
      currentUser.email = updateData.email;
    }

    // Update password if provided
    if (updateData.currentPassword && updateData.newPassword) {
      const isCurrentPasswordValid = await comparePassword(updateData.currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      currentUser.password = await hashPassword(updateData.newPassword);
    }

    await currentUser.save();

    // Update employee profile if user has employeeId
    if (currentUser.employeeId && updateData.employeeData) {
      const employee = await Employee.findOne({ employeeId: currentUser.employeeId });
      if (employee) {
        // Update employee personal info
        if (updateData.employeeData.personalInfo) {
          employee.personalInfo = {
            ...employee.personalInfo,
            ...updateData.employeeData.personalInfo,
          };
        }

        // Update employee job info
        if (updateData.employeeData.jobInfo) {
          employee.jobInfo = {
            ...employee.jobInfo,
            ...updateData.employeeData.jobInfo,
          };
        }

        await employee.save();
      }
    }

    // Return updated user data
    const updatedUser = await User.findById(user.userId).select('-password');
    let updatedEmployee = null;
    if (currentUser.employeeId) {
      updatedEmployee = await Employee.findOne({ employeeId: currentUser.employeeId });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
        employeeId: updatedUser.employeeId,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
      },
      employee: updatedEmployee,
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getProfile);
export const PUT = requireAuth(updateProfile);
