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
    const limit = parseInt(searchParams.get('limit') || '100');
    const department = searchParams.get('department');
    const designation = searchParams.get('designation');
    const status = searchParams.get('status');
    const employeeName = searchParams.get('employeeName');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = {};
    
    // Handle status filter: if empty string, show all; if not provided, default to active
    if (status !== null && status !== undefined) {
      if (status === '') {
        // Empty string means show all statuses - don't add status filter
      } else {
        query.status = status;
      }
    } else {
      // No status param provided - default to active
      query.status = 'active';
    }
    
    if (department) {
      query['jobInfo.department'] = department;
    }
    
    if (designation) {
      query['jobInfo.designation'] = { $regex: designation, $options: 'i' };
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

    // Link or create user account for the employee
    const employeeEmail = employeeData.personalInfo?.email?.toLowerCase()?.trim();
    const hashedPassword: string = await hashPassword('password123');
    let user = employeeEmail ? await User.findOne({ email: employeeEmail }) : null;

    if (user) {
      user.employeeId = employeeId;
      user.role = user.role || 'employee';
      user.isActive = true;
      await user.save();
    } else if (employeeEmail) {
      user = new User({
        email: employeeEmail,
        password: hashedPassword,
        role: 'employee',
        employeeId,
        isActive: true,
      });
      await user.save();
    }

    return NextResponse.json({
      message: 'Employee created successfully',
      employee,
      user: user
        ? {
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
          }
        : null,
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
