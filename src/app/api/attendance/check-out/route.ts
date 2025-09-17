import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { requireAuth } from '@/middleware/auth';

async function checkOut(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    
    if (!user.employeeId) {
      return NextResponse.json(
        { error: 'Employee ID not found. Please contact HR to set up your employee profile.' },
        { status: 400 }
      );
    }
    
    const { notes } = await req.json();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employeeId: user.employeeId,
      date: today,
    });

    if (!attendance || !attendance.checkIn) {
      return NextResponse.json(
        { error: 'Must check in before checking out' },
        { status: 400 }
      );
    }

    if (attendance.checkOut) {
      return NextResponse.json(
        { error: 'Already checked out today' },
        { status: 400 }
      );
    }

    const checkOutTime = new Date();
    
    // Calculate total hours
    const checkInTime = new Date(attendance.checkIn);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    attendance.checkOut = checkOutTime;
    attendance.totalHours = Math.round(diffHours * 100) / 100;
    
    // Calculate overtime (assuming 8 hours is standard)
    if (diffHours > 8) {
      attendance.overtimeHours = Math.round((diffHours - 8) * 100) / 100;
    }
    
    if (notes) attendance.notes = notes;
    
    await attendance.save();

    return NextResponse.json({
      message: 'Checked out successfully',
      checkOutTime,
      totalHours: attendance.totalHours,
      overtimeHours: attendance.overtimeHours,
    });

  } catch (error) {
    console.error('Check-out error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = requireAuth(checkOut);
