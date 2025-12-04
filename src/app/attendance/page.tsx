'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Clock, CheckCircle, XCircle, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import DynamicTable, { Column } from '@/components/ui/dynamic-table';
import { formatDateTime, formatDate } from '@/lib/utils';

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    limit: '10'
  });

  useEffect(() => {
    if (token) {
      fetchAttendance();
    }
  }, [token]);

  const fetchAttendance = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', filters.limit);
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
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
  };

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
  const canCheckOut = todayAttendance?.checkIn && !todayAttendance?.checkOut;

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

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      limit: '10'
    });
    setPagination((prev: any) => ({ ...prev, page: 1 }));
    fetchAttendance(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchAttendance(newPage);
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
          <p className="text-sm sm:text-base text-gray-600">Track your daily attendance and working hours</p>
        </div>

        {/* Check In/Out Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Today's Attendance</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2 flex-1">
                {todayAttendance?.checkIn && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      Checked in at {formatDateTime(todayAttendance.checkIn)}
                    </span>
                  </div>
                )}
                {todayAttendance?.checkOut && (
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      Checked out at {formatDateTime(todayAttendance.checkOut)}
                    </span>
                  </div>
                )}
                {todayAttendance?.totalHours && (
                  <div className="text-xs sm:text-sm text-gray-600">
                    Total hours: {todayAttendance.totalHours}h
                    {todayAttendance.overtimeHours && todayAttendance.overtimeHours > 0 && (
                      <span className="text-orange-600 ml-2">
                        (Overtime: {todayAttendance.overtimeHours}h)
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-y-0">
                {canCheckIn && (
                  <Button 
                    onClick={handleCheckIn} 
                    disabled={checkingIn}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  >
                    {checkingIn ? 'Checking In...' : 'Check In'}
                  </Button>
                )}
                {canCheckOut && (
                  <Button 
                    onClick={handleCheckOut} 
                    disabled={checkingOut}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    {checkingOut ? 'Checking Out...' : 'Check Out'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center justify-between w-full hover:bg-gray-50 -mx-4 -my-2 px-4 py-2 rounded-md transition-colors"
            >
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filter Attendance</span>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
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
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-y-0">
                <Button onClick={applyFilters} className="flex items-center justify-center space-x-2 w-full sm:w-auto">
                  <Search className="h-4 w-4" />
                  <span>Apply Filters</span>
                </Button>
                <Button onClick={clearFilters} variant="outline" className="w-full sm:w-auto">
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Attendance History */}
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
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
