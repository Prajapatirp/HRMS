import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { requireAuth } from '@/middleware/auth';

async function checkIn(req: NextRequest) {
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
    
    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employeeId: user.employeeId,
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
        employeeId: user.employeeId,
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
