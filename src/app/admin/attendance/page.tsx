'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Clock, CheckCircle, XCircle, Search, Filter, User } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

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
  const [filters, setFilters] = useState({
    employeeId: '',
    month: '',
    year: new Date().getFullYear().toString(),
    status: ''
  });

  const fetchAttendance = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
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
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setLoading(true);
    fetchAttendance();
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

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchAttendance();
      fetchEmployees();
      if (user.employeeId) {
        fetchPersonalAttendance();
      }
    }
  }, [token, user, fetchAttendance, fetchEmployees, fetchPersonalAttendance]);

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
        {user.employeeId && (
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
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="employee">Employee</Label>
                <Select
                  value={filters.employeeId}
                  onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                >
                  <option value="">All employees</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.personalInfo.firstName} {emp.personalInfo.lastName}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="month">Month</Label>
                <Select
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
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

              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  placeholder="2024"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
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

            <div className="mt-4">
              <Button onClick={applyFilters} className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Apply Filters</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              Showing {attendance.length} attendance records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {attendance.map((record) => (
                  <div key={record._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-lg">
                            {getEmployeeName(record.employeeId)}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Date:</span>
                            <p>{formatDate(record.date)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Check In:</span>
                            <p>{record.checkIn ? formatDateTime(record.checkIn) : 'Not checked in'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Check Out:</span>
                            <p>{record.checkOut ? formatDateTime(record.checkOut) : 'Not checked out'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Total Hours:</span>
                            <p>{record.totalHours ? `${record.totalHours}h` : 'N/A'}</p>
                          </div>
                        </div>
                        
                        {record.overtimeHours && record.overtimeHours > 0 && (
                          <div className="mt-2 text-sm text-orange-600">
                            <span className="font-medium">Overtime:</span> {record.overtimeHours}h
                          </div>
                        )}
                        
                        {record.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {record.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {attendance.length === 0 && !loading && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
                <p className="text-gray-600">No attendance records found for the selected filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
