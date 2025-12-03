'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, MapPin, Calendar, DollarSign, Building, Briefcase, Clock, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import DynamicTable, { Column, PaginationInfo } from '@/components/ui/dynamic-table';
import DynamicModal from '@/components/ui/dynamic-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface Employee {
  _id: string;
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  jobInfo: {
    department: string;
    designation: string;
    employmentType: string;
    joiningDate: string;
    salary: number;
    workLocation: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
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
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  rejectionReason?: string;
}

interface Project {
  _id: string;
  name: string;
}

interface EmployeeForFilter {
  _id: string;
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
  };
}

interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null | any;
  onEdit: () => void;
}

export default function EmployeeDetailsModal({ isOpen, onClose, employee, onEdit }: EmployeeDetailsModalProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<EmployeeForFilter[]>([]);
  const [loading, setLoading] = useState(false);
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
    projectId: '',
    startDate: '',
    endDate: '',
    limit: '10',
  });

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

  const fetchTimesheets = useCallback(async (page = 1) => {
    if (!employee || !token) return;
    
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', filters.limit || '10');
      
      // Default to current employee if no filter is set
      const employeeIdToUse = filters.employeeId || employee.employeeId;
      queryParams.append('employeeId', employeeIdToUse);
      
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
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    } finally {
      setLoading(false);
    }
  }, [employee, token, filters]);

  useEffect(() => {
    if (isOpen && employee && token) {
      fetchProjects();
      fetchEmployees();
      // Reset filters to default (current employee)
      setFilters({
        employeeId: '',
        projectId: '',
        startDate: '',
        endDate: '',
        limit: '10',
      });
      fetchTimesheets(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employee, token]);

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
    setTimeout(() => fetchTimesheets(1), 100);
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
  ];

  const renderTimesheetMobileCard = (record: Timesheet) => {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-gray-900">
              {new Date(record.timesheetDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">{record.employeeName}</p>
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
          {record.rejectionReason && (
            <div className="pt-2">
              <p className="text-xs text-red-600">Rejected: {record.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleEdit = () => {
    onClose();
    onEdit();
    router.push(`/employees/add?id=${employee.employeeId}`);
  };

  if (!isOpen || !employee) return null;

  return (
    <DynamicModal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Details"
      maxWidth="max-w-4xl"
      footer={
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Edit Employee
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
          {/* Employee Header */}
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {employee.personalInfo.firstName.charAt(0)}
                {employee.personalInfo.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {employee.personalInfo.firstName} {employee.personalInfo.lastName}
              </h3>
              <p className="text-gray-600">{employee.employeeId}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                employee.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {employee.status}
              </span>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <p className="text-gray-900">{employee.personalInfo.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <p className="text-gray-900">{employee.personalInfo.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {employee.personalInfo.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {employee.personalInfo.phone}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(employee.personalInfo.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <p className="text-gray-900 capitalize">{employee.personalInfo.gender}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Address
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900">{employee.personalInfo.address.street}</p>
              <p className="text-gray-900">
                {employee.personalInfo.address.city}, {employee.personalInfo.address.state} {employee.personalInfo.address.zipCode}
              </p>
              <p className="text-gray-900">{employee.personalInfo.address.country}</p>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{employee.personalInfo.emergencyContact.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Relationship</label>
                <p className="text-gray-900">{employee.personalInfo.emergencyContact.relationship}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900">{employee.personalInfo.emergencyContact.phone}</p>
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Job Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="text-gray-900 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    {employee.jobInfo.department}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Designation</label>
                  <p className="text-gray-900">{employee.jobInfo.designation}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                  <p className="text-gray-900 capitalize">{employee.jobInfo.employmentType}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(employee.jobInfo.joiningDate)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Salary</label>
                  <p className="text-gray-900 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    ${employee.jobInfo.salary.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Location</label>
                  <p className="text-gray-900">{employee.jobInfo.workLocation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="text-gray-900">{formatDate(employee.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-gray-900">{formatDate(employee.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Timesheets Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Timesheets
            </h3>
            
            {/* Filters */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="employeeFilter">Employee</Label>
                    <Select
                      id="employeeFilter"
                      value={filters.employeeId}
                      onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                    >
                      <option value="">Current Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.personalInfo.firstName} {emp.personalInfo.lastName}
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
                  <Button onClick={applyFilters} size="sm" className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span>Apply Filters</span>
                  </Button>
                  <Button 
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Timesheets Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timesheet Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicTable
                  data={timesheets}
                  columns={timesheetColumns}
                  loading={loading}
                  emptyMessage="No timesheets found for this employee."
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  keyExtractor={(record) => record._id}
                  mobileCardRender={renderTimesheetMobileCard}
                />
              </CardContent>
            </Card>
          </div>

      </div>
    </DynamicModal>
  );
}
