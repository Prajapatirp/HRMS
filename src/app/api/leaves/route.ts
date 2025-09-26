import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Leave from '@/models/Leave';
import { requireAuth } from '@/middleware/auth';

async function getLeaves(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || user.employeeId;
    
    // For admin users, if no specific employeeId is requested, get all leaves
    if (!employeeId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Employee ID not found. Please contact HR to set up your employee profile.' },
        { status: 400 }
      );
    }
    const status = searchParams.get('status');
    const leaveType = searchParams.get('leaveType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};
    if (employeeId && user.role !== 'admin') {
      query.employeeId = employeeId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (leaveType) {
      query.leaveType = leaveType;
    }

    const skip = (page - 1) * limit;
    
    const leaves = await Leave.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Leave.countDocuments(query);

    return NextResponse.json({
      leaves,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get leaves error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createLeave(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    
    if (!user.employeeId) {
      return NextResponse.json(
        { error: 'Employee ID not found. Please contact HR to set up your employee profile.' },
        { status: 400 }
      );
    }
    
    const { 
      leaveType, 
      startDate, 
      endDate, 
      reason, 
      attachments 
    } = await req.json();

    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate dates
    if (start > end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }
    
    if (start < new Date()) {
      return NextResponse.json(
        { error: 'Cannot apply for leave in the past' },
        { status: 400 }
      );
    }
    
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    // Check for overlapping leave requests
    const overlappingLeave = await Leave.findOne({
      employeeId: user.employeeId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
    });

    if (overlappingLeave) {
      return NextResponse.json(
        { error: 'You have an overlapping leave request' },
        { status: 400 }
      );
    }

    const leave = new Leave({
      employeeId: user.employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      attachments: attachments || [],
    });

    await leave.save();

    return NextResponse.json({
      message: 'Leave request submitted successfully',
      leave,
    }, { status: 201 });

  } catch (error) {
    console.error('Create leave error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateLeave(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const { searchParams } = new URL(req.url);
    const leaveId = searchParams.get('id');
    
    if (!leaveId) {
      return NextResponse.json(
        { error: 'Leave ID is required' },
        { status: 400 }
      );
    }

    if (!user.employeeId) {
      return NextResponse.json(
        { error: 'Employee ID not found. Please contact HR to set up your employee profile.' },
        { status: 400 }
      );
    }
    
    const { status } = await req.json();
    
    const leave = await Leave.findOneAndUpdate(
      { _id: leaveId, employeeId: user.employeeId },
      { status },
      { new: true }
    );

    if (!leave) {
      return NextResponse.json(
        { error: 'Leave request not found or you are not authorized to update it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Leave request updated successfully',
      leave,
    });

  } catch (error) {
    console.error('Update leave error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getLeaves);
export const POST = requireAuth(createLeave);
export const PUT = requireAuth(updateLeave);
