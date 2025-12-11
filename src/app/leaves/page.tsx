'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Plus, Calendar, Clock, Filter, ChevronDown, ChevronUp, Eye, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import ApplyLeaveModal from '@/components/leaves/ApplyLeaveModal';
import LeaveDetailsModal from '@/components/leaves/LeaveDetailsModal';
import DynamicTable, { Column, PaginationInfo } from '@/components/ui/dynamic-table';

interface LeaveRequest {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

interface LeaveBalance {
  leaveType: string;
  entitlement: number;
  accrued: number;
  used: number;
  pending: number;
  available: number;
}

export default function LeavesPage() {
  const { user, token } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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
    status: '',
    leaveType: '',
    startDate: '',
    endDate: '',
  });
  const [recordsPerPage, setRecordsPerPage] = useState('10');

  const fetchLeaves = useCallback(async (page: number = 1, currentFilters = filters) => {
    if (!token) return;
    
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', recordsPerPage);
      
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
        setLeaves(data.leaves);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch leaves:', errorData.error);
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setLoading(false);
    }
  }, [token, recordsPerPage, filters]);

  const fetchLeaveBalance = useCallback(async () => {
    if (!token || !user?.employeeId) return;
    
    try {
      const response = await fetch(`/api/leaves/balance?employeeId=${user.employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaveBalance(data.balances || []);
      }
    } catch (error) {
      console.error('Failed to fetch leave balance:', error);
    }
  }, [token, user?.employeeId]);

  useEffect(() => {
    if (token && user?.employeeId) {
      fetchLeaves(1);
      fetchLeaveBalance();
    }
  }, [token, user?.employeeId, fetchLeaves, fetchLeaveBalance]);

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
      status: '',
      leaveType: '',
      startDate: '',
      endDate: '',
    };
    setFilters(clearedFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLeaves(1, clearedFilters);
  };

  const handleApplySuccess = () => {
    fetchLeaves(pagination.page);
    fetchLeaveBalance();
  };

  const handleViewDetails = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setSelectedLeave(null);
    setShowDetailsModal(false);
  };

  const handleCancelLeave = async (leaveId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      const response = await fetch(`/api/leaves?id=${leaveId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        fetchLeaves(pagination.page);
        fetchLeaveBalance();
      } else {
        const errorData = await response.json();
        alert(`Failed to cancel leave: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Cancel leave error:', error);
      alert('Failed to cancel leave. Please try again.');
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

  const leaveColumns: Column<LeaveRequest>[] = [
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCancelLeave(record._id)}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  const renderLeaveMobileCard = (leave: LeaveRequest) => (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-3 border-b">
        <span className="font-medium capitalize">{getLeaveTypeLabel(leave.leaveType)}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
          {leave.status}
        </span>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCancelLeave(leave._id)}
            className="flex-1 text-red-600 hover:text-red-700"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  if (!user.employeeId) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600">Manage your leave requests and approvals</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Employee Profile Required</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="mb-4">
                  <FileText className="h-16 w-16 text-red-500 mx-auto" />
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
                  <li>• Enable leave management</li>
                </ul>
                <p className="text-sm text-gray-500">
                  Once your employee profile is set up, you'll be able to apply for leaves.
                </p>
              </div>
            </CardContent>
          </Card>
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

  // Get PTO balance
  const ptoBalance = leaveBalance.find(b => b.leaveType === 'pto');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600">Manage your leave requests and approvals</p>
          </div>
          <Button 
            className="flex items-center space-x-2"
            onClick={() => setShowApplyModal(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Apply Leave</span>
          </Button>
        </div>

        {/* Leave Balance Card */}
        {ptoBalance && (
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Entitlement</p>
                  <p className="text-2xl font-bold">{ptoBalance.entitlement}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accrued</p>
                  <p className="text-2xl font-bold text-blue-600">{ptoBalance.accrued}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Used</p>
                  <p className="text-2xl font-bold text-red-600">{ptoBalance.used}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{ptoBalance.pending}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-green-600">{ptoBalance.available}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leave Statistics */}
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
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              emptyMessage="No leave requests found. Apply for a leave to get started."
            />
          </CardContent>
        </Card>

        {/* Apply Leave Modal */}
        <ApplyLeaveModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onSuccess={handleApplySuccess}
        />

        {/* Leave Details Modal */}
        <LeaveDetailsModal
          isOpen={showDetailsModal}
          onClose={handleCloseDetails}
          leave={selectedLeave}
          employeeName={user?.email}
        />
      </div>
    </Layout>
  );
}
