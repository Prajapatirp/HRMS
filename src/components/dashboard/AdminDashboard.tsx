'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DynamicTable, { Column } from '@/components/ui/dynamic-table';
import AttendanceLocationCell from '@/components/attendance/AttendanceLocationCell';
import {
  Users,
  Ticket,
  Clock,
  Check,
  X,
  Calendar,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  User,
  Briefcase,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

interface AttendanceItem {
  _id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  status: string;
  totalHours?: number;
}

interface TimesheetItem {
  _id: string;
  employeeName: string;
  timesheetDate: string;
  projectName: string;
  hours: number;
  status: string;
  submittedAt?: string;
}

interface DashboardData {
  stats: {
    totalEmployees: number;
    tickets: {
      pending: number;
      inProgress: number;
      closed: number;
      total: number;
    };
    timesheets: {
      pending: number;
      approved: number;
      rejected: number;
    };
  };
  recentAttendance: AttendanceItem[];
  pendingTimesheets: TimesheetItem[];
}

function getAttendanceStatusColor(status: string) {
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
}

function getTimesheetStatusColor(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'submitted':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getTimesheetStatusIcon(status: string) {
  switch (status) {
    case 'submitted':
      return <Clock className="h-4 w-4" />;
    case 'approved':
      return <Check className="h-4 w-4" />;
    case 'rejected':
      return <X className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/dashboard/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load dashboard');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleTimesheetAction = async (
    timesheetId: string,
    status: 'approved' | 'rejected'
  ) => {
    if (!token) return;

    setProcessingId(timesheetId);
    try {
      const response = await fetch(`/api/timesheets/${timesheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to ${status} timesheet`);
      }

      await fetchDashboard();
    } catch (err) {
      console.error('Timesheet action error:', err);
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600 mb-4">{error || 'Unable to load dashboard data.'}</p>
          <Button onClick={fetchDashboard}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const { stats, recentAttendance, pendingTimesheets } = data;

  const attendanceColumns: Column<AttendanceItem>[] = [
    {
      key: 'employeeName',
      label: 'Employee Name',
      minWidth: '150px',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      minWidth: '120px',
      render: (value) => <span className="font-medium">{formatDate(value)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      minWidth: '100px',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceStatusColor(value)}`}>
          {value}
        </span>
      ),
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
    },
    {
      key: 'checkInLocation',
      label: 'Log In Latitude - Longitude',
      minWidth: '200px',
      render: (_, record) => (
        <AttendanceLocationCell
          latitude={record.checkInLatitude}
          longitude={record.checkInLongitude}
        />
      ),
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
    },
    {
      key: 'checkOutLocation',
      label: 'Log Out Latitude - Longitude',
      minWidth: '200px',
      render: (_, record) => (
        <AttendanceLocationCell
          latitude={record.checkOutLatitude}
          longitude={record.checkOutLongitude}
        />
      ),
    },
  ];

  const timesheetColumns: Column<TimesheetItem>[] = [
    {
      key: 'employeeName',
      label: 'Employee',
      minWidth: '150px',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'timesheetDate',
      label: 'Date',
      minWidth: '120px',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{formatDate(value)}</span>
        </div>
      ),
    },
    {
      key: 'projectName',
      label: 'Project',
      minWidth: '150px',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Briefcase className="h-4 w-4 text-gray-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'hours',
      label: 'Hours',
      minWidth: '80px',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      minWidth: '120px',
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getTimesheetStatusColor(value)}`}>
          {getTimesheetStatusIcon(value)}
          <span className="ml-1">{value}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      minWidth: '150px',
      render: (_, record) => (
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handleTimesheetAction(record._id, 'approved')}
            disabled={processingId === record._id}
            className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Approve Timesheet"
          >
            {processingId === record._id ? (
              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
            ) : (
              <Check className="h-4 w-4 text-green-600" />
            )}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="px-2 py-1 text-xs text-white bg-black rounded">Approve Timesheet</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black" />
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleTimesheetAction(record._id, 'rejected')}
            disabled={processingId === record._id}
            className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reject Timesheet"
          >
            <X className="h-4 w-4 text-red-600" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="px-2 py-1 text-xs text-white bg-black rounded">Reject Timesheet</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black" />
              </div>
            </div>
          </button>
        </div>
      ),
    },
  ];

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      href: '/employees',
    },
    {
      title: 'Tickets Pending',
      value: stats.tickets.pending,
      icon: Ticket,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      href: '/admin/tickets',
    },
    {
      title: 'Tickets In Progress',
      value: stats.tickets.inProgress,
      icon: Clock,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      href: '/admin/tickets',
    },
    {
      title: 'Tickets Closed',
      value: stats.tickets.closed,
      icon: Check,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      href: '/admin/tickets',
    },
    {
      title: 'Timesheets Pending',
      value: stats.timesheets.pending,
      icon: FileText,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      href: '/admin/timesheets',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${card.iconBg}`}>
                    <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                  <div className="ml-4 min-w-0">
                    <p className="text-sm font-medium text-gray-600 truncate">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Recent Attendance</CardTitle>
              <CardDescription>Latest 10 attendance records</CardDescription>
            </div>
            <Link
              href="/admin/attendance"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <DynamicTable
              data={recentAttendance}
              columns={attendanceColumns}
              emptyMessage="No attendance records found."
              keyExtractor={(record) => record._id}
              stickyHeader
              maxHeight="360px"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Timesheet Approval</CardTitle>
              <CardDescription>
                {stats.timesheets.pending} pending · {stats.timesheets.approved} approved ·{' '}
                {stats.timesheets.rejected} rejected
              </CardDescription>
            </div>
            <Link
              href="/admin/timesheets"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <DynamicTable
              data={pendingTimesheets}
              columns={timesheetColumns}
              emptyMessage="No timesheets pending approval."
              keyExtractor={(record) => record._id}
              stickyHeader
              maxHeight="360px"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
