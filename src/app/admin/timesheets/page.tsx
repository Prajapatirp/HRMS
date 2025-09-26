'use client';

import React, { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Check, X, Eye, Clock, FileText } from 'lucide-react';

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
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    projectId: '',
    employeeId: '',
    startDate: '',
    endDate: '',
    status: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
    fetchTimesheets();
  }, []);

  useEffect(() => {
    fetchTimesheets();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
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
      console.error('Error fetching employees:', error);
    }
  };

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
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
        let filteredTimesheets = data.timesheets;
        
        // Filter by status on frontend since it's not in the API yet
        if (filters.status) {
          filteredTimesheets = filteredTimesheets.filter((t: Timesheet) => t.status === filters.status);
        }
        
        setTimesheets(filteredTimesheets);
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (timesheetId: string) => {
    setProcessing(timesheetId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/timesheets/${timesheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        fetchTimesheets();
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
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(timesheetId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/timesheets/${timesheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 'rejected',
          rejectionReason: rejectionReason.trim()
        }),
      });

      if (response.ok) {
        fetchTimesheets();
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

  // Calculate statistics
  const stats = {
    total: timesheets.length,
    submitted: timesheets.filter(t => t.status === 'submitted').length,
    approved: timesheets.filter(t => t.status === 'approved').length,
    rejected: timesheets.filter(t => t.status === 'rejected').length,
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
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="projectFilter">Project</Label>
            <Select
              value={filters.projectId}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
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
            <Label htmlFor="employeeFilter">Employee</Label>
            <Select
              value={filters.employeeId}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
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
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="statusFilter">Status</Label>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => setFilters({ projectId: '', employeeId: '', startDate: '', endDate: '', status: '' })}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Timesheets Table */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Timesheet Entries</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : timesheets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No timesheets found matching the current filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.map((timesheet) => (
                <TableRow key={timesheet._id}>
                  <TableCell>
                    {timesheet.employeeName}
                  </TableCell>
                  <TableCell>
                    {new Date(timesheet.timesheetDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {timesheet.projectName}
                  </TableCell>
                  <TableCell>
                    {timesheet.hours}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(timesheet.status)}`}>
                      {getStatusIcon(timesheet.status)}
                      <span className="ml-1">{timesheet.status}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    {timesheet.submittedAt 
                      ? new Date(timesheet.submittedAt).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(timesheet)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {timesheet.status === 'submitted' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(timesheet._id)}
                            disabled={processing === timesheet._id}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(timesheet)}
                            disabled={processing === timesheet._id}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Timesheet Details Modal */}
      {showDetails && selectedTimesheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Timesheet Details</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedTimesheet(null);
                    setRejectionReason('');
                  }}
                >
                  Close
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Employee</Label>
                    <p className="text-sm text-gray-900">{selectedTimesheet.employeeName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Date</Label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedTimesheet.timesheetDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Project</Label>
                    <p className="text-sm text-gray-900">{selectedTimesheet.projectName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Hours</Label>
                    <p className="text-sm text-gray-900">{selectedTimesheet.hours}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Task Details</Label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {selectedTimesheet.taskDetails}
                  </p>
                </div>
                
                {selectedTimesheet.planForTomorrow && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Plan For Tomorrow</Label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {selectedTimesheet.planForTomorrow}
                    </p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTimesheet.status)}`}>
                    {getStatusIcon(selectedTimesheet.status)}
                    <span className="ml-1">{selectedTimesheet.status}</span>
                  </span>
                </div>
                
                {selectedTimesheet.rejectionReason && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Rejection Reason</Label>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {selectedTimesheet.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedTimesheet.status === 'submitted' && (
                <div className="mt-6 pt-4 border-t">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                      <textarea
                        id="rejectionReason"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a reason for rejection..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(selectedTimesheet._id)}
                        disabled={processing === selectedTimesheet._id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReject(selectedTimesheet._id)}
                        disabled={processing === selectedTimesheet._id}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      </div>
    </Layout>
  );
}
