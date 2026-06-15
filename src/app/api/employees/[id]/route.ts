import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import User from '@/models/User';
import { requireAuth, requireRole } from '@/middleware/auth';

async function getEmployee(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const employee = await Employee.findOne({ employeeId: params.id })
      .populate('jobInfo.reportingManager', 'personalInfo.firstName personalInfo.lastName');

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ employee });

  } catch (error) {
    console.error('Get employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateEmployee(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const updateData = await req.json();
    const existingEmployee = await Employee.findOne({ employeeId: params.id });

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const employee = await Employee.findOneAndUpdate(
      { employeeId: params.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const previousEmail = existingEmployee.personalInfo?.email?.toLowerCase()?.trim();
    const nextEmail = employee.personalInfo?.email?.toLowerCase()?.trim();

    if (nextEmail) {
      const linkedUser =
        (previousEmail ? await User.findOne({ email: previousEmail }) : null) ||
        (await User.findOne({ employeeId: params.id }));

      if (linkedUser) {
        if (nextEmail !== linkedUser.email?.toLowerCase()) {
          const emailTaken = await User.findOne({ email: nextEmail, _id: { $ne: linkedUser._id } });
          if (emailTaken) {
            return NextResponse.json(
              { error: 'Another user account already uses this email' },
              { status: 400 }
            );
          }
          linkedUser.email = nextEmail;
        }
        linkedUser.employeeId = params.id;
        await linkedUser.save();
      }
    }

    return NextResponse.json({
      message: 'Employee updated successfully',
      employee,
    });

  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deleteEmployee(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const employee = await Employee.findOneAndUpdate(
      { employeeId: params.id },
      { status: 'terminated' },
      { new: true }
    );

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Employee terminated successfully',
    });

  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getEmployee);
export const PUT = requireRole(['admin', 'hr'])(updateEmployee);
export const DELETE = requireRole(['admin', 'hr'])(deleteEmployee);
