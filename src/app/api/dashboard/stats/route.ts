import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import Payroll from '@/models/Payroll';
import { requireAuth } from '@/middleware/auth';

async function getDashboardStats(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear());

    // Get current month date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Employee statistics
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    const newEmployees = await Employee.countDocuments({
      'jobInfo.joiningDate': { $gte: startDate, $lte: endDate },
    });

    // Department distribution
    const departmentStats = await Employee.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$jobInfo.department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Attendance statistics
    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Leave statistics
    const leaveStats = await Leave.aggregate([
      {
        $match: {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Payroll statistics
    const payrollStats = await Payroll.aggregate([
      {
        $match: {
          month,
          year,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$netSalary' },
        },
      },
    ]);

    // Recent activities
    const recentLeaves = await Leave.find({
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentAttendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({
      stats: {
        totalEmployees,
        newEmployees,
        departmentStats,
        attendanceStats,
        leaveStats,
        payrollStats,
      },
      recentActivities: {
        leaves: recentLeaves,
        attendance: recentAttendance,
      },
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getDashboardStats);
