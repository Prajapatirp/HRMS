import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Leave from '@/models/Leave';
import Employee from '@/models/Employee';
import { requireRole } from '@/middleware/auth';
import { updateLeaveBalance } from '@/lib/leave-calculations';
import { sendLeaveNotification } from '@/lib/email';

async function approveLeave(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    
    const { action, rejectionReason } = await req.json();
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }
    
    const leave = await Leave.findById(params.id);
    
    if (!leave) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    if (leave.status !== 'pending') {
      return NextResponse.json(
        { error: 'Leave request has already been processed' },
        { status: 400 }
      );
    }

    const employee = await Employee.findOne({ employeeId: leave.employeeId });
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      leave.status = 'approved';
      leave.approvedBy = user.employeeId || user.userId;
      leave.approvedAt = new Date();
      leave.rejectionReason = undefined;
      leave.rejectedBy = undefined;
      leave.rejectedAt = undefined;
    } else if (action === 'reject') {
      leave.status = 'rejected';
      leave.rejectedBy = user.employeeId || user.userId;
      leave.rejectedAt = new Date();
      leave.rejectionReason = rejectionReason || 'No reason provided';
      leave.approvedBy = undefined;
      leave.approvedAt = undefined;
    }

    await leave.save();
    
    // Update leave balance
    const year = leave.startDate.getFullYear();
    await updateLeaveBalance(leave.employeeId, leave.leaveType, year);
    
    // Send notification
    try {
      await sendLeaveNotification(
        employee.personalInfo.email,
        action === 'approve' ? 'approve' : 'reject',
        {
          leaveType: leave.leaveType,
          startDate: leave.startDate.toLocaleDateString(),
          endDate: leave.endDate.toLocaleDateString(),
          totalDays: leave.totalDays,
          rejectionReason: leave.rejectionReason,
          approverName: user.name || 'Admin',
        }
      );
    } catch (emailError) {
      console.error('Failed to send leave notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: `Leave request ${action}d successfully`,
      leave,
    });

  } catch (error: any) {
    console.error('Approve leave error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = requireRole(['admin', 'hr', 'manager'])(approveLeave);
