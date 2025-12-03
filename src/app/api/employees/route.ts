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
    const designation = searchParams.get('designation');
    const status = searchParams.get('status');
    const employeeName = searchParams.get('employeeName');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = {};
    
    if (department) {
      query['jobInfo.department'] = department;
    }
    
    if (designation) {
      query['jobInfo.designation'] = { $regex: designation, $options: 'i' };
    }
    
    if (status) {
      query.status = status;
    }
    
    if (employeeName) {
      query.$or = [
        { 'personalInfo.firstName': { $regex: employeeName, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: employeeName, $options: 'i' } },
        { 
          $expr: {
            $regexMatch: {
              input: { $concat: ['$personalInfo.firstName', ' ', '$personalInfo.lastName'] },
              regex: employeeName,
              options: 'i'
            }
          }
        },
      ];
    }
    
    if (startDate || endDate) {
      query['jobInfo.joiningDate'] = {};
      if (startDate) {
        query['jobInfo.joiningDate'].$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // Include the entire end date
        query['jobInfo.joiningDate'].$lte = endDateTime;
      }
    }

    const skip = (page - 1) * limit;
    
    const employees = await Employee.find(query)
      .populate('jobInfo.reportingManager', 'personalInfo.firstName personalInfo.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Employee.countDocuments(query);

    const pages = Math.ceil(total / limit);
    
    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
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
    const hashedPassword: string = await hashPassword('password123'); // Default password
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
