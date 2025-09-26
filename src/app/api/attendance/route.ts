/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { requireAuth } from '@/middleware/auth';

async function getAttendance(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || user.employeeId;
    
    // For admin users, if no specific employeeId is requested, get all attendance
    if (!employeeId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Employee ID not found. Please contact HR to set up your employee profile.' },
        { status: 400 }
      );
    }

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filter parameters
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    const query: any = {};
    // if (employeeId) {
    //   query.employeeId = employeeId;
    // }

    // Date filtering
    if (date) {
      // Single date filter
      const targetDate = new Date(date);
      query.date = {
        $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
        $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1),
      };
    } else if (startDate && endDate) {
      // Date range filter
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      query.date = {
        $gte: start,
        $lte: end,
      };
    } else if (month && year) {
      // Month/Year filter
      query.date = {
        $gte: new Date(parseInt(year), parseInt(month) - 1, 1),
        $lt: new Date(parseInt(year), parseInt(month), 1),
      };
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    if (employeeId && user.role !== 'admin') {
      query.employeeId = employeeId;
    }

    // Get attendance records with pagination
    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Attendance.countDocuments(query);

    return NextResponse.json({
      attendance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createAttendance(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const { employeeId, date, checkIn, checkOut, status, notes } = await req.json();
    
    const targetEmployeeId = employeeId || user.employeeId;
    
    if (!targetEmployeeId) {
      return NextResponse.json(
        { error: 'Employee ID not found. Please contact HR to set up your employee profile.' },
        { status: 400 }
      );
    }

    // Check if attendance record already exists for this date
    const existingAttendance = await Attendance.findOne({
      employeeId: targetEmployeeId,
      date: new Date(date),
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance record already exists for this date' },
        { status: 400 }
      );
    }

    const attendance = new Attendance({
      employeeId: targetEmployeeId,
      date: new Date(date),
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: checkOut ? new Date(checkOut) : undefined,
      status: status || 'present',
      notes,
    });

    // Calculate total hours if both check-in and check-out are provided
    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      attendance.totalHours = Math.round(diffHours * 100) / 100;
      
      // Calculate overtime (assuming 8 hours is standard)
      if (diffHours > 8) {
        attendance.overtimeHours = Math.round((diffHours - 8) * 100) / 100;
      }
    }

    await attendance.save();

    return NextResponse.json({
      message: 'Attendance recorded successfully',
      attendance,
    }, { status: 201 });

  } catch (error) {
    console.error('Create attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getAttendance);
export const POST = requireAuth(createAttendance);
