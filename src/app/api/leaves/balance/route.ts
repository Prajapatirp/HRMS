import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LeaveEntitlement from '@/models/LeaveEntitlement';
import { requireAuth } from '@/middleware/auth';
import { getOrCreateLeaveEntitlement, updateLeaveBalance } from '@/lib/leave-calculations';

async function getLeaveBalance(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || user.employeeId;
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    
    if (!employeeId && user.role !== 'admin' && user.role !== 'hr') {
      return NextResponse.json(
        { error: 'Employee ID not found' },
        { status: 400 }
      );
    }
    
    // For non-admin users, only allow viewing their own balance
    if (employeeId !== user.employeeId && user.role !== 'admin' && user.role !== 'hr') {
      return NextResponse.json(
        { error: 'You are not authorized to view this balance' },
        { status: 403 }
      );
    }
    
    // Get all leave types
    const leaveTypes = ['pto', 'lop', 'comp-off', 'sick', 'vacation', 'personal', 'maternity', 'paternity', 'bereavement', 'other'];
    
    const balances = [];
    
    for (const leaveType of leaveTypes) {
      // Update balance to ensure it's current
      await updateLeaveBalance(employeeId, leaveType, year);
      
      const entitlement = await getOrCreateLeaveEntitlement(employeeId, leaveType, year);
      
      balances.push({
        leaveType,
        entitlement: entitlement.entitlement,
        accrued: entitlement.accrued,
        used: entitlement.used,
        pending: entitlement.pending,
        available: entitlement.available,
        accrualRate: entitlement.accrualRate,
      });
    }
    
    return NextResponse.json({
      employeeId,
      year,
      balances,
    });
    
  } catch (error: any) {
    console.error('Get leave balance error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getLeaveBalance);


