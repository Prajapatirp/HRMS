'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { DollarSign, Download, Eye, Plus, Search, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import ManualPayrollModal from '@/components/payroll/ManualPayrollModal';
import PayrollDetailsModal from '@/components/payroll/PayrollDetailsModal';
import { generatePayrollPDF } from '@/lib/pdfGenerator';

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
  const { user, token } = useAuth();
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [filters, setFilters] = useState({
    employeeId: '',
    month: '',
    year: new Date().getFullYear().toString(),
    status: ''
  });

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchPayroll();
      fetchEmployees();
    }
  }, [token, user]);

  const fetchPayroll = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
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
      } else {
        console.error('Failed to fetch payroll data');
      }
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
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
    setFilters((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setLoading(true);
    fetchPayroll();
  };

  const handleManualSuccess = () => {
    fetchPayroll(); // Refresh the payroll list
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

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  if (user.role !== 'admin') {
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
            onClick={() => setShowManualModal(true)}
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Label htmlFor="month">Month</Label>
                <Select
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
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
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  placeholder="2024"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processed">Processed</option>
                  <option value="paid">Paid</option>
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

        {/* Payroll Records */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Records</CardTitle>
            <CardDescription>
              Showing {payroll.length} payroll records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {payroll.map((record: any) => (
                  <div key={record._id} className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {getEmployeeName(record.employeeId)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {getMonthName(record.month)} {record.year}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(record.netSalary)}
                        </div>
                        {record.paidAt && (
                          <p className="text-sm text-gray-600">
                            Paid on {formatDate(record.paidAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Earnings */}
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">Earnings</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Basic Salary:</span>
                            <span>{formatCurrency(record.basicSalary)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Housing Allowance:</span>
                            <span>{formatCurrency(record.allowances.housing)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Transport Allowance:</span>
                            <span>{formatCurrency(record.allowances.transport)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Medical Allowance:</span>
                            <span>{formatCurrency(record.allowances.medical)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Overtime:</span>
                            <span>{formatCurrency(record.overtime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bonus:</span>
                            <span>{formatCurrency(record.bonus)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Deductions</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>{formatCurrency(record.deductions.tax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Insurance:</span>
                            <span>{formatCurrency(record.deductions.insurance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Loan:</span>
                            <span>{formatCurrency(record.deductions.loan)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Other:</span>
                            <span>{formatCurrency(record.deductions.other)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center space-x-1"
                        onClick={() => handleViewDetails(record)}
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center space-x-1"
                        onClick={() => handleDownloadPDF(record)}
                      >
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {payroll.length === 0 && !loading && (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payroll records</h3>
                <p className="text-gray-600">No payroll records found for the selected filters.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Payroll Modal */}
        <ManualPayrollModal
          isOpen={showManualModal}
          onClose={() => setShowManualModal(false)}
          onSuccess={handleManualSuccess}
        />

        {/* Payroll Details Modal */}
        <PayrollDetailsModal
          isOpen={showDetailsModal}
          onClose={handleCloseDetails}
          payroll={selectedPayroll}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>
    </Layout>
  );
}
