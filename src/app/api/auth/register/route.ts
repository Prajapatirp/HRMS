import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Employee from '@/models/Employee';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, password, role, employeeData } = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      role: role || 'employee',
    });

    await user.save();

    // If employee data is provided, create employee record
    let employeeId = null;
    if (employeeData && role !== 'admin') {
      const employee = new Employee({
        employeeId: `EMP${Date.now()}`, // Generate unique employee ID
        personalInfo: employeeData.personalInfo,
        jobInfo: employeeData.jobInfo,
      });
      
      await employee.save();
      employeeId = employee.employeeId;
      
      // Update user with employee ID
      user.employeeId = employeeId;
      await user.save();
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      employeeId: employeeId || undefined,
    });

    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: employeeId,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
