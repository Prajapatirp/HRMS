'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DynamicTable, { Column, PaginationInfo } from '@/components/ui/dynamic-table';
import DynamicModal from '@/components/ui/dynamic-modal';
import { Check, X, Eye, Clock, FileText, Filter, Calendar, User, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Project {
  _id: string;
  name: string;
  description?: string;
}

interface Employee {
  _id: string;
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Timesheet {
  _id: string;
  employeeId: string;
  employeeName: string;
  timesheetDate: string;
  hours: number;
  projectId: string;
  projectName: string;
  taskDetails: string;
  planForTomorrow?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function AdminTimesheetsPage() {
  const { token } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  // Filters
  const [filters, setFilters] = useState({
    projectId: '',
    employeeId: '',
    startDate: '',
    endDate: '',
    status: '',
    limit: '10',
  });

  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchEmployees();
      fetchTimesheets(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchProjects = useCallback(async () => {
    try {
      if (!token) return;
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }, [token]);

  const fetchEmployees = useCallback(async () => {
    try {
      if (!token) return;
      const response = await fetch('/api/employees?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [token]);

  const fetchTimesheets = async (page = 1) => {
    try {
      setLoading(true);
      if (!token) return;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', filters.limit || '10');
      
      if (filters.projectId) queryParams.append('projectId', filters.projectId);
      if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      
      const response = await fetch(`/api/timesheets?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        let filteredTimesheets = data.timesheets || [];
        
        // Filter by status on frontend since it's not in the API yet
        if (filters.status) {
          filteredTimesheets = filteredTimesheets.filter((t: Timesheet) => t.status === filters.status);
        }
        
        setTimesheets(filteredTimesheets);
        if (data.pagination) {
          // Adjust pagination if status filter is applied
          if (filters.status) {
            const totalFiltered = filteredTimesheets.length;
            const pages = Math.ceil(totalFiltered / parseInt(filters.limit || '10'));
            setPagination({
              ...data.pagination,
              total: totalFiltered,
              pages: pages,
              hasNext: page < pages,
              hasPrev: page > 1,
            });
          } else {
            setPagination(data.pagination);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchTimesheets(newPage);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTimesheets(1);
  };

  const clearFilters = () => {
    const clearedFilters = {
      projectId: '',
      employeeId: '',
      startDate: '',
      endDate: '',
      status: '',
      limit: '10',
    };
    setFilters(clearedFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(() => fetchTimesheets(1), 100);
  };

  const handleApprove = async (timesheetId: string) => {
    setProcessing(timesheetId);
    try {
      if (!token) return;
      const response = await fetch(`/api/timesheets/${timesheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        fetchTimesheets(pagination.page);
        setShowDetails(false);
        setSelectedTimesheet(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to approve timesheet');
      }
    } catch (error) {
      console.error('Error approving timesheet:', error);
      alert('Failed to approve timesheet');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (timesheetId: string) => {
    setProcessing(timesheetId);
    try {
      if (!token) return;
      const response = await fetch(`/api/timesheets/${timesheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 'rejected',
          rejectionReason: rejectionReason.trim() || undefined // Optional rejection reason
        }),
      });

      if (response.ok) {
        fetchTimesheets(pagination.page);
        setShowDetails(false);
        setSelectedTimesheet(null);
        setRejectionReason('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reject timesheet');
      }
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      alert('Failed to reject timesheet');
    } finally {
      setProcessing(null);
    }
  };

  const handleViewDetails = (timesheet: Timesheet) => {
    setSelectedTimesheet(timesheet);
    setShowDetails(true);
    setRejectionReason('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'approved': return <Check className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Calculate statistics - Note: These are based on current page, consider fetching all for accurate stats
  const stats = {
    total: pagination.total || timesheets.length,
    submitted: timesheets.filter(t => t.status === 'submitted').length,
    approved: timesheets.filter(t => t.status === 'approved').length,
    rejected: timesheets.filter(t => t.status === 'rejected').length,
  };

  // Define columns for timesheet table
  const timesheetColumns: Column<Timesheet>[] = [
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
      mobileLabel: 'Employee',
    },
    {
      key: 'timesheetDate',
      label: 'Date',
      minWidth: '120px',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{new Date(value).toLocaleDateString()}</span>
        </div>
      ),
      mobileLabel: 'Date',
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
      mobileLabel: 'Project',
    },
    {
      key: 'hours',
      label: 'Hours',
      minWidth: '80px',
      render: (value) => (
        <span className="font-medium">{value}</span>
      ),
      mobileLabel: 'Hours',
    },
    {
      key: 'status',
      label: 'Status',
      minWidth: '120px',
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
          {getStatusIcon(value)}
          <span className="ml-1">{value}</span>
        </span>
      ),
      mobileLabel: 'Status',
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      minWidth: '120px',
      render: (value) => (
        value 
          ? new Date(value).toLocaleDateString()
          : '-'
      ),
      mobileLabel: 'Submitted',
      hideOnMobile: true,
    },
    {
      key: 'actions',
      label: 'Actions',
      minWidth: '150px',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDetails(record)}
            className="flex items-center space-x-1"
          >
            <Eye className="h-3 w-3" />
            <span>View</span>
          </Button>
          {record.status === 'submitted' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApprove(record._id)}
                disabled={processing === record._id}
                className="text-green-600 hover:text-green-700 flex items-center space-x-1"
              >
                <Check className="h-3 w-3" />
                <span>Approve</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(record)}
                disabled={processing === record._id}
                className="text-red-600 hover:text-red-700 flex items-center space-x-1"
              >
                <X className="h-3 w-3" />
                <span>Reject</span>
              </Button>
            </>
          )}
        </div>
      ),
      mobileLabel: 'Actions',
      mobileRender: (_, record) => (
        <div className="flex flex-col space-y-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDetails(record)}
            className="w-full flex items-center justify-center space-x-1"
          >
            <Eye className="h-3 w-3" />
            <span>View</span>
          </Button>
          {record.status === 'submitted' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApprove(record._id)}
                disabled={processing === record._id}
                className="w-full text-green-600 hover:text-green-700 flex items-center justify-center space-x-1"
              >
                <Check className="h-3 w-3" />
                <span>Approve</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(record)}
                disabled={processing === record._id}
                className="w-full text-red-600 hover:text-red-700 flex items-center justify-center space-x-1"
              >
                <X className="h-3 w-3" />
                <span>Reject</span>
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Custom mobile card render for timesheets
  const renderTimesheetMobileCard = (record: Timesheet) => {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-gray-900">{record.employeeName}</p>
            <p className="text-sm text-gray-600">
              {new Date(record.timesheetDate).toLocaleDateString()}
            </p>
          </div>
          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
            {getStatusIcon(record.status)}
            <span className="ml-1">{record.status}</span>
          </span>
        </div>
        
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-700">{record.projectName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">{record.hours} hours</span>
          </div>
          {record.submittedAt && (
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-700">
                Submitted: {new Date(record.submittedAt).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-1">Task Details:</p>
            <p className="text-sm text-gray-700">{record.taskDetails}</p>
          </div>
          {record.rejectionReason && (
            <div className="pt-2">
              <p className="text-xs text-red-600">Rejected: {record.rejectionReason}</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 pt-3 border-t mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDetails(record)}
            className="flex-1 flex items-center justify-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>View</span>
          </Button>
          {record.status === 'submitted' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApprove(record._id)}
                disabled={processing === record._id}
                className="flex-1 text-green-600 hover:text-green-700 flex items-center justify-center space-x-1"
              >
                <Check className="h-4 w-4" />
                <span>Approve</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(record)}
                disabled={processing === record._id}
                className="flex-1 text-red-600 hover:text-red-700 flex items-center justify-center space-x-1"
              >
                <X className="h-4 w-4" />
                <span>Reject</span>
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Timesheet Review</h1>
          <p className="text-gray-600 mt-1">Review and approve employee timesheets</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Timesheets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.submitted}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="employeeFilter">Employee</Label>
              <Select
                id="employeeFilter"
                value={filters.employeeId}
                onChange={(e) => handleFilterChange('employeeId', e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee.employeeId}>
                    {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="projectFilter">Project</Label>
              <Select
                id="projectFilter"
                value={filters.projectId}
                onChange={(e) => handleFilterChange('projectId', e.target.value)}
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </div>

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
              <Label htmlFor="statusFilter">Status</Label>
              <Select
                id="statusFilter"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="limitFilter">Records per page</Label>
              <Select
                id="limitFilter"
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

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={applyFilters} className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Apply Filters</span>
            </Button>
            <Button 
              onClick={clearFilters}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timesheets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Timesheet Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <DynamicTable
            data={timesheets}
            columns={timesheetColumns}
            loading={loading}
            emptyMessage="No timesheets found matching the current filters."
            pagination={pagination}
            onPageChange={handlePageChange}
            keyExtractor={(record) => record._id}
            mobileCardRender={renderTimesheetMobileCard}
          />
        </CardContent>
      </Card>

      {/* Timesheet Details Modal */}
      <DynamicModal
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedTimesheet(null);
          setRejectionReason('');
        }}
        title="Timesheet Details"
        maxWidth="max-w-2xl"
        footer={
          selectedTimesheet?.status === 'submitted' ? (
            <div className="flex gap-2">
              <Button
                onClick={() => selectedTimesheet && handleApprove(selectedTimesheet._id)}
                disabled={processing === selectedTimesheet?._id}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => selectedTimesheet && handleReject(selectedTimesheet._id)}
                disabled={processing === selectedTimesheet?._id}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedTimesheet && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Employee</Label>
                <p className="text-sm text-gray-900 mt-1">{selectedTimesheet.employeeName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Date</Label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(selectedTimesheet.timesheetDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Project</Label>
                <p className="text-sm text-gray-900 mt-1">{selectedTimesheet.projectName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Hours</Label>
                <p className="text-sm text-gray-900 mt-1">{selectedTimesheet.hours}</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Task Details</Label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md mt-1">
                {selectedTimesheet.taskDetails}
              </p>
            </div>
            
            {selectedTimesheet.planForTomorrow && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Plan For Tomorrow</Label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md mt-1">
                  {selectedTimesheet.planForTomorrow}
                </p>
              </div>
            )}
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Status</Label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTimesheet.status)}`}>
                  {getStatusIcon(selectedTimesheet.status)}
                  <span className="ml-1">{selectedTimesheet.status}</span>
                </span>
              </div>
            </div>
            
            {selectedTimesheet.rejectionReason && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Rejection Reason</Label>
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md mt-1">
                  {selectedTimesheet.rejectionReason}
                </p>
              </div>
            )}
            
            {selectedTimesheet.status === 'submitted' && (
              <div className="pt-4 border-t border-gray-200">
                <div>
                  <Label htmlFor="rejectionReason">Rejection Reason (Optional)</Label>
                  <textarea
                    id="rejectionReason"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection (optional)..."
                  />
                  <p className="text-xs text-gray-500 mt-1">You can reject without providing a reason</p>
                </div>
              </div>
            )}
          </>
        )}
      </DynamicModal>
      </div>
    </Layout>
  );
}
