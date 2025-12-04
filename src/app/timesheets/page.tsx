'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DynamicTable, { Column, PaginationInfo } from '@/components/ui/dynamic-table';
import { Plus, Edit, Trash2, Filter, Calendar, User, Briefcase } from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  description?: string;
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
  approvedAt?: string;
  rejectionReason?: string;
}

interface Employee {
  _id: string;
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
  };
}

export default function TimesheetsPage() {
  const { user, loading: authLoading, token } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  // Form state
  const [formData, setFormData] = useState({
    employeeName: '',
    timesheetDate: new Date().toISOString().split('T')[0],
    hours: '',
    projectId: '',
    taskDetails: '',
    planForTomorrow: '',
  });

  // Filters
  const [filters, setFilters] = useState({
    employeeId: '',
    projectId: '',
    startDate: '',
    endDate: '',
    limit: '10',
  });

  useEffect(() => {
    if (!authLoading && user && token) {
      fetchProjects();
      if (user.role === 'admin' || user.role === 'hr') {
        fetchEmployees();
      }
      fetchTimesheets(1);
    }
  }, [authLoading, user, token]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        console.error('Failed to fetch projects:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchEmployees = async () => {
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
  };

  const fetchTimesheets = async (page = 1) => {
    try {
      setLoading(true);
      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', filters.limit || '10');
      
      if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
      if (filters.projectId) queryParams.append('projectId', filters.projectId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      
      const response = await fetch(`/api/timesheets?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimesheets(data.timesheets || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        console.error('Failed to fetch timesheets:', response.status, response.statusText);
        setTimesheets([]);
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      setTimesheets([]);
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
      employeeId: '',
      projectId: '',
      startDate: '',
      endDate: '',
      limit: '10',
    };
    setFilters(clearedFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    // Need to rebuild query params for cleared filters
    setTimeout(() => fetchTimesheets(1), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.employeeId) {
      alert('Employee ID not set. Please contact admin to set up your employee profile.');
      return;
    }
    
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingTimesheet 
        ? `/api/timesheets/${editingTimesheet._id}`
        : '/api/timesheets';
      
      const method = editingTimesheet ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          employeeId: user.employeeId,
          hours: parseFloat(formData.hours),
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingTimesheet(null);
        resetForm();
        fetchTimesheets(pagination.page);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save timesheet');
      }
    } catch (error) {
      console.error('Error saving timesheet:', error);
      alert('Failed to save timesheet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (timesheet: Timesheet) => {
    if (timesheet.status === 'submitted' || timesheet.status === 'approved') {
      alert('Cannot edit submitted or approved timesheet');
      return;
    }
    
    setEditingTimesheet(timesheet);
    setFormData({
      employeeName: timesheet.employeeName,
      timesheetDate: timesheet.timesheetDate.split('T')[0],
      hours: timesheet.hours.toString(),
      projectId: timesheet.projectId,
      taskDetails: timesheet.taskDetails,
      planForTomorrow: timesheet.planForTomorrow || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (timesheetId: string) => {
    if (!confirm('Are you sure you want to delete this timesheet?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/timesheets/${timesheetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchTimesheets(pagination.page);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete timesheet');
      }
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      alert('Failed to delete timesheet');
    }
  };

  const handleSubmitTimesheet = async (timesheetId: string) => {
    try {
      if (!token) return;
      const response = await fetch(`/api/timesheets/${timesheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'submitted' }),
      });

      if (response.ok) {
        fetchTimesheets(pagination.page);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit timesheet');
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      alert('Failed to submit timesheet');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeName: user?.email?.split('@')[0] || '',
      timesheetDate: new Date().toISOString().split('T')[0],
      hours: '',
      projectId: '',
      taskDetails: '',
      planForTomorrow: '',
    });
  };

  // Initialize form with user data when component mounts
  useEffect(() => {
    if (user?.email) {
      setFormData((prev: any) => ({
        ...prev,
        employeeName: user.email.split('@')[0] || '',
      }));
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Define columns for timesheet table
  const timesheetColumns: Column<Timesheet>[] = [
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
    ...((user?.role === 'admin' || user?.role === 'hr') ? [{
      key: 'employeeName',
      label: 'Employee',
      minWidth: '150px',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-400" />
          <span>{value}</span>
        </div>
      ),
      mobileLabel: 'Employee',
    } as Column<Timesheet>] : []),
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
      key: 'taskDetails',
      label: 'Task Details',
      minWidth: '200px',
      render: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      ),
      mobileLabel: 'Task Details',
      mobileRender: (value) => (
        <div className="text-sm">{value}</div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      minWidth: '100px',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
      mobileLabel: 'Status',
    },
    {
      key: 'actions',
      label: 'Actions',
      minWidth: '150px',
      render: (_, record) => (
        <div className="flex space-x-2">
          {record.status === 'draft' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(record)}
                className="flex items-center space-x-1"
              >
                <Edit className="h-3 w-3" />
                <span>Edit</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSubmitTimesheet(record._id)}
              >
                Submit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(record._id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
          {record.status === 'rejected' && record.rejectionReason && (
            <div className="text-xs text-red-600 max-w-xs">
              {record.rejectionReason}
            </div>
          )}
        </div>
      ),
      mobileLabel: 'Actions',
      mobileRender: (_, record) => (
        <div className="flex flex-col space-y-2 pt-2">
          {record.status === 'draft' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(record)}
                className="w-full flex items-center justify-center space-x-1"
              >
                <Edit className="h-3 w-3" />
                <span>Edit</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSubmitTimesheet(record._id)}
                className="w-full"
              >
                Submit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(record._id)}
                className="w-full flex items-center justify-center"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </Button>
            </>
          )}
          {record.status === 'rejected' && record.rejectionReason && (
            <div className="text-xs text-red-600">
              Rejected: {record.rejectionReason}
            </div>
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
            <p className="font-semibold text-gray-900">
              {new Date(record.timesheetDate).toLocaleDateString()}
            </p>
            {(user?.role === 'admin' || user?.role === 'hr') && (
              <p className="text-sm text-gray-600">{record.employeeName}</p>
            )}
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
            {record.status}
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
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-1">Task Details:</p>
            <p className="text-sm text-gray-700">{record.taskDetails}</p>
          </div>
        </div>
        
        {record.status === 'draft' && (
          <div className="flex items-center space-x-2 pt-3 border-t mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(record)}
              className="flex-1 flex items-center justify-center space-x-1"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSubmitTimesheet(record._id)}
              className="flex-1"
            >
              Submit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(record._id)}
              className="flex-1 flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        {record.status === 'rejected' && record.rejectionReason && (
          <div className="pt-3 border-t mt-3">
            <p className="text-xs text-red-600">Rejected: {record.rejectionReason}</p>
          </div>
        )}
      </div>
    );
  };

  // Show loading state while authentication is in progress
  if (authLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show message if user is not authenticated
  if (!user) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600">Please log in to access timesheets.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Timesheets</h1>
          <p className="text-gray-600 mt-1">Manage your daily timesheet entries</p>
        </div>
        <Button
          onClick={() => {
            if (!user?.employeeId) {
              alert('Employee ID not set. Please contact admin to set up your employee profile.');
              return;
            }
            resetForm();
            setEditingTimesheet(null);
            setShowForm(true);
          }}
          disabled={!user?.employeeId}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Timesheet
        </Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {(user?.role === 'admin' || user?.role === 'hr') && (
              <div>
                <Label htmlFor="employeeId">Employee</Label>
                <Select
                  id="employeeId"
                  value={filters.employeeId}
                  onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.personalInfo.firstName} {emp.personalInfo.lastName}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="projectId">Project</Label>
              <Select
                id="projectId"
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

      {/* Timesheet Form */}
      {showForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingTimesheet ? 'Edit Timesheet' : 'Add New Timesheet'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeName">Employee Name</Label>
                <Input
                  id="employeeName"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="timesheetDate">Timesheet Date</Label>
                <Input
                  id="timesheetDate"
                  type="date"
                  value={formData.timesheetDate}
                  onChange={(e) => setFormData({ ...formData, timesheetDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="projectId">Project</Label>
                <Select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="taskDetails">Task Details</Label>
              <textarea
                id="taskDetails"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                value={formData.taskDetails}
                onChange={(e) => setFormData({ ...formData, taskDetails: e.target.value })}
                placeholder="Describe what you worked on today..."
                required
              />
            </div>
            <div>
              <Label htmlFor="planForTomorrow">Plan For Tomorrow (Optional)</Label>
              <textarea
                id="planForTomorrow"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                value={formData.planForTomorrow}
                onChange={(e) => setFormData({ ...formData, planForTomorrow: e.target.value })}
                placeholder="What do you plan to work on tomorrow?"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingTimesheet ? 'Update' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingTimesheet(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

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
            emptyMessage="No timesheets found. Create your first timesheet entry."
            pagination={pagination}
            onPageChange={handlePageChange}
            recordsPerPage={filters.limit}
            onRecordsPerPageChange={(limit) => {
              setFilters((prev) => ({ ...prev, limit }));
              setPagination((prev) => ({ ...prev, page: 1 }));
              setTimeout(() => fetchTimesheets(1), 100);
            }}
            keyExtractor={(record) => record._id}
            mobileCardRender={renderTimesheetMobileCard}
          />
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}
