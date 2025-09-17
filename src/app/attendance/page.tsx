'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Clock, CheckCircle, XCircle, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
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
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAttendance(1);
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      limit: '10'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAttendance(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchAttendance(newPage);
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
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">Track your daily attendance and working hours</p>
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
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                {todayAttendance?.checkIn && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      Checked in at {formatDateTime(todayAttendance.checkIn)}
                    </span>
                  </div>
                )}
                {todayAttendance?.checkOut && (
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">
                      Checked out at {formatDateTime(todayAttendance.checkOut)}
                    </span>
                  </div>
                )}
                {todayAttendance?.totalHours && (
                  <div className="text-sm text-gray-600">
                    Total hours: {todayAttendance.totalHours}h
                    {todayAttendance.overtimeHours && todayAttendance.overtimeHours > 0 && (
                      <span className="text-orange-600 ml-2">
                        (Overtime: {todayAttendance.overtimeHours}h)
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Attendance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
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
                </Select>
              </div>

              <div>
                <Label htmlFor="limit">Records per page</Label>
                <Select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', e.target.value)}
                >
                  <option value="5">5 records</option>
                  <option value="10">10 records</option>
                  <option value="20">20 records</option>
                  <option value="50">50 records</option>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <Button onClick={applyFilters} className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Apply Filters</span>
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          </CardContent>
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
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {attendance.map((record) => (
                  <div key={record._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        record.status === 'present' ? 'bg-green-500' :
                        record.status === 'absent' ? 'bg-red-500' :
                        record.status === 'late' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                      <div>
                        <p className="font-medium">{formatDate(record.date)}</p>
                        <p className="text-sm text-gray-600 capitalize">{record.status}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {record.checkIn && (
                        <p className="text-sm">
                          In: {new Date(record.checkIn).toLocaleTimeString()}
                        </p>
                      )}
                      {record.checkOut && (
                        <p className="text-sm">
                          Out: {new Date(record.checkOut).toLocaleTimeString()}
                        </p>
                      )}
                      {record.totalHours && (
                        <p className="text-sm font-medium">
                          {record.totalHours}h
                          {record.overtimeHours && record.overtimeHours > 0 && (
                            <span className="text-orange-600 ml-1">
                              (+{record.overtimeHours}h)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="flex items-center space-x-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
