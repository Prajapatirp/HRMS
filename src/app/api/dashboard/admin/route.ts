import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import Ticket from '@/models/Ticket';
import Timesheet from '@/models/Timesheet';
import User from '@/models/User';
import { requireRole } from '@/middleware/auth';

async function getAdminDashboard(req: NextRequest) {
  try {
    await connectDB();

    const { user } = req as any;

    const [
      totalEmployees,
      openTickets,
      inProgressTickets,
      closedTickets,
      pendingTimesheets,
      approvedTimesheets,
      rejectedTimesheets,
    ] = await Promise.all([
      Employee.countDocuments({ status: 'active' }),
      Ticket.countDocuments({ status: 'Open' }),
      Ticket.countDocuments({ status: 'InProgress' }),
      Ticket.countDocuments({ status: 'Closed' }),
      Timesheet.countDocuments({ status: 'submitted' }),
      Timesheet.countDocuments({ status: 'approved' }),
      Timesheet.countDocuments({ status: 'rejected' }),
    ]);

    const adminUser = await User.findById(user.userId);
    const attendanceQuery: Record<string, unknown> = {};
    if (adminUser?.employeeId) {
      attendanceQuery.employeeId = { $ne: adminUser.employeeId };
    }

    const [recentAttendance, pendingTimesheetList] = await Promise.all([
      Attendance.find(attendanceQuery)
        .sort({ date: -1, createdAt: -1 })
        .limit(10)
        .lean(),
      Timesheet.find({ status: 'submitted' })
        .sort({ submittedAt: -1, createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const employeeIds = [
      ...new Set(recentAttendance.map((record) => record.employeeId)),
    ];
    const employees = employeeIds.length
      ? await Employee.find({ employeeId: { $in: employeeIds } })
          .select('employeeId personalInfo.firstName personalInfo.lastName')
          .lean()
      : [];

    const employeeNameMap = new Map<string, string>();
    employees.forEach((employee) => {
      const name = `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim();
      employeeNameMap.set(employee.employeeId, name || employee.employeeId);
    });

    const attendanceWithNames = recentAttendance.map((record) => ({
      ...record,
      employeeName: employeeNameMap.get(record.employeeId) || record.employeeId,
    }));

    return NextResponse.json({
      stats: {
        totalEmployees,
        tickets: {
          pending: openTickets,
          inProgress: inProgressTickets,
          closed: closedTickets,
          total: openTickets + inProgressTickets + closedTickets,
        },
        timesheets: {
          pending: pendingTimesheets,
          approved: approvedTimesheets,
          rejected: rejectedTimesheets,
        },
      },
      recentAttendance: attendanceWithNames,
      pendingTimesheets: pendingTimesheetList,
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireRole(['admin', 'hr'])(getAdminDashboard);
