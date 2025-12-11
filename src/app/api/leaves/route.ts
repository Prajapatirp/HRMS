import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Leave from '@/models/Leave';
import Employee from '@/models/Employee';
import { requireAuth } from '@/middleware/auth';
import {
  calculateTotalDays,
  checkOverlappingLeaves,
  checkBlackoutDates,
  isOnProbation,
  updateLeaveBalance,
  getOrCreateLeaveEntitlement,
} from '@/lib/leave-calculations';
import { sendLeaveNotification } from '@/lib/email';

// Default blackout dates (can be configured per organization)
const BLACKOUT_DATES: Array<{ start: Date; end: Date }> = [
  // Example: Year-end blackout
  // { start: new Date(2024, 11, 20), end: new Date(2024, 11, 31) },
];

async function getLeaves(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || user.employeeId;
    const status = searchParams.get('status');
    const leaveType = searchParams.get('leaveType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // For admin users, if no specific employeeId is requested, get all leaves
    if (!employeeId && user.role !== 'admin' && user.role !== 'hr') {
      return NextResponse.json(
        { error: 'Employee ID not found. Please contact HR to set up your employee profile.' },
        { status: 400 }
      );
    }
    
    const query: any = {};
    
    // For non-admin users, filter by their employeeId
    if (employeeId && user.role !== 'admin' && user.role !== 'hr') {
      query.employeeId = employeeId;
    } else if (employeeId && (user.role === 'admin' || user.role === 'hr')) {
      // Admin can filter by specific employee
      query.employeeId = employeeId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (leaveType) {
      query.leaveType = leaveType;
    }
    
    if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
    }

    const skip = (page - 1) * limit;
    
    const leaves = await Leave.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Populate employee info for admin views
    if (user.role === 'admin' || user.role === 'hr') {
      for (const leave of leaves) {
        const employee = await Employee.findOne({ employeeId: leave.employeeId });
        if (employee) {
          (leave as any).employeeName = `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`;
          (leave as any).employeeEmail = employee.personalInfo.email;
        }
      }
    }

    const total = await Leave.countDocuments(query);
    const pages = Math.ceil(total / limit);
    const hasNext = page < pages;
    const hasPrev = page > 1;

    return NextResponse.json({
      leaves,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext,
        hasPrev,
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
      partialDays,
      attachments,
      status = 'pending' // Allow draft status
    } = await req.json();

    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Get employee details
    const employee = await Employee.findOne({ employeeId: user.employeeId });
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
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
    
    // Allow past dates for draft status, but not for pending
    if (status === 'pending' && start < new Date()) {
      return NextResponse.json(
        { error: 'Cannot apply for leave in the past' },
        { status: 400 }
      );
    }
    
    const totalDays = calculateTotalDays(start, end);
    
    // Business rules validation (only for pending status)
    if (status === 'pending') {
      // Check probation period (for PTO only)
      if (leaveType === 'pto' && employee.jobInfo.joiningDate) {
        const onProbation = isOnProbation(employee.jobInfo.joiningDate);
        if (onProbation) {
          return NextResponse.json(
            { error: 'You are on probation. PTO cannot be applied during probation period.' },
            { status: 400 }
          );
        }
      }
      
      // Check blackout dates
      if (checkBlackoutDates(start, end, BLACKOUT_DATES)) {
        return NextResponse.json(
          { error: 'Leave cannot be applied during blackout dates' },
          { status: 400 }
        );
      }
      
      // Check for overlapping leaves
      const overlappingLeave = await checkOverlappingLeaves(
        user.employeeId,
        start,
        end
      );
      
      if (overlappingLeave) {
        return NextResponse.json(
          { error: 'You have an overlapping leave request. Please cancel or modify existing request first.' },
          { status: 400 }
        );
      }
      
      // Check leave balance (for PTO only)
      if (leaveType === 'pto') {
        const year = start.getFullYear();
        const entitlement = await getOrCreateLeaveEntitlement(
          user.employeeId,
          leaveType,
          year
        );
        
        // Update balance to get latest pending count
        await updateLeaveBalance(user.employeeId, leaveType, year);
        const updatedEntitlement = await getOrCreateLeaveEntitlement(
          user.employeeId,
          leaveType,
          year
        );
        
        if (updatedEntitlement.available < totalDays) {
          return NextResponse.json(
            { 
              error: `Insufficient leave balance. Available: ${updatedEntitlement.available} days, Requested: ${totalDays} days` 
            },
            { status: 400 }
          );
        }
      }
    }

    const leave = new Leave({
      employeeId: user.employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      partialDays: partialDays || undefined,
      reason,
      status,
      attachments: attachments || [],
    });

    await leave.save();
    
    // Update leave balance if status is pending
    if (status === 'pending') {
      const year = start.getFullYear();
      await updateLeaveBalance(user.employeeId, leaveType, year);
      
      // Send notification to manager/admin
      try {
        const managerEmail = employee.jobInfo.reportingManager 
          ? (await Employee.findOne({ employeeId: employee.jobInfo.reportingManager }))?.personalInfo.email
          : null;
        
        if (managerEmail) {
          await sendLeaveNotification(
            managerEmail,
            'submit',
            {
              employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
              leaveType,
              startDate: start.toLocaleDateString(),
              endDate: end.toLocaleDateString(),
              totalDays,
              reason,
            }
          );
        }
      } catch (emailError) {
        console.error('Failed to send leave notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      message: status === 'draft' 
        ? 'Leave request saved as draft' 
        : 'Leave request submitted successfully',
      leave,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create leave error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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
    
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }
    
    const { status, rejectionReason, ...updateData } = await req.json();
    
    // Check authorization
    const isOwner = leave.employeeId === user.employeeId;
    const isAdmin = user.role === 'admin' || user.role === 'hr';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to update this leave request' },
        { status: 403 }
      );
    }
    
    // Status transition rules
    if (status) {
      // Only owner can cancel
      if (status === 'cancelled' && !isOwner) {
        return NextResponse.json(
          { error: 'Only the employee can cancel their leave request' },
          { status: 403 }
        );
      }
      
      // Only admin can approve/reject
      if ((status === 'approved' || status === 'rejected') && !isAdmin) {
        return NextResponse.json(
          { error: 'Only admin/HR can approve or reject leave requests' },
          { status: 403 }
        );
      }
      
      // Can only cancel pending or draft leaves
      if (status === 'cancelled' && !['pending', 'draft'].includes(leave.status)) {
        return NextResponse.json(
          { error: 'Cannot cancel a leave that is already approved, rejected, or processed' },
          { status: 400 }
        );
      }
      
      // Update status-specific fields
      if (status === 'approved') {
        leave.approvedBy = user.employeeId || user.userId;
        leave.approvedAt = new Date();
        leave.rejectionReason = undefined;
        leave.rejectedBy = undefined;
        leave.rejectedAt = undefined;
      } else if (status === 'rejected') {
        leave.rejectedBy = user.employeeId || user.userId;
        leave.rejectedAt = new Date();
        leave.rejectionReason = rejectionReason || 'No reason provided';
        leave.approvedBy = undefined;
        leave.approvedAt = undefined;
      } else if (status === 'processed') {
        leave.processedAt = new Date();
      }
      
      leave.status = status;
    }
    
    // Update other fields if provided
    if (updateData.startDate) leave.startDate = new Date(updateData.startDate);
    if (updateData.endDate) leave.endDate = new Date(updateData.endDate);
    if (updateData.leaveType) leave.leaveType = updateData.leaveType;
    if (updateData.reason) leave.reason = updateData.reason;
    if (updateData.partialDays !== undefined) leave.partialDays = updateData.partialDays;
    if (updateData.attachments) leave.attachments = updateData.attachments;
    
    // Recalculate total days if dates changed
    if (updateData.startDate || updateData.endDate) {
      leave.totalDays = calculateTotalDays(leave.startDate, leave.endDate);
    }
    
    await leave.save();
    
    // Update leave balance
    const year = leave.startDate.getFullYear();
    await updateLeaveBalance(leave.employeeId, leave.leaveType, year);
    
    // Send notifications
    try {
      const employee = await Employee.findOne({ employeeId: leave.employeeId });
      if (employee && status) {
        if (status === 'approved') {
          await sendLeaveNotification(
            employee.personalInfo.email,
            'approve',
            {
              leaveType: leave.leaveType,
              startDate: leave.startDate.toLocaleDateString(),
              endDate: leave.endDate.toLocaleDateString(),
              totalDays: leave.totalDays,
              approverName: user.name || 'Admin',
            }
          );
        } else if (status === 'rejected') {
          await sendLeaveNotification(
            employee.personalInfo.email,
            'reject',
            {
              leaveType: leave.leaveType,
              startDate: leave.startDate.toLocaleDateString(),
              endDate: leave.endDate.toLocaleDateString(),
              totalDays: leave.totalDays,
              rejectionReason: leave.rejectionReason,
              approverName: user.name || 'Admin',
            }
          );
        }
      }
    } catch (emailError) {
      console.error('Failed to send leave notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Leave request updated successfully',
      leave,
    });

  } catch (error: any) {
    console.error('Update leave error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getLeaves);
export const POST = requireAuth(createLeave);
export const PUT = requireAuth(updateLeave);
