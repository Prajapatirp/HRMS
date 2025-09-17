import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Leave from '@/models/Leave';
import { requireRole } from '@/middleware/auth';

async function approveLeave(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    console.log('Approve leave request - User:', user);
    console.log('Leave ID:', params.id);
    
    // For admin users, we don't need employeeId for approval
    if (!user.employeeId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Employee ID not found. Please contact HR to set up your employee profile.' },
        { status: 400 }
      );
    }
    
    const { action, rejectionReason } = await req.json();
    console.log('Action:', action, 'Rejection reason:', rejectionReason);
    
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

    if (action === 'approve') {
      leave.status = 'approved';
      leave.approvedBy = user.employeeId || user.email || user.userId;
      leave.approvedAt = new Date();
    } else if (action === 'reject') {
      leave.status = 'rejected';
      leave.approvedBy = user.employeeId || user.email || user.userId;
      leave.approvedAt = new Date();
      leave.rejectionReason = rejectionReason;
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }

    await leave.save();

    return NextResponse.json({
      message: `Leave request ${action}d successfully`,
      leave,
    });

  } catch (error) {
    console.error('Approve leave error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = requireRole(['admin', 'hr', 'manager'])(approveLeave);
