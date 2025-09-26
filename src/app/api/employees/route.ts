import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import User from '@/models/User';
import { requireRole } from '@/middleware/auth';
import { hashPassword } from '@/lib/auth';

async function getEmployees(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = {};
    
    if (department) {
      query['jobInfo.department'] = department;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    
    const employees = await Employee.find(query)
      .populate('jobInfo.reportingManager', 'personalInfo.firstName personalInfo.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Employee.countDocuments(query);

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createEmployee(req: NextRequest) {
  try {
    await connectDB();
    
    const employeeData = await req.json();
    
    // Generate unique employee ID
    const employeeId = `EMP${Date.now()}`;
    
    const employee = new Employee({
      ...employeeData,
      employeeId,
    });

    await employee.save();

    // Create a user account for the employee
    const hashedPassword = await hashPassword('password123'); // Default password
    const user = new User({
      email: employeeData.personalInfo.email,
      password: hashedPassword,
      role: 'employee',
      employeeId: employeeId,
      isActive: true,
    });

    await user.save();

    return NextResponse.json({
      message: 'Employee created successfully',
      employee,
      user: {
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireRole(['admin', 'hr'])(getEmployees);
export const POST = requireRole(['admin', 'hr'])(createEmployee);
