import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';

async function checkIn(req: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const { user } = req;
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    const { employeeId, notes } = await req.json();
    
    // For admin users, allow specifying employeeId, otherwise use their own
    const targetEmployeeId = (user.role === 'admin' && employeeId) ? employeeId : user.employeeId;
    
    if (!targetEmployeeId) {
      return NextResponse.json(
        { error: 'Employee ID not found. Please contact HR to set up your employee profile.' },
        { status: 400 }
      );
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employeeId: targetEmployeeId,
      date: today,
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return NextResponse.json(
        { error: 'Already checked in today' },
        { status: 400 }
      );
    }

    const checkInTime = new Date();
    
    if (existingAttendance) {
      // Update existing record
      existingAttendance.checkIn = checkInTime;
      existingAttendance.status = 'present';
      if (notes) existingAttendance.notes = notes;
      await existingAttendance.save();
    } else {
      // Create new record
      const attendance = new Attendance({
        employeeId: targetEmployeeId,
        date: today,
        checkIn: checkInTime,
        status: 'present',
        notes,
      });
      await attendance.save();
    }

    return NextResponse.json({
      message: 'Checked in successfully',
      checkInTime,
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = requireAuth(checkIn);
