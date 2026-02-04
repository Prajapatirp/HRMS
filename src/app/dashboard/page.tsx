'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, TrendingUp, Clock, Construction } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import AddEmployeeModal from '@/components/employees/AddEmployeeModal';

interface DashboardStats {
  totalEmployees: number;
  newEmployees: number;
  departmentStats: Array<{ _id: string; count: number }>;
  attendanceStats: Array<{ _id: string; count: number }>;
  payrollStats: Array<{ _id: string; count: number; totalAmount: number }>;
}

interface RecentActivity {
  attendance: Array<{
    _id: string;
    employeeId: string;
    date: string;
    status: string;
    createdAt: string;
  }>;
}

export function DashboardContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [employeeName, setEmployeeName] = useState<string>('');

  const fetchDashboardStats = useCallback(async () => {
    try {
      setError('');
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivities(data.recentActivities);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch employee name for employees
  const fetchEmployeeName = useCallback(async () => {
    if (!token || !user?.employeeId || user?.role === 'admin') return;
    
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.employee?.personalInfo) {
          const name = `${data.employee.personalInfo.firstName} ${data.employee.personalInfo.lastName}`;
          setEmployeeName(name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch employee name:', error);
    }
  }, [token, user?.employeeId, user?.role]);

  useEffect(() => {
    if (token) {
      if (user?.role === 'admin') {
        fetchDashboardStats();
      } else {
        setLoading(false);
        fetchEmployeeName();
      }
    }
  }, [token, fetchDashboardStats, fetchEmployeeName, user?.role]);

  // For employees, show attractive "Under Process" message
  if (user?.role !== 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {employeeName || user?.email || 'Employee'}
          </p>
        </div>
        
        {/* Attractive Under Process Card */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-lg">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Icon with animated background */}
              <div className="relative">
                <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-6 shadow-xl">
                  <Construction className="h-16 w-16 text-white" />
                </div>
              </div>
              
              {/* Main Text */}
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-gray-800">Under Process</h2>
                <p className="text-lg text-gray-600 max-w-md">
                  We're working hard to bring you an amazing dashboard experience. 
                  Stay tuned for exciting updates!
                </p>
              </div>
              
              {/* Decorative Elements */}
              <div className="flex items-center space-x-2 mt-4">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.email}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchDashboardStats}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getAttendancePercentage = () => {
    if (!stats?.attendanceStats) return 0;
    const present = stats.attendanceStats.find(s => s._id === 'present')?.count || 0;
    const total = stats.attendanceStats.reduce((sum, s) => sum + s.count, 0);
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  const getTotalPayroll = () => {
    if (!stats?.payrollStats) return 0;
    return stats.payrollStats.reduce((sum, s) => sum + s.totalAmount, 0);
  };

  // Quick action handlers
  const handleAddEmployee = () => {
    if (user?.role === 'admin') {
      setShowAddEmployeeModal(true);
    } else {
      alert('Only administrators can add employees.');
    }
  };

  const handleCheckInOut = () => {
    router.push('/attendance');
  };


  const handleViewReports = () => {
    router.push('/reports');
  };

  const handleAddEmployeeSuccess = () => {
    setShowAddEmployeeModal(false);
    fetchDashboardStats(); // Refresh stats
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.email}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.newEmployees || 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAttendancePercentage()}%</div>
            <p className="text-xs text-muted-foreground">
              Current month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalPayroll())}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Employee count by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.departmentStats.map((dept) => (
                <div key={dept._id} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dept._id}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(dept.count / (stats?.totalEmployees || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{dept.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Current month attendance status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.attendanceStats.map((status) => (
                <div key={status._id} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{status._id}</span>
                  <span className="text-sm text-gray-600">{status.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Latest attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities?.attendance && recentActivities.attendance.length > 0 ? (
                recentActivities.attendance.map((attendance) => (
                  <div key={attendance._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{attendance.employeeId}</p>
                      <p className="text-xs text-gray-600">
                        {formatDate(attendance.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        attendance.status === 'present' ? 'bg-green-100 text-green-800' :
                        attendance.status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {attendance.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent attendance records</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Only show for admins */}
      {user?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={handleAddEmployee}
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium">Add Employee</span>
              </button>
              <button 
                onClick={handleCheckInOut}
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Clock className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium">Check In/Out</span>
              </button>
              <button 
                onClick={handleViewReports}
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium">View Reports</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

        {/* Modals */}
        <AddEmployeeModal 
          isOpen={showAddEmployeeModal} 
          onClose={() => setShowAddEmployeeModal(false)} 
          onSuccess={handleAddEmployeeSuccess} 
        />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Layout>
      <DashboardContent />
    </Layout>
  );
}
