'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';

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

export default function TimesheetsPage() {
  const { user, loading: authLoading } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  
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
    projectId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchProjects();
      fetchTimesheets();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchTimesheets();
    }
  }, [filters, authLoading, user]);

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

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }
      
      const queryParams = new URLSearchParams();
      
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
        fetchTimesheets();
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
        fetchTimesheets();
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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/timesheets/${timesheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'submitted' }),
      });

      if (response.ok) {
        fetchTimesheets();
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
      setFormData(prev => ({
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
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => setFilters({ projectId: '', startDate: '', endDate: '' })}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
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
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Timesheet Entries</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : timesheets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No timesheets found. Create your first timesheet entry.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Task Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.map((timesheet) => (
                <TableRow key={timesheet._id}>
                  <TableCell>
                    {new Date(timesheet.timesheetDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {timesheet.projectName}
                  </TableCell>
                  <TableCell>
                    {timesheet.hours}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {timesheet.taskDetails}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(timesheet.status)}`}>
                      {timesheet.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {timesheet.status === 'draft' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(timesheet)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSubmitTimesheet(timesheet._id)}
                          >
                            Submit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(timesheet._id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {timesheet.status === 'rejected' && timesheet.rejectionReason && (
                        <div className="text-xs text-red-600">
                          {timesheet.rejectionReason}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      </div>
    </Layout>
  );
}
