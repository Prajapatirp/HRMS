'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Clock, CheckCircle, XCircle, Filter, Calendar as CalendarIcon } from 'lucide-react';
import DynamicTable, { Column } from '@/components/ui/dynamic-table';
import { formatDate } from '@/lib/utils';
import AttendanceCalendar from '@/components/attendance/AttendanceCalendar';
import FilterDrawer from '@/components/ui/filter-drawer';
import CheckInOutModal from '@/components/attendance/CheckInOutModal';
import DynamicModal from '@/components/ui/dynamic-modal';

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  overtimeHours?: number;
  status: string;
  notes?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AttendancePage() {
  const { user, token } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [checkInOutModalOpen, setCheckInOutModalOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarAttendance, setCalendarAttendance] = useState<AttendanceRecord[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    'half-day': 0,
    absent: 0,
    late: 0,
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    limit: '10'
  });

  const fetchAttendanceStats = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      // Fetch all records for statistics (no pagination)
      queryParams.append('limit', '1000'); // Large limit to get all records
      
      // If no date filters, default to current month
      if (!filters.startDate && !filters.endDate) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        queryParams.append('month', currentMonth.toString());
        queryParams.append('year', currentYear.toString());
      } else {
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
      }
      
      // Don't filter by status for statistics - we want all statuses
      // if (filters.status) queryParams.append('status', filters.status);

      const response = await fetch(`/api/attendance?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allRecords = data.attendance || [];
        setAttendanceStats({
          present: allRecords.filter((r: AttendanceRecord) => r.status === 'present').length,
          'half-day': allRecords.filter((r: AttendanceRecord) => r.status === 'half-day').length,
          absent: allRecords.filter((r: AttendanceRecord) => r.status === 'absent').length,
          late: allRecords.filter((r: AttendanceRecord) => r.status === 'late').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch attendance statistics:', error);
    }
  }, [filters.startDate, filters.endDate, token]);

  const fetchAttendance = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', filters.limit);
      
      // If no date filters, default to current month
      if (!filters.startDate && !filters.endDate) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        queryParams.append('month', currentMonth.toString());
        queryParams.append('year', currentYear.toString());
      } else {
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
      }
      
      if (filters.status) queryParams.append('status', filters.status);

      const response = await fetch(`/api/attendance?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch attendance:', errorData.error);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    if (token) {
      fetchAttendance();
      fetchAttendanceStats();
    }
  }, [token, fetchAttendance, fetchAttendanceStats]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        await fetchAttendance(); // Refresh data
      } else {
        const errorData = await response.json();
        console.error('Check-in failed:', errorData.error);
        alert(`Check-in failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      alert('Check-in failed. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        await fetchAttendance(); // Refresh data
      } else {
        const errorData = await response.json();
        console.error('Check-out failed:', errorData.error);
        alert(`Check-out failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Check-out failed:', error);
      alert('Check-out failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const getTodayAttendance = () => {
    const today = new Date().toDateString();
    return attendance.find(record => 
      new Date(record.date).toDateString() === today
    );
  };

  const todayAttendance = getTodayAttendance();
  const canCheckIn = !todayAttendance?.checkIn;
  const canCheckOut = !!(todayAttendance?.checkIn && !todayAttendance?.checkOut);


  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setPagination((prev: any) => ({ ...prev, page: 1 }));
    fetchAttendance(1);
    fetchAttendanceStats();
    setFilterDrawerOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      limit: '10'
    });
    setPagination((prev: any) => ({ ...prev, page: 1 }));
    setTimeout(() => fetchAttendance(1), 100);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.status) count++;
    return count;
  };

  const handlePageChange = (newPage: number) => {
    fetchAttendance(newPage);
  };

  const fetchCalendarAttendance = async (year: number, month: number) => {
    try {
      setCalendarLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('month', month.toString());
      queryParams.append('year', year.toString());

      const response = await fetch(`/api/attendance?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCalendarAttendance(data.attendance || []);
      } else {
        console.error('Failed to fetch calendar attendance data');
      }
    } catch (error) {
      console.error('Failed to fetch calendar attendance data:', error);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Define columns for attendance table
  const attendanceColumns: Column<AttendanceRecord>[] = [
    {
      key: 'date',
      label: 'Date',
      minWidth: '120px',
      render: (value) => <span className="font-medium">{formatDate(value)}</span>,
      mobileLabel: 'Date',
    },
    {
      key: 'status',
      label: 'Status',
      minWidth: '100px',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'present' ? 'bg-green-100 text-green-800' :
          value === 'absent' ? 'bg-red-100 text-red-800' :
          value === 'late' ? 'bg-yellow-100 text-yellow-800' :
          value === 'half-day' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ),
      mobileLabel: 'Status',
    },
    {
      key: 'checkIn',
      label: 'Check In',
      minWidth: '120px',
      render: (value) => value ? (
        <div className="flex items-center space-x-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>{new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ) : <span className="text-gray-400">-</span>,
      mobileLabel: 'Check In',
      mobileRender: (value) => value ? (
        <div className="flex items-center space-x-1">
          <CheckCircle className="h-3 w-3 text-green-600" />
          <span className="text-sm font-medium">
            {new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ) : <span className="text-sm text-gray-400">-</span>,
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      minWidth: '120px',
      render: (value) => value ? (
        <div className="flex items-center space-x-1">
          <XCircle className="h-4 w-4 text-red-600" />
          <span>{new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ) : <span className="text-gray-400">-</span>,
      mobileLabel: 'Check Out',
      mobileRender: (value) => value ? (
        <div className="flex items-center space-x-1">
          <XCircle className="h-3 w-3 text-red-600" />
          <span className="text-sm font-medium">
            {new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ) : <span className="text-sm text-gray-400">-</span>,
    },
    {
      key: 'totalHours',
      label: 'Total Hours',
      minWidth: '100px',
      render: (value) => value ? (
        <span className="font-medium">{value.toFixed(2)}h</span>
      ) : <span className="text-gray-400">-</span>,
      mobileLabel: 'Total Hours',
      mobileRender: (value) => value ? (
        <span className="text-sm font-medium">{value.toFixed(2)}h</span>
      ) : <span className="text-sm text-gray-400">-</span>,
    },
    {
      key: 'overtimeHours',
      label: 'Overtime',
      minWidth: '100px',
      render: (value) => value && value > 0 ? (
        <span className="text-orange-600 font-medium">+{value.toFixed(2)}h</span>
      ) : <span className="text-gray-400">-</span>,
      mobileLabel: 'Overtime',
      mobileRender: (value) => value && value > 0 ? (
        <span className="text-sm font-medium text-orange-600">+{value.toFixed(2)}h</span>
      ) : <span className="text-sm text-gray-400">-</span>,
    },
    {
      key: 'notes',
      label: 'Notes',
      minWidth: '200px',
      render: (value) => value ? (
        <span className="text-sm text-gray-600 truncate max-w-[200px] block" title={value}>
          {value}
        </span>
      ) : <span className="text-gray-400">-</span>,
      mobileLabel: 'Notes',
      hideOnMobile: false,
    },
  ];

  // Custom mobile card render for attendance
  const renderAttendanceMobileCard = (record: AttendanceRecord) => {
    return (
      <div className="border rounded-lg p-3 sm:p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-3 pb-3 border-b">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                record.status === 'present' ? 'bg-green-500' :
                record.status === 'absent' ? 'bg-red-500' :
                record.status === 'late' ? 'bg-yellow-500' :
                record.status === 'half-day' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}></div>
              <span className="font-semibold text-sm sm:text-base text-gray-900 truncate">{formatDate(record.date)}</span>
            </div>
            <span className={`inline-flex px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${
              record.status === 'present' ? 'bg-green-100 text-green-800' :
              record.status === 'absent' ? 'bg-red-100 text-red-800' :
              record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
              record.status === 'half-day' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {record.status}
            </span>
          </div>
        </div>
        
        {/* Check In/Out Section */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 pb-3 border-b">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-1.5">Check In</p>
            {record.checkIn ? (
              <div className="flex items-center space-x-1.5 min-w-0">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">
                  {new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ) : (
              <span className="text-xs sm:text-sm text-gray-400">-</span>
            )}
          </div>
          
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-1.5">Check Out</p>
            {record.checkOut ? (
              <div className="flex items-center space-x-1.5 min-w-0">
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">
                  {new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ) : (
              <span className="text-xs sm:text-sm text-gray-400">-</span>
            )}
          </div>
        </div>
        
        {/* Hours Section */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-1.5">Total Hours</p>
            {record.totalHours ? (
              <span className="text-xs sm:text-sm font-medium">{record.totalHours.toFixed(2)}h</span>
            ) : (
              <span className="text-xs sm:text-sm text-gray-400">-</span>
            )}
          </div>
          
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-1.5">Overtime</p>
            {record.overtimeHours && record.overtimeHours > 0 ? (
              <span className="text-xs sm:text-sm font-medium text-orange-600">+{record.overtimeHours.toFixed(2)}h</span>
            ) : (
              <span className="text-xs sm:text-sm text-gray-400">-</span>
            )}
          </div>
        </div>
        
        {/* Notes Section */}
        {record.notes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500 mb-1.5">Notes</p>
            <p className="text-xs sm:text-sm text-gray-700 break-words">{record.notes}</p>
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  if (!user.employeeId) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
            <p className="text-gray-600">Track your daily attendance and working hours</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Employee Profile Required</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="mb-4">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Employee Profile Not Found
                </h3>
                <p className="text-gray-600 mb-4">
                  Your account doesn't have an employee profile set up. Please contact HR to:
                </p>
                <ul className="text-left text-gray-600 space-y-1 mb-6">
                  <li>• Set up your employee profile</li>
                  <li>• Assign you an employee ID</li>
                  <li>• Enable attendance tracking</li>
                </ul>
                <p className="text-sm text-gray-500">
                  Once your employee profile is set up, you'll be able to check in and out.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance</h1>
          {/* <p className="text-sm sm:text-base text-gray-600">Track your daily attendance and working hours</p> */}
        </div>

        {/* Attendance Statistics */}
        <Card>
          <CardHeader>
            {/* <CardTitle>Attendance Statistics</CardTitle> */}
            <CardDescription>
              {filters.startDate || filters.endDate 
                ? `Statistics for ${filters.startDate ? formatDate(filters.startDate) : 'start'} - ${filters.endDate ? formatDate(filters.endDate) : 'end'}`
                : `Statistics for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{attendanceStats.present}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="text-sm font-medium text-gray-600">Half Day</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{attendanceStats['half-day']}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{attendanceStats.absent}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="text-sm font-medium text-gray-600">Late</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{attendanceStats.late}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => {
              setCheckInOutModalOpen(true);
              // Refresh attendance data when modal opens
              if (token) {
                fetchAttendance(pagination.page);
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Clock className="h-4 w-4" />
            <span>Check In/Out</span>
          </button>
          <button
            onClick={() => {
              setCalendarOpen(true);
              if (token) {
                const currentDate = new Date();
                fetchCalendarAttendance(currentDate.getFullYear(), currentDate.getMonth() + 1);
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="relative flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs font-medium rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>

        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          title="Filters"
          activeFilterCount={getActiveFilterCount()}
          onApply={applyFilters}
          onReset={clearFilters}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="startDate" className="text-gray-700 mb-1">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="endDate" className="text-gray-700 mb-1">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-gray-700 mb-1">Status</Label>
              <Select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full"
              >
                <option value="">All statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
              </Select>
            </div>
          </div>
        </FilterDrawer>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicTable
              data={attendance}
              columns={attendanceColumns}
              loading={loading}
              emptyMessage="No attendance records found."
              pagination={pagination}
              onPageChange={handlePageChange}
              recordsPerPage={filters.limit}
              onRecordsPerPageChange={(limit) => {
                setFilters((prev) => ({ ...prev, limit }));
                setPagination((prev) => ({ ...prev, page: 1 }));
                setTimeout(() => fetchAttendance(1), 100);
              }}
              keyExtractor={(record) => record._id}
              mobileCardRender={renderAttendanceMobileCard}
              stickyHeader={true}
              maxHeight="calc(100vh - 400px)"
            />
          </CardContent>
        </Card>

        {/* Check In/Out Modal */}
        <CheckInOutModal
          isOpen={checkInOutModalOpen}
          onClose={() => setCheckInOutModalOpen(false)}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          canCheckIn={canCheckIn}
          canCheckOut={canCheckOut}
          checkingIn={checkingIn}
          checkingOut={checkingOut}
          todayAttendance={todayAttendance}
        />

        {/* Calendar View Modal */}
        <DynamicModal
          isOpen={calendarOpen}
          onClose={() => setCalendarOpen(false)}
          title="Calendar View"
          maxWidth="max-w-4xl"
        >
          <AttendanceCalendar
            attendance={calendarAttendance.map(record => ({
              date: record.date,
              status: record.status as 'present' | 'absent' | 'late' | 'half-day' | 'holiday'
            }))}
            loading={calendarLoading}
            token={token}
            onMonthChange={fetchCalendarAttendance}
          />
        </DynamicModal>
      </div>
    </Layout>
  );
}
