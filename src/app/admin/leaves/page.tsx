'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { FileText, CheckCircle, XCircle, Search, Filter, Clock } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import LeaveDetailsModal from '@/components/leaves/LeaveDetailsModal';

interface LeaveRequest {
  _id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
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
  const [filters, setFilters] = useState({
    employeeId: '',
    status: 'pending',
    leaveType: ''
  });
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchLeaves();
      fetchEmployees();
    }
  }, [token, user]);

  const fetchLeaves = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.leaveType) queryParams.append('leaveType', filters.leaveType);

      const response = await fetch(`/api/leaves?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaves(data.leaves);
      } else {
        console.error('Failed to fetch leaves data');
      }
    } catch (error) {
      console.error('Failed to fetch leaves data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
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
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setLoading(true);
    fetchLeaves();
  };

  const handleApproveLeave = async (leaveId: string) => {
    try {
      console.log('Approving leave:', leaveId);
      const response = await fetch(`/api/leaves/${leaveId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      console.log('Approval response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Approval successful:', result);
        fetchLeaves(); // Refresh the list
        alert('Leave approved successfully!');
      } else {
        const errorData = await response.json();
        console.error('Approval failed:', errorData);
        alert(`Failed to approve leave: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Approve leave error:', error);
      alert('Failed to approve leave. Please try again.');
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    const rejectionReason = prompt('Please provide a reason for rejection:');
    if (!rejectionReason) return;

    try {
      console.log('Rejecting leave:', leaveId, 'Reason:', rejectionReason);
      const response = await fetch(`/api/leaves/${leaveId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject', rejectionReason }),
      });

      console.log('Rejection response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Rejection successful:', result);
        fetchLeaves(); // Refresh the list
        alert('Leave rejected successfully!');
      } else {
        const errorData = await response.json();
        console.error('Rejection failed:', errorData);
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick':
        return 'text-red-600';
      case 'vacation':
        return 'text-blue-600';
      case 'personal':
        return 'text-purple-600';
      case 'maternity':
        return 'text-pink-600';
      case 'paternity':
        return 'text-indigo-600';
      case 'bereavement':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
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

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  if (user.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

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
              <div className="text-2xl font-bold">{leaves.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leaves.filter(leave => leave.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leaves.filter(leave => leave.status === 'approved').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leaves.filter(leave => leave.status === 'rejected').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select
                  value={filters.leaveType}
                  onChange={(e) => handleFilterChange('leaveType', e.target.value)}
                >
                  <option value="">All types</option>
                  <option value="sick">Sick Leave</option>
                  <option value="vacation">Vacation</option>
                  <option value="personal">Personal Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="bereavement">Bereavement Leave</option>
                  <option value="other">Other</option>
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

        {/* Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>
              Showing {leaves.length} leave requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {leaves.map((leave) => (
                  <div key={leave._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-lg">
                            {getEmployeeName(leave.employeeId)}
                          </h3>
                          <span className={`font-medium capitalize ${getLeaveTypeColor(leave.leaveType)}`}>
                            {leave.leaveType} Leave
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                            {leave.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Start Date:</span>
                            <p>{formatDate(leave.startDate)}</p>
                          </div>
                          <div>
                            <span className="font-medium">End Date:</span>
                            <p>{formatDate(leave.endDate)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>
                            <p>{leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <span className="font-medium text-sm">Reason:</span>
                          <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                        </div>
                        
                        {leave.rejectionReason && (
                          <div className="mt-2">
                            <span className="font-medium text-sm text-red-600">Rejection Reason:</span>
                            <p className="text-sm text-red-600 mt-1">{leave.rejectionReason}</p>
                          </div>
                        )}
                        
                        <div className="mt-2 text-xs text-gray-500">
                          Applied on {formatDate(leave.createdAt)}
                          {leave.approvedAt && (
                            <span> • Processed on {formatDate(leave.approvedAt)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(leave)}
                        >
                          View Details
                        </Button>
                        {leave.status === 'pending' && (
                          <>
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveLeave(leave._id)}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectLeave(leave._id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {leaves.length === 0 && !loading && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests</h3>
                <p className="text-gray-600">No leave requests found for the selected filters.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Details Modal */}
        <LeaveDetailsModal
          isOpen={showDetailsModal}
          onClose={handleCloseDetails}
          leave={selectedLeave}
          employeeName={selectedLeave ? getEmployeeName(selectedLeave.employeeId) : undefined}
          approverName={selectedLeave?.approvedBy}
        />
      </div>
    </Layout>
  );
}
