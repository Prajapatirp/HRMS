import * as XLSX from 'xlsx';

export interface AttendanceSummaryRow {
  'Employee Name': string;
  'Employee ID': string;
  Present: number;
  Absent: number;
  Late: number;
  'Half Day': number;
  Holiday: number;
  'Total Records': number;
}

export interface AttendanceDetailRow {
  Date: string;
  'Employee Name': string;
  'Employee ID': string;
  Status: string;
  'Check In': string;
  'Log In Latitude - Longitude': string;
  'Check Out': string;
  'Log Out Latitude - Longitude': string;
  'Total Hours': string;
  Overtime: string;
  Notes: string;
}

export function buildAttendanceReportWorkbook(
  summaryRows: AttendanceSummaryRow[],
  detailRows: AttendanceDetailRow[]
) {
  const workbook = XLSX.utils.book_new();
  const reportSheet = XLSX.utils.json_to_sheet(detailRows);
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

  reportSheet['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 38 },
    { wch: 12 },
    { wch: 38 },
    { wch: 12 },
    { wch: 10 },
    { wch: 24 },
  ];

  summarySheet['!cols'] = [
    { wch: 22 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(workbook, reportSheet, 'Attendance Report');
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Monthly Summary');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export interface ReportPeriodRange {
  month: number;
  year: number;
  dateFilter: { $gte: Date; $lt: Date };
}

/** Uses the same month/range boundaries as /api/attendance */
export function getReportPeriodDates(period: string): ReportPeriodRange {
  const currentDate = new Date();
  let month = currentDate.getMonth() + 1;
  let year = currentDate.getFullYear();

  if (period === 'last-month') {
    if (month === 1) {
      month = 12;
      year -= 1;
    } else {
      month -= 1;
    }
  }

  let dateFilter: { $gte: Date; $lt: Date };

  if (period === 'current-quarter') {
    const quarterStartMonth = Math.floor(currentDate.getMonth() / 3) * 3 + 1;
    dateFilter = {
      $gte: new Date(year, quarterStartMonth - 1, 1),
      $lt: new Date(year, quarterStartMonth + 2, 1),
    };
    month = quarterStartMonth;
  } else if (period === 'current-year') {
    dateFilter = {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1),
    };
    month = 1;
  } else {
    dateFilter = {
      $gte: new Date(year, month - 1, 1),
      $lt: new Date(year, month, 1),
    };
  }

  return { month, year, dateFilter };
}
