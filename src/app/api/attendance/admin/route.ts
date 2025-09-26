import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { requireRole } from '@/middleware/auth';

async function getAdminAttendance(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filter parameters
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    const query: any = {};

    // Employee filter
    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Date filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = {
        $gte: start,
        $lte: end,
      };
    } else if (month && year) {
      query.date = {
        $gte: new Date(parseInt(year), parseInt(month) - 1, 1),
        $lt: new Date(parseInt(year), parseInt(month), 1),
      };
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Get attendance records with pagination
    const attendance = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName email')
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
    console.error('Get admin attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createAdminAttendance(req: NextRequest) {
  try {
    await connectDB();
    
    const { employeeId, date, checkIn, checkOut, status, notes } = await req.json();
    
    if (!employeeId || !date) {
      return NextResponse.json(
        { error: 'Employee ID and date are required' },
        { status: 400 }
      );
    }

    // Check if attendance record already exists for this date
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: new Date(date),
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance record already exists for this date' },
        { status: 400 }
      );
    }

    const attendance = new Attendance({
      employeeId,
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
    console.error('Create admin attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateAdminAttendance(req: NextRequest) {
  try {
    await connectDB();
    
    const { attendanceId, checkIn, checkOut, status, notes } = await req.json();
    
    if (!attendanceId) {
      return NextResponse.json(
        { error: 'Attendance ID is required' },
        { status: 400 }
      );
    }

    const attendance = await Attendance.findById(attendanceId);
    
    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (checkIn !== undefined) {
      attendance.checkIn = checkIn ? new Date(checkIn) : undefined;
    }
    if (checkOut !== undefined) {
      attendance.checkOut = checkOut ? new Date(checkOut) : undefined;
    }
    if (status !== undefined) {
      attendance.status = status;
    }
    if (notes !== undefined) {
      attendance.notes = notes;
    }

    // Recalculate total hours if both check-in and check-out are present
    if (attendance.checkIn && attendance.checkOut) {
      const checkInTime = new Date(attendance.checkIn);
      const checkOutTime = new Date(attendance.checkOut);
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      attendance.totalHours = Math.round(diffHours * 100) / 100;
      
      // Calculate overtime (assuming 8 hours is standard)
      if (diffHours > 8) {
        attendance.overtimeHours = Math.round((diffHours - 8) * 100) / 100;
      } else {
        attendance.overtimeHours = 0;
      }
    }

    await attendance.save();

    return NextResponse.json({
      message: 'Attendance updated successfully',
      attendance,
    });

  } catch (error) {
    console.error('Update admin attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deleteAdminAttendance(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const attendanceId = searchParams.get('id');
    
    if (!attendanceId) {
      return NextResponse.json(
        { error: 'Attendance ID is required' },
        { status: 400 }
      );
    }

    const attendance = await Attendance.findByIdAndDelete(attendanceId);
    
    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Attendance record deleted successfully',
    });

  } catch (error) {
    console.error('Delete admin attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireRole(['admin', 'hr'])(getAdminAttendance);
export const POST = requireRole(['admin', 'hr'])(createAdminAttendance);
export const PUT = requireRole(['admin', 'hr'])(updateAdminAttendance);
export const DELETE = requireRole(['admin', 'hr'])(deleteAdminAttendance);
