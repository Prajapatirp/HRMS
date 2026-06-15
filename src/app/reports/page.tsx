'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { BarChart3, Download, FileSpreadsheet } from 'lucide-react';

interface EmployeeOption {
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
  };
}

export default function ReportsPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  const fetchEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      const response = await fetch('/api/employees?limit=1000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      } else {
        showToast('Failed to load employee list', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      showToast('Failed to load employee list', 'error');
    } finally {
      setLoadingEmployees(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    if (token && user && user.role !== 'employee') {
      fetchEmployees();
    }
  }, [token, user, fetchEmployees]);

  const exportAttendanceExcel = async () => {
    try {
      setExporting(true);

      const params = new URLSearchParams({ period: selectedPeriod });
      if (selectedEmployee) {
        params.set('employeeId', selectedEmployee);
      }

      const response = await fetch(`/api/reports/attendance?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        showToast(errorData?.error || 'Failed to generate attendance report', 'error');
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `attendance-report-${new Date().toISOString().split('T')[0]}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Attendance report downloaded successfully', 'success');
    } catch (error) {
      console.error('Failed to export attendance report:', error);
      showToast('Failed to generate attendance report', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  if (user.role === 'employee') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                <BarChart3 className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Reports & Analytics</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                This feature is currently under development and will be available soon.
              </p>
            </div>

            <div className="space-y-4">
              <Button onClick={() => window.history.back()} variant="outline" className="w-full">
                Go Back
              </Button>
              <Button onClick={() => (window.location.href = '/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate attendance reports with monthly summaries and location details.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Report</CardTitle>
            <CardDescription>
              Export attendance data as Excel. Leave employee blank to include all employees.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Type
                </label>
                <Select value="attendance" disabled className="w-full">
                  <option value="attendance">Attendance Report</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Period
                </label>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full"
                >
                  <option value="current-month">Current Month</option>
                  <option value="last-month">Last Month</option>
                  <option value="current-quarter">Current Quarter</option>
                  <option value="current-year">Current Year</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Employee
                </label>
                <Select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full"
                  disabled={loadingEmployees}
                >
                  <option value="">All Employees</option>
                  {employees.map((employee) => (
                    <option key={employee.employeeId} value={employee.employeeId}>
                      {employee.personalInfo.firstName} {employee.personalInfo.lastName} ({employee.employeeId})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={exportAttendanceExcel}
                disabled={exporting || loadingEmployees}
                className="flex items-center space-x-2"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Generating Excel...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Generate Excel</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Excel Contents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Attendance Report sheet</p>
              <p>
                Daily records matching the attendance history table: date, employee, status, check-in/out times,
                log-in and log-out latitude-longitude, total hours, overtime, and notes.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Monthly Summary sheet</p>
              <p>
                Employee name, employee ID, present days, absent days, late days, half days, holidays, and total
                records for the selected period.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
