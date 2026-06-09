import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import { parseLocationPayload } from '@/lib/attendanceValidation';

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
    
    const body = await req.json();
    const { employeeId, notes } = body;

    const locationResult = parseLocationPayload(body);
    if (!locationResult.valid) {
      return NextResponse.json(
        { error: locationResult.error },
        { status: 400 }
      );
    }
    const { location } = locationResult;
    
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
      existingAttendance.checkInLatitude = location.latitude;
      existingAttendance.checkInLongitude = location.longitude;
      existingAttendance.checkInAccuracy = location.accuracy;
      existingAttendance.status = 'present';
      if (notes) existingAttendance.notes = notes;
      await existingAttendance.save();
    } else {
      // Create new record
      const attendance = new Attendance({
        employeeId: targetEmployeeId,
        date: today,
        checkIn: checkInTime,
        checkInLatitude: location.latitude,
        checkInLongitude: location.longitude,
        checkInAccuracy: location.accuracy,
        status: 'present',
        notes,
      });
      await attendance.save();
    }

    return NextResponse.json({
      message: 'Checked in successfully',
      checkInTime,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      },
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
