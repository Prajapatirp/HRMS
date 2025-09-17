'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, FileText, Users, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ReportData {
  totalEmployees: number;
  newEmployees: number;
  departmentStats: Array<{ _id: string; count: number }>;
  attendanceStats: Array<{ _id: string; count: number }>;
  leaveStats: Array<{ _id: string; count: number }>;
  payrollStats: Array<{ _id: string; count: number; totalAmount: number }>;
}

export default function ReportsPage() {
  const { user, token } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  const fetchReportData = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      
      const currentDate = new Date();
      let month = currentDate.getMonth() + 1;
      let year = currentDate.getFullYear();
      
      // Adjust date based on selected period
      switch (selectedPeriod) {
        case 'last-month':
          month = month === 1 ? 12 : month - 1;
          year = month === 12 ? year - 1 : year;
          break;
        case 'current-quarter':
          month = Math.floor((month - 1) / 3) * 3 + 1; // First month of quarter
          break;
        case 'current-year':
          month = 1; // January
          break;
        default:
          // current-month - use current month
          break;
      }
      
      const response = await fetch(`/api/dashboard/stats?month=${month}&year=${year}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data.stats);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load report data');
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, selectedPeriod]);

  useEffect(() => {
    if (token) {
      fetchReportData();
    }
  }, [token, fetchReportData]);

  const generateReport = () => {
    if (!reportData) {
      alert('No data available to generate report. Please wait for data to load.');
      return;
    }
    
    // Generate a simple text report
    const reportContent = `
HR Report - ${selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report
Period: ${selectedPeriod.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
Generated: ${new Date().toLocaleDateString()}

SUMMARY:
- Total Employees: ${reportData.totalEmployees}
- New Employees: ${reportData.newEmployees}
- Attendance Rate: ${reportData.attendanceStats ? 
  Math.round((reportData.attendanceStats.find(s => s._id === 'present')?.count || 0) / 
  (reportData.attendanceStats.reduce((sum, s) => sum + s.count, 0) || 1) * 100) : 0}%
- Pending Leaves: ${reportData.leaveStats.find(s => s._id === 'pending')?.count || 0}
- Total Payroll: ${formatCurrency(reportData.payrollStats.reduce((sum, s) => sum + s.totalAmount, 0))}

DEPARTMENT DISTRIBUTION:
${reportData.departmentStats.map(dept => `- ${dept._id}: ${dept.count} employees`).join('\n')}

ATTENDANCE BREAKDOWN:
${reportData.attendanceStats.map(status => `- ${status._id}: ${status.count}`).join('\n')}
    `;
    
    // Create and download the report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hr-report-${selectedReport}-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (!reportData) {
      alert('No data available to export. Please wait for data to load.');
      return;
    }
    alert('PDF export feature would be implemented here with a proper PDF library like jsPDF or Puppeteer.');
  };

  const exportToExcel = () => {
    if (!reportData) {
      alert('No data available to export. Please wait for data to load.');
      return;
    }
    alert('Excel export feature would be implemented here with a library like SheetJS.');
  };

  const exportToCSV = () => {
    if (!reportData) {
      alert('No data available to export. Please wait for data to load.');
      return;
    }
    
    // Generate CSV for department stats
    const csvContent = [
      ['Department', 'Employee Count'],
      ...reportData.departmentStats.map(dept => [dept._id, dept.count])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `department-stats-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Generate comprehensive HR reports and analytics</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading reports</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchReportData}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Generate comprehensive HR reports and analytics</p>
          </div>
        </div>

        {/* Report Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="overview">Overview Report</option>
                  <option value="attendance">Attendance Report</option>
                  <option value="payroll">Payroll Report</option>
                  <option value="performance">Performance Report</option>
                  <option value="leave">Leave Report</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="current-month">Current Month</option>
                  <option value="last-month">Last Month</option>
                  <option value="current-quarter">Current Quarter</option>
                  <option value="current-year">Current Year</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={generateReport} className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Generate Report</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData?.totalEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{reportData?.newEmployees || 0} new this period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData?.attendanceStats ? 
                  Math.round((reportData.attendanceStats.find(s => s._id === 'present')?.count || 0) / 
                  (reportData.attendanceStats.reduce((sum, s) => sum + s.count, 0) || 1) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Current period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData?.leaveStats.find(s => s._id === 'pending')?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(reportData?.payrollStats.reduce((sum, s) => sum + s.totalAmount, 0) || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                This period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
              <CardDescription>Employee count by department</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportData?.departmentStats.map((dept) => (
                    <div key={dept._id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dept._id}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(dept.count / (reportData?.totalEmployees || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{dept.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Breakdown</CardTitle>
              <CardDescription>Attendance status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportData?.attendanceStats.map((status) => (
                    <div key={status._id} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{status._id}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              status._id === 'present' ? 'bg-green-500' :
                              status._id === 'absent' ? 'bg-red-500' :
                              status._id === 'late' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}
                            style={{
                              width: `${(status.count / (reportData?.attendanceStats.reduce((sum, s) => sum + s.count, 0) || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{status.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
            <CardDescription>Download reports in various formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-4 h-auto"
                onClick={exportToPDF}
              >
                <FileText className="h-8 w-8 mb-2" />
                <span>PDF Report</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-4 h-auto"
                onClick={exportToExcel}
              >
                <BarChart3 className="h-8 w-8 mb-2" />
                <span>Excel Report</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-4 h-auto"
                onClick={exportToCSV}
              >
                <Download className="h-8 w-8 mb-2" />
                <span>CSV Export</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-4 h-auto"
                onClick={() => window.location.href = '/dashboard'}
              >
                <BarChart3 className="h-8 w-8 mb-2" />
                <span>Dashboard</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
