'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Clock, CheckCircle, XCircle, Search, Filter, User, ChevronDown, ChevronUp, Calendar as CalendarIcon } from 'lucide-react';
import DynamicTable, { Column } from '@/components/ui/dynamic-table';
import { formatDate, formatDateTime } from '@/lib/utils';
import AttendanceCalendar from '@/components/attendance/AttendanceCalendar';

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  overtimeHours?: number;
  status: string;
  notes?: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Employee {
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function AdminAttendancePage() {
  const { user, token } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [personalAttendance, setPersonalAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarAttendance, setCalendarAttendance] = useState<AttendanceRecord[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarEmployeeId, setCalendarEmployeeId] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({
    employeeId: '',
    month: '',
    year: new Date().getFullYear().toString(),
    status: '',
    limit: '10'
  });

  const fetchAttendance = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', filters.limit);
      if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
      if (filters.month) queryParams.append('month', filters.month);
      if (filters.year) queryParams.append('year', filters.year);
      if (filters.status) queryParams.append('status', filters.status);

      const response = await fetch(`/api/attendance?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        console.error('Failed to fetch attendance data');
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, [token]);

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update the token in localStorage and refresh the page
        localStorage.setItem('token', data.token);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
  }, [token]);

  const fetchPersonalAttendance = useCallback(async () => {
    try {
      const response = await fetch('/api/attendance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalAttendance(data.attendance);
      } else {
        console.error('Failed to fetch personal attendance data');
      }
    } catch (error) {
      console.error('Failed to fetch personal attendance data:', error);
    }
  }, [token]);

  const fetchCalendarAttendance = useCallback(async (year: number, month: number) => {
    try {
      setCalendarLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('month', month.toString());
      queryParams.append('year', year.toString());
      const selectedEmployeeId = calendarEmployeeId || filters.employeeId;
      if (selectedEmployeeId) {
        queryParams.append('employeeId', selectedEmployeeId);
      }

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
  }, [token, calendarEmployeeId, filters.employeeId]);

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
        await fetchPersonalAttendance(); // Refresh personal data
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
        await fetchPersonalAttendance(); // Refresh personal data
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

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setPagination((prev: any) => ({ ...prev, page: 1 }));
    fetchAttendance(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchAttendance(newPage);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'half-day':
        return 'bg-blue-100 text-blue-800';
      case 'holiday':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    return employee ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}` : employeeId;
  };

  const getTodayPersonalAttendance = () => {
    const today = new Date().toDateString();
    return personalAttendance.find(record => 
      new Date(record.date).toDateString() === today
    );
  };

  const todayPersonalAttendance = getTodayPersonalAttendance();
  const canCheckIn = !todayPersonalAttendance?.checkIn;
  const canCheckOut = todayPersonalAttendance?.checkIn && !todayPersonalAttendance?.checkOut;

  // Define columns for admin attendance table
  const attendanceColumns: Column<AttendanceRecord>[] = [
    {
      key: 'employeeId',
      label: 'Employee Name',
      minWidth: '150px',
      render: (value) => (
        <span className="font-medium">{getEmployeeName(value)}</span>
      ),
      mobileLabel: 'Employee',
      mobileRender: (value) => (
        <span className="font-semibold text-gray-900">{getEmployeeName(value)}</span>
      ),
    },
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
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
      mobileLabel: 'Status',
    },
    {
      key: 'checkIn',
      label: 'Check In',
      minWidth: '140px',
      render: (value) => value ? (
        <div className="flex items-center space-x-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>{formatDateTime(value)}</span>
        </div>
      ) : <span className="text-gray-400">Not checked in</span>,
      mobileLabel: 'Check In',
      mobileRender: (value) => value ? (
        <div className="flex items-center space-x-1">
          <CheckCircle className="h-3 w-3 text-green-600" />
          <span className="text-sm font-medium">{formatDateTime(value)}</span>
        </div>
      ) : <span className="text-sm text-gray-400">Not checked in</span>,
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      minWidth: '140px',
      render: (value) => value ? (
        <div className="flex items-center space-x-1">
          <XCircle className="h-4 w-4 text-red-600" />
          <span>{formatDateTime(value)}</span>
        </div>
      ) : <span className="text-gray-400">Not checked out</span>,
      mobileLabel: 'Check Out',
      mobileRender: (value) => value ? (
        <div className="flex items-center space-x-1">
          <XCircle className="h-3 w-3 text-red-600" />
          <span className="text-sm font-medium">{formatDateTime(value)}</span>
        </div>
      ) : <span className="text-sm text-gray-400">Not checked out</span>,
    },
    {
      key: 'totalHours',
      label: 'Total Hours',
      minWidth: '100px',
      render: (value) => value ? (
        <span className="font-medium">{value.toFixed(2)}h</span>
      ) : <span className="text-gray-400">N/A</span>,
      mobileLabel: 'Total Hours',
      mobileRender: (value) => value ? (
        <span className="text-sm font-medium">{value.toFixed(2)}h</span>
      ) : <span className="text-sm text-gray-400">N/A</span>,
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

  // Custom mobile card render for admin attendance
  const renderAttendanceMobileCard = (record: AttendanceRecord) => {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-gray-900">{getEmployeeName(record.employeeId)}</span>
            </div>
            <span className="text-sm text-gray-600">{formatDate(record.date)}</span>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
            {record.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
          <div>
            <p className="text-xs text-gray-500 mb-1">Check In</p>
            {record.checkIn ? (
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-sm font-medium">{formatDateTime(record.checkIn)}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Not checked in</span>
            )}
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Check Out</p>
            {record.checkOut ? (
              <div className="flex items-center space-x-1">
                <XCircle className="h-3 w-3 text-red-600" />
                <span className="text-sm font-medium">{formatDateTime(record.checkOut)}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Not checked out</span>
            )}
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Hours</p>
            {record.totalHours ? (
              <span className="text-sm font-medium">{record.totalHours.toFixed(2)}h</span>
            ) : (
              <span className="text-sm text-gray-400">N/A</span>
            )}
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Overtime</p>
            {record.overtimeHours && record.overtimeHours > 0 ? (
              <span className="text-sm font-medium text-orange-600">+{record.overtimeHours.toFixed(2)}h</span>
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>
        </div>
        
        {record.notes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{record.notes}</p>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchAttendance(1);
      fetchEmployees();
      if (user.employeeId) {
        fetchPersonalAttendance();
      }
    }
  }, [token, user, fetchEmployees, fetchPersonalAttendance]);

  // Fetch calendar data when employee selection changes or calendar opens
  useEffect(() => {
    if (calendarOpen && token) {
      const currentDate = new Date();
      fetchCalendarAttendance(currentDate.getFullYear(), currentDate.getMonth() + 1);
    }
  }, [calendarEmployeeId, calendarOpen, token, fetchCalendarAttendance]);

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  if (user.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin - Attendance Management</h1>
          <p className="text-gray-600">View and manage all employees&apos; attendance records</p>
        </div>

        {/* Personal Attendance Section */}
        {user.employeeId && user.role !== 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>My Attendance</span>
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  {todayPersonalAttendance?.checkIn && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        Checked in at {formatDateTime(todayPersonalAttendance.checkIn)}
                      </span>
                    </div>
                  )}
                  {todayPersonalAttendance?.checkOut && (
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">
                        Checked out at {formatDateTime(todayPersonalAttendance.checkOut)}
                      </span>
                    </div>
                  )}
                  {todayPersonalAttendance?.totalHours && (
                    <div className="text-sm text-gray-600">
                      Total hours: {todayPersonalAttendance.totalHours}h
                      {todayPersonalAttendance.overtimeHours && todayPersonalAttendance.overtimeHours > 0 && (
                        <span className="text-orange-600 ml-2">
                          (Overtime: {todayPersonalAttendance.overtimeHours}h)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {canCheckIn && (
                    <Button 
                      onClick={handleCheckIn} 
                      disabled={checkingIn}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {checkingIn ? 'Checking In...' : 'Check In'}
                    </Button>
                  )}
                  {canCheckOut && (
                    <Button 
                      onClick={handleCheckOut} 
                      disabled={checkingOut}
                      variant="destructive"
                    >
                      {checkingOut ? 'Checking Out...' : 'Check Out'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employee Profile Setup Notice for Admin without Employee ID */}
        {!user.employeeId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Attendance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="mb-4">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Employee Profile Required
                </h3>
                <p className="text-gray-600 mb-4">
                  To track your personal attendance, you need to set up an employee profile:
                </p>
                <ul className="text-left text-gray-600 space-y-1 mb-6">
                  <li>• Go to Employees page and add yourself as an employee</li>
                  <li>• Assign yourself an employee ID</li>
                  <li>• Link your admin account to the employee profile</li>
                </ul>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Once set up, you&apos;ll be able to check in and out from this page.
                  </p>
                  <Button 
                    onClick={refreshToken}
                    variant="outline"
                    className="mt-4"
                  >
                    Refresh Token (Try if already set up)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center justify-between w-full hover:bg-gray-50 -mx-4 -my-2 px-4 py-2 rounded-md transition-colors"
            >
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
              {filtersOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </CardHeader>
          {filtersOpen && (
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="employee" className="text-sm font-medium text-gray-700">Employee</Label>
                  <Select
                    value={filters.employeeId}
                    onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                    className="w-full"
                  >
                    <option value="">All employees</option>
                    {employees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.personalInfo.firstName} {emp.personalInfo.lastName}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="month" className="text-sm font-medium text-gray-700">Month</Label>
                  <Select
                    value={filters.month}
                    onChange={(e) => handleFilterChange('month', e.target.value)}
                    className="w-full"
                  >
                    <option value="">All months</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      return (
                        <option key={month} value={month.toString()}>
                          {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      );
                    })}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="year" className="text-sm font-medium text-gray-700">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    placeholder="2024"
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full"
                  >
                    <option value="">All statuses</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half-day">Half Day</option>
                    <option value="holiday">Holiday</option>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button onClick={applyFilters} className="flex items-center justify-center space-x-2 w-full sm:w-auto">
                  <Search className="h-4 w-4" />
                  <span>Apply Filters</span>
                </Button>
                <Button 
                  onClick={() => {
                    setFilters({
                      employeeId: '',
                      month: '',
                      year: new Date().getFullYear().toString(),
                      status: '',
                      limit: '10'
                    });
                    setPagination((prev: any) => ({ ...prev, page: 1 }));
                    setTimeout(() => fetchAttendance(1), 100);
                  }} 
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="flex items-center justify-between w-full hover:bg-gray-50 -mx-4 -my-2 px-4 py-2 rounded-md transition-colors"
            >
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Calendar View</span>
              </CardTitle>
              {calendarOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </CardHeader>
          {calendarOpen && (
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="calendarEmployee" className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Employee
                </Label>
                <Select
                  id="calendarEmployee"
                  value={calendarEmployeeId}
                  onChange={(e) => {
                    setCalendarEmployeeId(e.target.value);
                    // Reset calendar attendance when employee changes
                    setCalendarAttendance([]);
                  }}
                  className="w-full max-w-xs"
                >
                  <option value="">All employees</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.personalInfo.firstName} {emp.personalInfo.lastName}
                    </option>
                  ))}
                </Select>
              </div>
              <AttendanceCalendar
                attendance={calendarAttendance.map(record => ({
                  date: record.date,
                  status: record.status as 'present' | 'absent' | 'late' | 'half-day' | 'holiday'
                }))}
                loading={calendarLoading}
                employeeId={calendarEmployeeId || filters.employeeId || undefined}
                token={token}
                onMonthChange={fetchCalendarAttendance}
              />
            </CardContent>
          )}
        </Card>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>
              Showing {attendance.length} of {pagination.total} records
              {pagination.total > 0 && (
                <span> (Page {pagination.page} of {pagination.pages})</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicTable
              data={attendance}
              columns={attendanceColumns}
              loading={loading}
              emptyMessage="No attendance records found for the selected filters."
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
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
