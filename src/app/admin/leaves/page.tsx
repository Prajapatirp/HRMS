'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { FileText, CheckCircle, XCircle, Filter, Clock, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import LeaveDetailsModal from '@/components/leaves/LeaveDetailsModal';
import DynamicTable, { Column, PaginationInfo } from '@/components/ui/dynamic-table';
import DynamicModal from '@/components/ui/dynamic-modal';

interface LeaveRequest {
  _id: string;
  employeeId: string;
  employeeName?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
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

export default function AdminLeavesPage() {
  const { user, token } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
    status: '',
    leaveType: '',
    startDate: '',
    endDate: '',
  });
  const [recordsPerPage, setRecordsPerPage] = useState('10');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, [token]);

  const fetchLeaves = useCallback(async (page: number = 1, currentFilters = filters) => {
    if (!token) return;
    
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', recordsPerPage);
      
      if (currentFilters.employeeId) queryParams.append('employeeId', currentFilters.employeeId);
      if (currentFilters.status) queryParams.append('status', currentFilters.status);
      if (currentFilters.leaveType) queryParams.append('leaveType', currentFilters.leaveType);
      if (currentFilters.startDate) queryParams.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) queryParams.append('endDate', currentFilters.endDate);

      const response = await fetch(`/api/leaves?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaves(data.leaves || []);
        setPagination(data.pagination || pagination);
      } else {
        console.error('Failed to fetch leaves data');
      }
    } catch (error) {
      console.error('Failed to fetch leaves data:', error);
    } finally {
      setLoading(false);
    }
  }, [token, recordsPerPage, filters, pagination]);

  useEffect(() => {
    if (token && (user?.role === 'admin' || user?.role === 'hr')) {
      fetchLeaves(1);
      fetchEmployees();
    }
  }, [token, user, fetchLeaves, fetchEmployees]);

  const handlePageChange = (page: number) => {
    fetchLeaves(page);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLeaves(1, filters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      employeeId: '',
      status: '',
      leaveType: '',
      startDate: '',
      endDate: '',
    };
    setFilters(clearedFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLeaves(1, clearedFilters);
  };

  const handleApproveLeave = async (leaveId: string) => {
    try {
      const response = await fetch(`/api/leaves/${leaveId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (response.ok) {
        fetchLeaves(pagination.page);
        alert('Leave approved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to approve leave: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Approve leave error:', error);
      alert('Failed to approve leave. Please try again.');
    }
  };

  const handleRejectLeave = (leaveId: string) => {
    setRejectingLeaveId(leaveId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectingLeaveId) return;

    try {
      const response = await fetch(`/api/leaves/${rejectingLeaveId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'reject', 
          rejectionReason: rejectReason || 'No reason provided' 
        }),
      });

      if (response.ok) {
        fetchLeaves(pagination.page);
        setShowRejectModal(false);
        setRejectingLeaveId(null);
        setRejectReason('');
        alert('Leave rejected successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to reject leave: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Reject leave error:', error);
      alert('Failed to reject leave. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'processed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'pto': 'PTO',
      'lop': 'LOP',
      'comp-off': 'Comp Off',
      'sick': 'Sick',
      'vacation': 'Vacation',
      'personal': 'Personal',
      'maternity': 'Maternity',
      'paternity': 'Paternity',
      'bereavement': 'Bereavement',
      'other': 'Other',
    };
    return labels[type] || type;
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    return employee ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}` : employeeId;
  };

  const handleViewDetails = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setSelectedLeave(null);
    setShowDetailsModal(false);
  };

  const leaveColumns: Column<LeaveRequest>[] = [
    {
      key: 'employeeName',
      label: 'Employee',
      render: (value, record) => (
        <span className="font-medium">{value || getEmployeeName(record.employeeId)}</span>
      ),
    },
    {
      key: 'leaveType',
      label: 'Leave Type',
      render: (value) => (
        <span className="font-medium capitalize">{getLeaveTypeLabel(value)}</span>
      ),
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'totalDays',
      label: 'Days',
      render: (value) => `${value} day${value > 1 ? 's' : ''}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(record)}
            className="flex items-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>View</span>
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleApproveLeave(record._id)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRejectLeave(record._id)}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const renderLeaveMobileCard = (leave: LeaveRequest) => (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-3 border-b">
        <span className="font-medium">{leave.employeeName || getEmployeeName(leave.employeeId)}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
          {leave.status}
        </span>
      </div>
      <div className="mb-3 pb-3 border-b">
        <p className="text-xs text-gray-500 mb-1">Leave Type</p>
        <p className="text-sm text-gray-900 capitalize">{getLeaveTypeLabel(leave.leaveType)}</p>
      </div>
      <div className="mb-3 pb-3 border-b">
        <p className="text-xs text-gray-500 mb-1">Date Range</p>
        <p className="text-sm text-gray-900">
          {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
        </p>
      </div>
      <div className="mb-3 pb-3 border-b">
        <p className="text-xs text-gray-500 mb-1">Duration</p>
        <p className="text-sm text-gray-900">{leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</p>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewDetails(leave)}
          className="flex-1"
        >
          View Details
        </Button>
        {leave.status === 'pending' && (
          <>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
              onClick={() => handleApproveLeave(leave._id)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => handleRejectLeave(leave._id)}
            >
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  if (user.role !== 'admin' && user.role !== 'hr') {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  // Calculate statistics
  const stats = {
    total: pagination.total,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin - Leave Management</h1>
          <p className="text-gray-600">View and manage all employees' leave requests</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leaves</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="employeeFilter" className="text-sm font-medium text-gray-700">Employee</Label>
                  <Select
                    id="employeeFilter"
                    value={filters.employeeId}
                    onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                    className="w-full"
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.personalInfo.firstName} {emp.personalInfo.lastName}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select
                    id="statusFilter"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="draft">Draft</option>
                    <option value="processed">Processed</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="leaveTypeFilter" className="text-sm font-medium text-gray-700">Leave Type</Label>
                  <Select
                    id="leaveTypeFilter"
                    value={filters.leaveType}
                    onChange={(e) => handleFilterChange('leaveType', e.target.value)}
                    className="w-full"
                  >
                    <option value="">All Types</option>
                    <option value="pto">PTO</option>
                    <option value="lop">LOP</option>
                    <option value="comp-off">Comp Off</option>
                    <option value="sick">Sick</option>
                    <option value="vacation">Vacation</option>
                    <option value="personal">Personal</option>
                    <option value="maternity">Maternity</option>
                    <option value="paternity">Paternity</option>
                    <option value="bereavement">Bereavement</option>
                    <option value="other">Other</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="startDateFilter" className="text-sm font-medium text-gray-700">Start Date</Label>
                  <Input
                    id="startDateFilter"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endDateFilter" className="text-sm font-medium text-gray-700">End Date</Label>
                  <Input
                    id="endDateFilter"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button onClick={applyFilters} className="flex items-center justify-center space-x-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4" />
                  <span>Apply Filters</span>
                </Button>
                <Button 
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Leave Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicTable
              data={leaves}
              columns={leaveColumns}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              recordsPerPage={recordsPerPage}
              onRecordsPerPageChange={(value) => {
                setRecordsPerPage(value);
                setPagination(prev => ({ ...prev, page: 1, limit: parseInt(value) }));
                fetchLeaves(1);
              }}
              mobileCardRender={renderLeaveMobileCard}
              emptyMessage="No leave requests found."
            />
          </CardContent>
        </Card>

        {/* Leave Details Modal */}
        <LeaveDetailsModal
          isOpen={showDetailsModal}
          onClose={handleCloseDetails}
          leave={selectedLeave}
          employeeName={selectedLeave ? (selectedLeave.employeeName || getEmployeeName(selectedLeave.employeeId)) : undefined}
          approverName={selectedLeave?.approvedBy}
        />

        {/* Reject Leave Modal */}
        <DynamicModal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setRejectingLeaveId(null);
            setRejectReason('');
          }}
          title="Reject Leave Request"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason" className="text-sm font-medium text-gray-700">
                Rejection Reason (Optional)
              </Label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingLeaveId(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmReject}
              >
                Reject Leave
              </Button>
            </div>
          </div>
        </DynamicModal>
      </div>
    </Layout>
  );
}
