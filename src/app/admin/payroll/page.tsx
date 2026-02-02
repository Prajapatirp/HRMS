'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { DollarSign, Download, Eye, Plus, Filter, Edit, CheckCircle2, X } from 'lucide-react';
import FilterDrawer from '@/components/ui/filter-drawer';
import { formatCurrency, formatDate } from '@/lib/utils';
import PayrollDetailsModal from '@/components/payroll/PayrollDetailsModal';
import { generatePayrollPDF } from '@/lib/pdfGenerator';
import DynamicTable, { Column } from '@/components/ui/dynamic-table';

interface PayrollRecord {
  _id: string;
  employeeId?: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: {
    housing: number;
    transport: number;
    medical: number;
    other: number;
  };
  deductions: {
    tax: number;
    insurance: number;
    loan: number;
    other: number;
  };
  overtime: number;
  bonus: number;
  netSalary: number;
  status: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Employee {
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function AdminPayrollPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateRecord, setStatusUpdateRecord] = useState<PayrollRecord | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [paidDate, setPaidDate] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({
    employeeId: '',
    employeeName: '',
    startDate: '',
    endDate: '',
    month: '',
    year: new Date().getFullYear().toString(),
    status: '',
    limit: '10'
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const fetchPayroll = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', filters.limit);
      if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
      if (filters.employeeName) queryParams.append('employeeName', filters.employeeName);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.month) queryParams.append('month', filters.month);
      if (filters.year) queryParams.append('year', filters.year);
      if (filters.status) queryParams.append('status', filters.status);

      const response = await fetch(`/api/payroll?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayroll(data.payroll);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        console.error('Failed to fetch payroll data');
      }
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  const fetchEmployees = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchPayroll(1);
      fetchEmployees();
    }
  }, [token, user, fetchPayroll, fetchEmployees]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPayroll(1);
    setFilterDrawerOpen(false);
  };

  const resetFilters = () => {
    setFilters({
      employeeId: '',
      employeeName: '',
      startDate: '',
      endDate: '',
      month: '',
      year: new Date().getFullYear().toString(),
      status: '',
      limit: '10'
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(() => fetchPayroll(1), 100);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.employeeId) count++;
    if (filters.employeeName) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.month) count++;
    if (filters.status) count++;
    if (filters.year && filters.year !== new Date().getFullYear().toString()) count++;
    return count;
  };

  const handlePageChange = (newPage: number) => {
    fetchPayroll(newPage);
  };


  const handleViewDetails = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedPayroll(null);
  };

  const handleDownloadPDF = (record: PayrollRecord | any) => {
    generatePayrollPDF(record, user?.email);
  };

  const handleStatusClick = (record: PayrollRecord) => {
    setStatusUpdateRecord(record);
    setNewStatus(record.status);
    // Set paid date if exists, or if status is 'paid' set today's date
    if (record.paidAt) {
      setPaidDate(new Date(record.paidAt).toISOString().split('T')[0]);
    } else if (record.status === 'paid') {
      setPaidDate(new Date().toISOString().split('T')[0]);
    } else {
      setPaidDate('');
    }
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdateRecord) return;

    try {
      setUpdatingStatus(true);
      const updateData: any = { status: newStatus };
      if (newStatus === 'paid' && paidDate) {
        updateData.paidDate = paidDate;
      } else if (newStatus === 'paid' && !paidDate) {
        // Use today's date if not provided
        updateData.paidDate = new Date().toISOString().split('T')[0];
      }

      const response = await fetch(`/api/payroll/${statusUpdateRecord._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setShowStatusModal(false);
        setStatusUpdateRecord(null);
        // Refresh the payroll list
        fetchPayroll(pagination.page);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'processed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmployeeName = (employeeId: string | undefined) => {
    if (!employeeId) return 'Unknown Employee';
    const employee = employees.find(emp => emp.employeeId === employeeId);
    return employee ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}` : employeeId;
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const payrollColumns: Column<PayrollRecord>[] = [
    {
      key: 'employeeId',
      label: 'Employee',
      minWidth: '150px',
      render: (value) => (
        <span className="font-medium">{getEmployeeName(value)}</span>
      ),
      mobileLabel: 'Employee',
    },
    {
      key: 'month',
      label: 'Period',
      minWidth: '120px',
      render: (value, record) => (
        <span>{getMonthName(record.month)} {record.year}</span>
      ),
      mobileLabel: 'Period',
    },
    {
      key: 'netSalary',
      label: 'Net Salary',
      minWidth: '120px',
      render: (value) => (
        <span className="font-semibold text-green-600">{formatCurrency(value)}</span>
      ),
      mobileLabel: 'Net Salary',
    },
    {
      key: 'status',
      label: 'Status',
      minWidth: '100px',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
      mobileLabel: 'Status',
    },
    {
      key: 'paidAt',
      label: 'Paid Date',
      minWidth: '120px',
      render: (value) => value ? (
        <span>{formatDate(value)}</span>
      ) : <span className="text-gray-400">-</span>,
      mobileLabel: 'Paid Date',
    },
    {
      key: 'actions',
      label: 'Actions',
      minWidth: '160px',
      render: (_, record) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleStatusClick(record)}
            className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="Update Status"
          >
            <CheckCircle2 className="h-4 w-4 text-gray-700" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="px-2 py-1 text-xs text-white bg-black rounded">
                Update Status
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black"></div>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push(`/admin/payroll/add?id=${record._id}`)}
            className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="Edit Payroll"
          >
            <Edit className="h-4 w-4 text-gray-700" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="px-2 py-1 text-xs text-white bg-black rounded">
                Edit Payroll
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black"></div>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleViewDetails(record)}
            className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4 text-gray-700" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="px-2 py-1 text-xs text-white bg-black rounded">
                View Details
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black"></div>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleDownloadPDF(record)}
            className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="Download PDF"
          >
            <Download className="h-4 w-4 text-gray-700" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="px-2 py-1 text-xs text-white bg-black rounded">
                Download PDF
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black"></div>
              </div>
            </div>
          </button>
        </div>
      ),
      mobileLabel: 'Actions',
      hideOnMobile: true,
    },
  ];

  const renderPayrollMobileCard = (record: PayrollRecord) => {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="mb-3 pb-3 border-b">
          <p className="text-xs text-gray-500 mb-1">Employee</p>
          <p className="text-sm font-medium text-gray-900">{getEmployeeName(record.employeeId)}</p>
        </div>
        <div className="mb-3 pb-3 border-b">
          <p className="text-xs text-gray-500 mb-1">Period</p>
          <p className="text-sm text-gray-900">{getMonthName(record.month)} {record.year}</p>
        </div>
        <div className="mb-3 pb-3 border-b">
          <p className="text-xs text-gray-500 mb-1">Net Salary</p>
          <p className="text-sm font-semibold text-green-600">{formatCurrency(record.netSalary)}</p>
        </div>
        <div className="mb-3 pb-3 border-b">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
            {record.status}
          </span>
        </div>
        {record.paidAt && (
          <div className="mb-3 pb-3 border-b">
            <p className="text-xs text-gray-500 mb-1">Paid Date</p>
            <p className="text-sm text-gray-900">{formatDate(record.paidAt)}</p>
          </div>
        )}
        <div className="flex space-x-2 mt-3">
          <button
            onClick={() => handleStatusClick(record)}
            className="flex-1 relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="Update Status"
          >
            <CheckCircle2 className="h-4 w-4 text-gray-700" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="px-2 py-1 text-xs text-white bg-black rounded">
                Update Status
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black"></div>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleViewDetails(record)}
            className="flex-1 relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4 text-gray-700" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="px-2 py-1 text-xs text-white bg-black rounded">
                View Details
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black"></div>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleDownloadPDF(record)}
            className="flex-1 relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="Download PDF"
          >
            <Download className="h-4 w-4 text-gray-700" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="px-2 py-1 text-xs text-white bg-black rounded">
                Download PDF
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black"></div>
              </div>
            </div>
          </button>
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
            <h1 className="text-3xl font-bold text-gray-900">Admin - Payroll Management</h1>
            <p className="text-gray-600">Manage all employees&apos; payroll records</p>
          </div>
          <Button 
            onClick={() => router.push('/admin/payroll/add')}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Payroll</span>
          </Button>
        </div>

        {/* Payroll Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payroll.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(payroll.filter(p => p.status === 'paid').reduce((sum, record) => sum + record.netSalary, 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(payroll.filter(p => p.status === 'pending').reduce((sum, record) => sum + record.netSalary, 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(payroll.length > 0 ? payroll.reduce((sum, record) => sum + record.netSalary, 0) / payroll.length : 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="relative flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs font-medium rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>

        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          title="Filters"
          activeFilterCount={getActiveFilterCount()}
          onApply={applyFilters}
          onReset={resetFilters}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="employeeName" className="text-gray-700 mb-1">Employee Name</Label>
              <Input
                id="employeeName"
                type="text"
                value={filters.employeeName}
                onChange={(e) => handleFilterChange('employeeName', e.target.value)}
                placeholder="Enter employee name"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="employee" className="text-gray-700 mb-1">Employee (ID)</Label>
              <Select
                id="employee"
                value={filters.employeeId}
                onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                className="w-full"
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
              <Label htmlFor="startDate" className="text-gray-700 mb-1">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="endDate" className="text-gray-700 mb-1">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="month" className="text-gray-700 mb-1">Month</Label>
              <Select
                id="month"
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="w-full"
              >
                <option value="">All months</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  return (
                    <option key={month} value={month.toString()}>
                      {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div>
              <Label htmlFor="year" className="text-gray-700 mb-1">Year</Label>
              <Input
                id="year"
                type="number"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                placeholder="2024"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-gray-700 mb-1">Status</Label>
              <Select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
                <option value="paid">Paid</option>
              </Select>
            </div>
          </div>
        </FilterDrawer>

        {/* Payroll Records */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Records</CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicTable
              data={payroll}
              columns={payrollColumns}
              loading={loading}
              emptyMessage="No payroll records found for the selected filters."
              pagination={pagination}
              onPageChange={handlePageChange}
              recordsPerPage={filters.limit}
              onRecordsPerPageChange={(limit) => {
                handleFilterChange('limit', limit);
                setPagination((prev) => ({ ...prev, page: 1 }));
                setTimeout(() => fetchPayroll(1), 100);
              }}
              keyExtractor={(record) => record._id}
              mobileCardRender={renderPayrollMobileCard}
            />
          </CardContent>
        </Card>

        {/* Payroll Details Modal */}
        <PayrollDetailsModal
          isOpen={showDetailsModal}
          onClose={handleCloseDetails}
          payroll={selectedPayroll}
          onDownloadPDF={handleDownloadPDF}
          employeeName={selectedPayroll ? getEmployeeName(selectedPayroll.employeeId) : undefined}
        />

        {/* Status Update Modal */}
        {showStatusModal && statusUpdateRecord && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => {
            if (!updatingStatus) {
              setShowStatusModal(false);
              setStatusUpdateRecord(null);
            }
          }}>
            <Card className="w-full max-w-md mx-4 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="relative pb-4">
                <button
                  onClick={() => {
                    if (!updatingStatus) {
                      setShowStatusModal(false);
                      setStatusUpdateRecord(null);
                    }
                  }}
                  disabled={updatingStatus}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
                <CardTitle className="pr-8">Update Payroll Status</CardTitle>
                <CardDescription className="pr-8">
                  {getEmployeeName(statusUpdateRecord.employeeId)} - {getMonthName(statusUpdateRecord.month)} {statusUpdateRecord.year}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="statusSelect">Status</Label>
                  <Select
                    id="statusSelect"
                    value={newStatus}
                    onChange={(e) => {
                      setNewStatus(e.target.value);
                      // Clear paid date if status changes away from 'paid'
                      if (e.target.value !== 'paid') {
                        setPaidDate('');
                      } else if (!paidDate) {
                        // Set today's date if changing to 'paid' and no date set
                        setPaidDate(new Date().toISOString().split('T')[0]);
                      }
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="processed">Processed</option>
                    <option value="paid">Paid</option>
                  </Select>
                </div>
                {newStatus === 'paid' && (
                  <div>
                    <Label htmlFor="paidDateInput">Paid Date</Label>
                    <Input
                      id="paidDateInput"
                      type="date"
                      value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {!paidDate && (
                      <p className="text-xs text-gray-500 mt-1">Will use today's date if left empty</p>
                    )}
                  </div>
                )}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={updatingStatus}
                    className="min-w-[120px]"
                  >
                    {updatingStatus ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
