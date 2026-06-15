import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import { requireRole } from '@/middleware/auth';
import { formatAttendanceLocationText } from '@/lib/attendanceLocation';
import {
  AttendanceDetailRow,
  AttendanceSummaryRow,
  buildAttendanceReportWorkbook,
  getReportPeriodDates,
} from '@/lib/attendanceReportExcel';
import { formatDate } from '@/lib/utils';

function formatTimeValue(date: Date | string) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatHoursValue(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return '-';
  return Number(value).toFixed(2);
}

async function exportAttendanceReport(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'current-month';
    const employeeId = searchParams.get('employeeId') || '';

    const { month, year, dateFilter } = getReportPeriodDates(period);

    const employeeNameMap = new Map<string, string>();
    let employeeIds: string[] = [];

    if (employeeId) {
      const employee = await Employee.findOne({ employeeId }).select(
        'employeeId personalInfo.firstName personalInfo.lastName'
      );

      if (employee) {
        const name = `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim();
        employeeNameMap.set(employee.employeeId, name || employee.employeeId);
        employeeIds = [employee.employeeId];
      } else {
        employeeIds = [employeeId];
        employeeNameMap.set(employeeId, employeeId);
      }
    } else {
      const employees = await Employee.find({ status: 'active' })
        .select('employeeId personalInfo.firstName personalInfo.lastName')
        .sort({ 'personalInfo.firstName': 1 });

      if (employees.length === 0) {
        return NextResponse.json({ error: 'No employees found for this report' }, { status: 404 });
      }

      employeeIds = employees.map((employee) => employee.employeeId);
      employees.forEach((employee) => {
        const name = `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim();
        employeeNameMap.set(employee.employeeId, name || employee.employeeId);
      });
    }

    const attendanceRecords = await Attendance.find({
      employeeId: { $in: employeeIds },
      date: dateFilter,
    })
      .sort({ date: -1, employeeId: 1 })
      .lean();

    const employeesForSummary = employeeId
      ? [{ employeeId, name: employeeNameMap.get(employeeId) || employeeId }]
      : Array.from(employeeNameMap.entries()).map(([id, name]) => ({ employeeId: id, name }));

    const summaryRows: AttendanceSummaryRow[] = employeesForSummary.map(({ employeeId: id, name }) => {
      const records = attendanceRecords.filter((record) => record.employeeId === id);
      return {
        'Employee Name': name,
        'Employee ID': id,
        Present: records.filter((record) => record.status === 'present').length,
        Absent: records.filter((record) => record.status === 'absent').length,
        Late: records.filter((record) => record.status === 'late').length,
        'Half Day': records.filter((record) => record.status === 'half-day').length,
        Holiday: records.filter((record) => record.status === 'holiday').length,
        'Total Records': records.length,
      };
    });

    const detailRows: AttendanceDetailRow[] = attendanceRecords.map((record) => ({
      Date: formatDate(record.date),
      'Employee Name': employeeNameMap.get(record.employeeId) || record.employeeId,
      'Employee ID': record.employeeId,
      Status: record.status,
      'Check In': record.checkIn ? formatTimeValue(record.checkIn) : '-',
      'Log In Latitude - Longitude': formatAttendanceLocationText(
        record.checkInLatitude,
        record.checkInLongitude
      ),
      'Check Out': record.checkOut ? formatTimeValue(record.checkOut) : '-',
      'Log Out Latitude - Longitude': formatAttendanceLocationText(
        record.checkOutLatitude,
        record.checkOutLongitude
      ),
      'Total Hours': formatHoursValue(record.totalHours),
      Overtime: formatHoursValue(record.overtimeHours),
      Notes: record.notes?.trim() ? record.notes : '-',
    }));

    const buffer = buildAttendanceReportWorkbook(summaryRows, detailRows);


    const fileSuffix = employeeId ? employeeId : 'all-employees';
    const filename = `attendance-report-${year}-${String(month).padStart(2, '0')}-${fileSuffix}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Attendance report export error:', error);
    return NextResponse.json({ error: 'Failed to generate attendance report' }, { status: 500 });
  }
}

export const GET = requireRole(['admin', 'hr'])(exportAttendanceReport);
