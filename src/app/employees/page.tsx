'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Filter, Eye, Edit, Mail, Phone, Building, Briefcase, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import EmployeeDetailsModal from '@/components/employees/EmployeeDetailsModal';
import DynamicTable, { Column, PaginationInfo } from '@/components/ui/dynamic-table';

interface Employee {
  _id: string;
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  jobInfo: {
    department: string;
    designation: string;
    joiningDate: string;
    salary: number;
  };
  status: string;
}

export default function EmployeesPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]); // For getting unique departments/designations
  const [loading, setLoading] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
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
    employeeName: '',
    department: '',
    designation: '',
    startDate: '',
    endDate: '',
    limit: '10',
  });

  const fetchEmployees = useCallback(async (page = 1, currentFilters: typeof filters, currentUserEmployeeId?: string) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', currentFilters.limit || '10');
      
      if (currentFilters.employeeName) {
        queryParams.append('employeeName', currentFilters.employeeName);
      }
      if (currentFilters.department) {
        queryParams.append('department', currentFilters.department);
      }
      if (currentFilters.designation) {
        queryParams.append('designation', currentFilters.designation);
      }
      if (currentFilters.startDate) {
        queryParams.append('startDate', currentFilters.startDate);
      }
      if (currentFilters.endDate) {
        queryParams.append('endDate', currentFilters.endDate);
      }

      const response = await fetch(`/api/employees?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out the current user from the employee list
        const filteredEmployees = currentUserEmployeeId 
          ? data.employees.filter((emp: Employee) => emp.employeeId !== currentUserEmployeeId)
          : data.employees;
        
        setEmployees(filteredEmployees);
        if (data.pagination) {
          // Adjust pagination total if we filtered out the current user
          const adjustedTotal = currentUserEmployeeId && filteredEmployees.length < data.employees.length
            ? data.pagination.total - 1
            : data.pagination.total;
          setPagination({
            ...data.pagination,
            total: adjustedTotal,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch all employees once to get unique departments and designations
  const fetchAllEmployeesForFilters = useCallback(async () => {
    try {
      const response = await fetch('/api/employees?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out current user
        const filtered = user?.employeeId 
          ? data.employees.filter((emp: Employee) => emp.employeeId !== user.employeeId)
          : data.employees;
        setAllEmployees(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch all employees:', error);
    }
  }, [token, user?.employeeId]);

  useEffect(() => {
    if (token) {
      fetchEmployees(1, filters, user?.employeeId);
      fetchAllEmployeesForFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.employeeId]);

  const handlePageChange = (newPage: number) => {
    fetchEmployees(newPage, filters, user?.employeeId);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchEmployees(1, filters, user?.employeeId);
  };

  const clearFilters = () => {
    const clearedFilters = {
      employeeName: '',
      department: '',
      designation: '',
      startDate: '',
      endDate: '',
      limit: '10',
    };
    setFilters(clearedFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchEmployees(1, clearedFilters, user?.employeeId);
  };

  // Get unique departments
  const uniqueDepartments = Array.from(new Set(allEmployees.map(emp => emp.jobInfo.department))).sort();


  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailsModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    router.push(`/employees/add?id=${employee.employeeId}`);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  // Define columns for employee table
  const employeeColumns: Column<Employee>[] = [
    {
      key: 'employeeId',
      label: 'Employee ID',
      minWidth: '120px',
      render: (value) => (
        <span className="font-medium text-blue-600">{value}</span>
      ),
      mobileLabel: 'Employee ID',
    },
    {
      key: 'personalInfo',
      label: 'Name',
      minWidth: '180px',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {record.personalInfo.firstName.charAt(0)}
              {record.personalInfo.lastName.charAt(0)}
            </span>
          </div>
          <span className="font-medium">
            {record.personalInfo.firstName} {record.personalInfo.lastName}
          </span>
        </div>
      ),
      mobileLabel: 'Employee',
      mobileRender: (_, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {record.personalInfo.firstName.charAt(0)}
              {record.personalInfo.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-900 block">
              {record.personalInfo.firstName} {record.personalInfo.lastName}
            </span>
            <span className="text-xs text-gray-500">{record.employeeId}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'personalInfo.email',
      label: 'Email',
      minWidth: '200px',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{record.personalInfo.email}</span>
        </div>
      ),
      mobileLabel: 'Email',
      mobileRender: (_, record) => (
        <div className="flex items-center space-x-2">
          <Mail className="h-3 w-3 text-gray-400" />
          <span className="text-sm">{record.personalInfo.email}</span>
        </div>
      ),
    },
    {
      key: 'personalInfo.phone',
      label: 'Phone',
      minWidth: '130px',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{record.personalInfo.phone}</span>
        </div>
      ),
      mobileLabel: 'Phone',
      mobileRender: (_, record) => (
        <div className="flex items-center space-x-2">
          <Phone className="h-3 w-3 text-gray-400" />
          <span className="text-sm">{record.personalInfo.phone}</span>
        </div>
      ),
    },
    {
      key: 'jobInfo.department',
      label: 'Department',
      minWidth: '120px',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Building className="h-4 w-4 text-gray-400" />
          <span className="text-sm capitalize">{record.jobInfo.department}</span>
        </div>
      ),
      mobileLabel: 'Department',
      mobileRender: (_, record) => (
        <div className="flex items-center space-x-2">
          <Building className="h-3 w-3 text-gray-400" />
          <span className="text-sm capitalize">{record.jobInfo.department}</span>
        </div>
      ),
    },
    {
      key: 'jobInfo.designation',
      label: 'Designation',
      minWidth: '150px',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Briefcase className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{record.jobInfo.designation}</span>
        </div>
      ),
      mobileLabel: 'Designation',
      mobileRender: (_, record) => (
        <div className="flex items-center space-x-2">
          <Briefcase className="h-3 w-3 text-gray-400" />
          <span className="text-sm">{record.jobInfo.designation}</span>
        </div>
      ),
    },
    {
      key: 'jobInfo.joiningDate',
      label: 'Joining Date',
      minWidth: '120px',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{formatDate(record.jobInfo.joiningDate)}</span>
        </div>
      ),
      mobileLabel: 'Joining Date',
      mobileRender: (_, record) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span className="text-sm">{formatDate(record.jobInfo.joiningDate)}</span>
        </div>
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
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(record)}
            className="flex items-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>View</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditEmployee(record)}
            className="flex items-center space-x-1"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
        </div>
      ),
      mobileLabel: 'Actions',
      mobileRender: (_, record) => (
        <div className="flex items-center space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(record)}
            className="flex-1 flex items-center justify-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>View</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditEmployee(record)}
            className="flex-1 flex items-center justify-center space-x-1"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
        </div>
      ),
    },
  ];

  // Custom mobile card render for employees
  const renderEmployeeMobileCard = (record: Employee) => {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium">
                {record.personalInfo.firstName.charAt(0)}
                {record.personalInfo.lastName.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {record.personalInfo.firstName} {record.personalInfo.lastName}
              </p>
              <p className="text-xs text-gray-500">{record.employeeId}</p>
            </div>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
            {record.status}
          </span>
        </div>
        
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center space-x-2">
            <Mail className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-700">{record.personalInfo.email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-700">{record.personalInfo.phone}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Building className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-700 capitalize">{record.jobInfo.department}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Briefcase className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-700">{record.jobInfo.designation}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-700">Joined: {formatDate(record.jobInfo.joiningDate)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 pt-3 border-t mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(record)}
            className="flex-1 flex items-center justify-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>View</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditEmployee(record)}
            className="flex-1 flex items-center justify-center space-x-1"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
        </div>
      </div>
    );
  };

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  if (user.role !== 'admin' && user.role !== 'hr') {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-600">Manage your organization's employees</p>
          </div>
          <Button 
            onClick={() => router.push('/employees/add')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Add Employee</span>
          </Button>
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
                  <Label htmlFor="employeeName" className="text-sm font-medium text-gray-700">Employee Name</Label>
                  <Input
                    id="employeeName"
                    type="text"
                    placeholder="Enter employee name"
                    value={filters.employeeName}
                    onChange={(e) => handleFilterChange('employeeName', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-sm font-medium text-gray-700">Department</Label>
                  <Select
                    id="department"
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="w-full"
                  >
                    <option value="">All Departments</option>
                    {uniqueDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept.charAt(0).toUpperCase() + dept.slice(1)}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="designation" className="text-sm font-medium text-gray-700">Designation</Label>
                  <Input
                    id="designation"
                    type="text"
                    placeholder="Enter designation"
                    value={filters.designation}
                    onChange={(e) => handleFilterChange('designation', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">End Date</Label>
                  <Input
                    id="endDate"
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

        {/* Employees Table */}
          <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            {/* <CardDescription>
              Showing {employees.length} of {pagination.total} employees
              {pagination.total > 0 && (
                <span> (Page {pagination.page} of {pagination.pages})</span>
              )}
            </CardDescription> */}
          </CardHeader>
          <CardContent>
            <DynamicTable
              data={employees}
              columns={employeeColumns}
              loading={loading}
              emptyMessage="No employees found. Get started by adding your first employee."
              pagination={pagination}
              onPageChange={handlePageChange}
              recordsPerPage={filters.limit}
              onRecordsPerPageChange={(limit) => {
                handleFilterChange('limit', limit);
                setPagination((prev) => ({ ...prev, page: 1 }));
                setTimeout(() => {
                  const updatedFilters = { ...filters, limit };
                  fetchEmployees(1, updatedFilters, user?.employeeId);
                }, 100);
              }}
              keyExtractor={(record) => record._id}
              mobileCardRender={renderEmployeeMobileCard}
            />
            </CardContent>
          </Card>

        {/* Employee Details Modal */}
        <EmployeeDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          onEdit={() => {
            setIsDetailsModalOpen(false);
          }}
        />
      </div>
    </Layout>
  );
}
