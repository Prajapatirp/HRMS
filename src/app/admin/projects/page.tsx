'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import DynamicTable, { Column, PaginationInfo } from '@/components/ui/dynamic-table';
import DynamicModal from '@/components/ui/dynamic-modal';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const validationSchema = Yup.object({
  name: Yup.string()
    .required('Project name is required')
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name must be less than 100 characters'),
  status: Yup.string()
    .required('Status is required')
    .oneOf(['active', 'inactive', 'completed'], 'Invalid status'),
  startDate: Yup.string()
    .nullable()
    .test('date-format', 'Invalid date format', function(value) {
      if (!value) return true; // Optional field
      return !isNaN(Date.parse(value));
    }),
  endDate: Yup.string()
    .nullable()
    .test('date-format', 'Invalid date format', function(value) {
      if (!value) return true; // Optional field
      return !isNaN(Date.parse(value));
    })
    .test('end-after-start', 'End date must be after start date', function(value) {
      const { startDate } = this.parent;
      if (!value || !startDate) return true; // Both optional
      return new Date(value) >= new Date(startDate);
    }),
  description: Yup.string()
    .max(500, 'Description must be less than 500 characters'),
});

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'completed';
  startDate?: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
    projectName: '',
    status: '',
    startDate: '',
    endDate: '',
    limit: '10',
  });

  // Formik form
  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      status: 'active' as 'active' | 'inactive' | 'completed',
      startDate: '',
      endDate: '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setSubmitting(true);

      try {
        if (!token) return;
        const url = editingProject 
          ? `/api/projects/${editingProject._id}`
          : '/api/projects';
        
        const method = editingProject ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        });

        if (response.ok) {
          alert(editingProject ? 'Project updated successfully!' : 'Project created successfully!');
          setShowForm(false);
          setEditingProject(null);
          formik.resetForm();
          fetchProjects(pagination.page);
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to save project');
        }
      } catch (error) {
        console.error('Error saving project:', error);
        alert('Failed to save project. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (token) {
      fetchProjects(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchProjects = useCallback(async (page: number = 1, currentFilters = filters) => {
    try {
      if (!token) return;
      setLoading(true);

      const params = new URLSearchParams();
      if (currentFilters.projectName) params.append('projectName', currentFilters.projectName);
      if (currentFilters.status) params.append('status', currentFilters.status);
      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);
      params.append('page', page.toString());
      params.append('limit', currentFilters.limit);

      const response = await fetch(`/api/projects?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        setPagination(data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false,
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('Failed to fetch projects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  const handlePageChange = (page: number) => {
    fetchProjects(page);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProjects(1, filters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      projectName: '',
      status: '',
      startDate: '',
      endDate: '',
      limit: '10',
    };
    setFilters(clearedFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(() => {
      fetchProjects(1, clearedFilters);
    }, 100);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    formik.setValues({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (projectId: string) => {
    const project = projects.find(p => p._id === projectId);
    const projectName = project?.name || 'this project';
    
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) return;

    try {
      if (!token) return;
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Project deleted successfully!');
        fetchProjects(pagination.page);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Define columns for project table
  const projectColumns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Project Name',
      minWidth: '200px',
      render: (value) => (
        <span className="font-medium">{value}</span>
      ),
      mobileLabel: 'Project Name',
    },
    {
      key: 'description',
      label: 'Description',
      minWidth: '250px',
      render: (value) => (
        <span className="text-gray-600">{value || '-'}</span>
      ),
      mobileLabel: 'Description',
      hideOnMobile: true,
    },
    {
      key: 'status',
      label: 'Status',
      minWidth: '120px',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
      mobileLabel: 'Status',
    },
    {
      key: 'startDate',
      label: 'Start Date',
      minWidth: '120px',
      render: (value) => (
        value ? new Date(value).toLocaleDateString() : '-'
      ),
      mobileLabel: 'Start Date',
    },
    {
      key: 'endDate',
      label: 'End Date',
      minWidth: '120px',
      render: (value) => (
        value ? new Date(value).toLocaleDateString() : '-'
      ),
      mobileLabel: 'End Date',
    },
    {
      key: 'createdAt',
      label: 'Created',
      minWidth: '120px',
      render: (value) => (
        new Date(value).toLocaleDateString()
      ),
      mobileLabel: 'Created',
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
            onClick={() => handleEdit(record)}
            className="flex items-center space-x-1"
          >
            <Edit className="h-3 w-3" />
            <span>Edit</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(record._id)}
            className="text-red-600 hover:text-red-700 flex items-center space-x-1"
          >
            <Trash2 className="h-3 w-3" />
            <span>Delete</span>
          </Button>
        </div>
      ),
      mobileLabel: 'Actions',
      mobileRender: (_, record) => (
        <div className="flex flex-col space-y-2 pt-2">
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
            onClick={() => handleDelete(record._id)}
            className="w-full text-red-600 hover:text-red-700 flex items-center justify-center space-x-1"
          >
            <Trash2 className="h-3 w-3" />
            <span>Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  // Mobile card render for projects
  const renderProjectMobileCard = (project: Project) => {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="mb-3 pb-3 border-b">
          <p className="text-xs text-gray-500 mb-1">Project Name</p>
          <div className="text-sm font-medium text-gray-900">{project.name}</div>
        </div>
        <div className="mb-3 pb-3 border-b">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <div className="text-sm text-gray-900">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
        </div>
        <div className="mb-3 pb-3 border-b">
          <p className="text-xs text-gray-500 mb-1">Start Date</p>
          <div className="text-sm text-gray-900">
            {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
          </div>
        </div>
        <div className="mb-3 pb-3 border-b">
          <p className="text-xs text-gray-500 mb-1">End Date</p>
          <div className="text-sm text-gray-900">
            {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
          </div>
        </div>
        <div className="pt-2">
          <div className="flex flex-col space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(project)}
              className="w-full flex items-center justify-center space-x-1"
            >
              <Edit className="h-3 w-3" />
              <span>Edit</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(project._id)}
              className="w-full text-red-600 hover:text-red-700 flex items-center justify-center space-x-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
            <p className="text-gray-600 mt-1">Create and manage projects for timesheet tracking</p>
          </div>
          <Button
            onClick={() => {
              formik.resetForm();
              setEditingProject(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </div>

        {/* Project Form Modal */}
        <DynamicModal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingProject(null);
            formik.resetForm();
          }}
          title={editingProject ? 'Edit Project' : 'Add New Project'}
          maxWidth="max-w-2xl"
          footer={
            <div className="flex gap-2">
              <Button
                onClick={() => formik.handleSubmit()}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingProject ? 'Update' : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingProject(null);
                  formik.resetForm();
                }}
                className="text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
              >
                Cancel
              </Button>
            </div>
          }
        >
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter project name"
                  className={`text-gray-900 ${
                    formik.touched.name && formik.errors.name
                      ? 'border-red-500'
                      : ''
                  }`}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="mt-1 text-xs text-red-600">{formik.errors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="status"
                  name="status"
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`text-gray-900 ${
                    formik.touched.status && formik.errors.status
                      ? 'border-red-500'
                      : ''
                  }`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </Select>
                {formik.touched.status && formik.errors.status && (
                  <p className="mt-1 text-xs text-red-600">{formik.errors.status}</p>
                )}
              </div>
              <div>
                <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date (Optional)
                </Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formik.values.startDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Select start date"
                  className={`text-gray-900 ${
                    formik.touched.startDate && formik.errors.startDate
                      ? 'border-red-500'
                      : ''
                  }`}
                />
                {formik.touched.startDate && formik.errors.startDate && (
                  <p className="mt-1 text-xs text-red-600">{formik.errors.startDate}</p>
                )}
              </div>
              <div>
                <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formik.values.endDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Select end date"
                  className={`text-gray-900 ${
                    formik.touched.endDate && formik.errors.endDate
                      ? 'border-red-500'
                      : ''
                  }`}
                />
                {formik.touched.endDate && formik.errors.endDate && (
                  <p className="mt-1 text-xs text-red-600">{formik.errors.endDate}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </Label>
              <textarea
                id="description"
                name="description"
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 ${
                  formik.touched.description && formik.errors.description
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                rows={3}
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Describe the project..."
              />
              {formik.touched.description && formik.errors.description && (
                <p className="mt-1 text-xs text-red-600">{formik.errors.description}</p>
              )}
            </div>
          </form>
        </DynamicModal>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="projectNameFilter">Project Name</Label>
                <Input
                  id="projectNameFilter"
                  type="text"
                  placeholder="Search project name..."
                  value={filters.projectName}
                  onChange={(e) => handleFilterChange('projectName', e.target.value)}
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDateFilter">Start Date</Label>
                <Input
                  id="startDateFilter"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDateFilter">End Date</Label>
                <Input
                  id="endDateFilter"
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

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              Showing {projects.length} of {pagination.total} projects
              {pagination.total > 0 && (
                <span> (Page {pagination.page} of {pagination.pages})</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicTable
              data={projects}
              columns={projectColumns}
              loading={loading}
              emptyMessage="No projects found matching the current filters."
              pagination={pagination}
              onPageChange={handlePageChange}
              recordsPerPage={filters.limit}
              onRecordsPerPageChange={(limit) => {
                handleFilterChange('limit', limit);
                setPagination((prev) => ({ ...prev, page: 1 }));
                setTimeout(() => fetchProjects(1, { ...filters, limit }), 100);
              }}
              keyExtractor={(record) => record._id}
              mobileCardRender={renderProjectMobileCard}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
