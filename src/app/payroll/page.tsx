'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Download, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import PayrollDetailsModal from '@/components/payroll/PayrollDetailsModal';
import { generatePayrollPDF } from '@/lib/pdfGenerator';
import DynamicTable, { Column } from '@/components/ui/dynamic-table';

interface PayrollRecord {
  _id: string;
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
}

export default function PayrollPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    limit: '10'
  });

  const fetchPayroll = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', filters.limit);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

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
      }
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    if (token) {
      fetchPayroll(1);
    }
  }, [token, fetchPayroll]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPayroll(1);
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

  const handleDownloadPDF = (record: PayrollRecord) => {
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

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const payrollColumns: Column<PayrollRecord>[] = [
    {
      key: 'month',
      label: 'Period',
      minWidth: '120px',
      render: (value, record) => (
        <span className="font-medium">{getMonthName(record.month)} {record.year}</span>
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
      minWidth: '150px',
      render: (_, record) => (
        <div className="flex space-x-2">
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
            onClick={() => handleDownloadPDF(record)}
            className="flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </Button>
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
          <p className="text-xs text-gray-500 mb-1">Period</p>
          <p className="text-sm font-medium text-gray-900">{getMonthName(record.month)} {record.year}</p>
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
            onClick={() => handleDownloadPDF(record)}
            className="flex-1 flex items-center justify-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </Button>
        </div>
      </div>
    );
  };

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
            <p className="text-gray-600">View your salary details and payment history</p>
          </div>
          {user.role === 'admin' || user.role === 'hr' ? (
            <Button 
              onClick={() => router.push('/admin/payroll/add')}
              className="flex items-center space-x-2"
            >
              <DollarSign className="h-4 w-4" />
              <span>Create Payroll</span>
            </Button>
          ) : null}
        </div>

        {/* Payroll Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(payroll.reduce((sum, record) => sum + record.netSalary, 0))}
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
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <Button onClick={applyFilters} className="flex items-center space-x-2">
                <span>Apply Filters</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Records */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll History</CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicTable
              data={payroll}
              columns={payrollColumns}
              loading={loading}
              emptyMessage="No payroll records found for your account."
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
        />
      </div>
    </Layout>
  );
}
