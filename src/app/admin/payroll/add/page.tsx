'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { DollarSign, ArrowLeft, Calculator } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Employee {
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  jobInfo: {
    salary: number;
    designation: string;
    department: string;
  };
}

const validationSchema = Yup.object({
  employeeId: Yup.string()
    .required('Employee is required'),
  month: Yup.string()
    .required('Month is required'),
  year: Yup.number()
    .required('Year is required')
    .min(2000, 'Year must be 2000 or later')
    .max(2100, 'Year must be 2100 or earlier'),
  workingDays: Yup.number()
    .min(0, 'Working days cannot be negative')
    .max(31, 'Working days cannot exceed 31'),
  basicSalary: Yup.number()
    .required('Basic salary is required')
    .min(0, 'Basic salary cannot be negative'),
  overtime: Yup.number()
    .min(0, 'Overtime pay cannot be negative'),
  bonus: Yup.number()
    .min(0, 'Bonus cannot be negative'),
  extraAllowance: Yup.number()
    .min(0, 'Extra allowance cannot be negative'),
  deductions: Yup.object({
    tax: Yup.number()
      .min(0, 'Tax cannot be negative'),
    insurance: Yup.number()
      .min(0, 'Insurance cannot be negative'),
    loan: Yup.number()
      .min(0, 'Loan cannot be negative'),
    other: Yup.number()
      .min(0, 'Other deduction cannot be negative'),
  }),
  status: Yup.string()
    .required('Status is required')
    .oneOf(['pending', 'processed', 'paid'], 'Invalid status'),
  paidDate: Yup.string()
    .nullable()
    .when('status', {
      is: 'paid',
      then: (schema) => schema.required('Paid date is required when status is paid'),
      otherwise: (schema) => schema.nullable(),
    }),
});

function AddPayrollPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingEmployee, setFetchingEmployee] = useState(false);
  const employeesFetchedRef = useRef(false);

  const payrollId = searchParams.get('id');
  const isEditMode = !!payrollId;

  const formik = useFormik({
    initialValues: {
      employeeId: '',
      month: '',
      year: new Date().getFullYear(),
      workingDays: '',
      basicSalary: '',
      overtime: '',
      bonus: '',
      extraAllowance: '',
      deductions: {
        tax: '',
        insurance: '',
        loan: '',
        other: '',
      },
      status: 'pending',
      paidDate: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setError('');
      setLoading(true);

      try {
        const payload = {
          employeeId: values.employeeId,
          month: parseInt(values.month),
          year: values.year,
          basicSalary: parseFloat(values.basicSalary) || 0,
          allowances: {
            housing: 0,
            transport: 0,
            medical: 0,
            other: parseFloat(values.extraAllowance) || 0,
          },
          deductions: {
            tax: parseFloat(values.deductions.tax) || 0,
            insurance: parseFloat(values.deductions.insurance) || 0,
            loan: parseFloat(values.deductions.loan) || 0,
            other: parseFloat(values.deductions.other) || 0,
          },
          overtime: parseFloat(values.overtime) || 0,
          bonus: parseFloat(values.bonus) || 0,
          status: values.status,
          paidDate: values.paidDate || undefined,
        };

        const url = isEditMode ? `/api/payroll/${payrollId}` : '/api/payroll';
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          router.push('/admin/payroll');
        } else {
          setError(data.error || (isEditMode ? 'Failed to update payroll' : 'Failed to create payroll'));
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  const fetchEmployees = useCallback(async () => {
    if (employeesFetchedRef.current) return;
    
    try {
      setFetchingEmployee(true);
      employeesFetchedRef.current = true;
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      employeesFetchedRef.current = false;
    } finally {
      setFetchingEmployee(false);
    }
  }, [token]);

  const fetchPayrollData = useCallback(async () => {
    if (!payrollId || !token) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/payroll?page=1&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const payroll = Array.isArray(data.payroll) 
          ? data.payroll.find((p: any) => p._id === payrollId)
          : null;
        
        if (payroll) {
          formik.setValues({
            employeeId: payroll.employeeId || '',
            month: payroll.month?.toString() || '',
            year: payroll.year || new Date().getFullYear(),
            workingDays: '',
            basicSalary: payroll.basicSalary?.toString() || '',
            overtime: payroll.overtime?.toString() || '',
            bonus: payroll.bonus?.toString() || '',
            extraAllowance: payroll.allowances?.other?.toString() || '',
            deductions: {
              tax: payroll.deductions?.tax?.toString() || '',
              insurance: payroll.deductions?.insurance?.toString() || '',
              loan: payroll.deductions?.loan?.toString() || '',
              other: payroll.deductions?.other?.toString() || '',
            },
            status: payroll.status || 'pending',
            paidDate: payroll.paidAt ? new Date(payroll.paidAt).toISOString().split('T')[0] : '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
    } finally {
      setLoading(false);
    }
  }, [payrollId, token, formik]);

  useEffect(() => {
    if (token && !employeesFetchedRef.current) {
      fetchEmployees();
    }
  }, [token, fetchEmployees]);

  useEffect(() => {
    if (token && isEditMode && payrollId) {
      fetchPayrollData();
    }
  }, [token, isEditMode, payrollId, fetchPayrollData, formik.setValues]);

  const selectedEmployeeData = employees.find(emp => emp.employeeId === formik.values.employeeId);

  const calculateNetSalary = () => {
    const basic = parseFloat(formik.values.basicSalary) || 0;
    const extraAllowance = parseFloat(formik.values.extraAllowance) || 0;
    const tax = parseFloat(formik.values.deductions.tax) || 0;
    const insurance = parseFloat(formik.values.deductions.insurance) || 0;
    const loan = parseFloat(formik.values.deductions.loan) || 0;
    const otherDeduction = parseFloat(formik.values.deductions.other) || 0;
    const overtimePay = parseFloat(formik.values.overtime) || 0;
    const bonusPay = parseFloat(formik.values.bonus) || 0;

    const totalDeductions = tax + insurance + loan + otherDeduction;
    const netSalary = basic + extraAllowance + overtimePay + bonusPay - totalDeductions;

    return netSalary;
  };

  const netSalary = calculateNetSalary();

  if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
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
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Update Payroll' : 'Create Payroll'}
            </h1>
            <p className="text-gray-600">
              {isEditMode ? 'Update payroll information' : 'Create a new payroll record'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Select employee and period for payroll</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeId">Employee</Label>
                  <Select
                    id="employeeId"
                    value={formik.values.employeeId}
                    onChange={(e) => {
                      formik.setFieldValue('employeeId', e.target.value);
                      formik.setFieldTouched('employeeId', true);
                    }}
                    onBlur={formik.handleBlur}
                    disabled={fetchingEmployee}
                    className={formik.touched.employeeId && formik.errors.employeeId ? 'border-red-500' : ''}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.personalInfo.firstName} {emp.personalInfo.lastName} - {emp.employeeId}
                      </option>
                    ))}
                  </Select>
                  {formik.touched.employeeId && formik.errors.employeeId && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.employeeId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="month">Month</Label>
                  <Select
                    id="month"
                    value={formik.values.month}
                    onChange={(e) => {
                      formik.setFieldValue('month', e.target.value);
                      formik.setFieldTouched('month', true);
                    }}
                    onBlur={formik.handleBlur}
                    className={formik.touched.month && formik.errors.month ? 'border-red-500' : ''}
                  >
                    <option value="">Select Month</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthNum = i + 1;
                      return (
                        <option key={monthNum} value={monthNum}>
                          {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      );
                    })}
                  </Select>
                  {formik.touched.month && formik.errors.month && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.month}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formik.values.year}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="2024"
                    className={formik.touched.year && formik.errors.year ? 'border-red-500' : ''}
                  />
                  {formik.touched.year && formik.errors.year && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.year}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="workingDays">Working Days</Label>
                  <Input
                    id="workingDays"
                    type="number"
                    value={formik.values.workingDays}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g., 22"
                    min="0"
                    max="31"
                    className={formik.touched.workingDays && formik.errors.workingDays ? 'border-red-500' : ''}
                  />
                  {formik.touched.workingDays && formik.errors.workingDays && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.workingDays}</p>
                  )}
                </div>
              </div>

              {selectedEmployeeData && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-block px-3 py-1 bg-gray-900 text-white text-sm font-medium rounded-full">
                      {selectedEmployeeData.personalInfo.firstName} • {selectedEmployeeData.personalInfo.lastName}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Department</p>
                      <p className="font-medium">{selectedEmployeeData.jobInfo.department}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Position</p>
                      <p className="font-medium">{selectedEmployeeData.jobInfo.designation}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Base Salary</p>
                      <p className="font-medium">{formatCurrency(selectedEmployeeData.jobInfo.salary)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Salary Details */}
          <Card>
            <CardHeader>
              <CardTitle>Salary Details</CardTitle>
              <CardDescription>Enter salary components manually</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="basicSalary">Basic Salary</Label>
                  <Input
                    id="basicSalary"
                    type="number"
                    value={formik.values.basicSalary}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={formik.touched.basicSalary && formik.errors.basicSalary ? 'border-red-500' : ''}
                  />
                  {formik.touched.basicSalary && formik.errors.basicSalary && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.basicSalary}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="overtime">Overtime Pay</Label>
                  <Input
                    id="overtime"
                    type="number"
                    value={formik.values.overtime}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={formik.touched.overtime && formik.errors.overtime ? 'border-red-500' : ''}
                  />
                  {formik.touched.overtime && formik.errors.overtime && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.overtime}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bonus">Bonus</Label>
                  <Input
                    id="bonus"
                    type="number"
                    value={formik.values.bonus}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={formik.touched.bonus && formik.errors.bonus ? 'border-red-500' : ''}
                  />
                  {formik.touched.bonus && formik.errors.bonus && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.bonus}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="extraAllowance">Extra Allowance</Label>
                  <Input
                    id="extraAllowance"
                    type="number"
                    value={formik.values.extraAllowance}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={formik.touched.extraAllowance && formik.errors.extraAllowance ? 'border-red-500' : ''}
                  />
                  {formik.touched.extraAllowance && formik.errors.extraAllowance && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.extraAllowance}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    value={formik.values.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      formik.setFieldValue('status', newStatus);
                      formik.setFieldTouched('status', true);
                      // Clear paidDate if status is not 'paid'
                      if (newStatus !== 'paid') {
                        formik.setFieldValue('paidDate', '');
                      }
                    }}
                    onBlur={formik.handleBlur}
                    className={formik.touched.status && formik.errors.status ? 'border-red-500' : ''}
                  >
                    <option value="pending">Pending</option>
                    <option value="processed">Processed</option>
                    <option value="paid">Paid</option>
                  </Select>
                  {formik.touched.status && formik.errors.status && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.status}</p>
                  )}
                </div>

                {formik.values.status === 'paid' && (
                  <div>
                    <Label htmlFor="paidDate">Paid Date</Label>
                    <Input
                      id="paidDate"
                      type="date"
                      value={formik.values.paidDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={formik.touched.paidDate && formik.errors.paidDate ? 'border-red-500' : ''}
                    />
                    {formik.touched.paidDate && formik.errors.paidDate && (
                      <p className="mt-1 text-sm text-red-600">{formik.errors.paidDate}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Deductions</CardTitle>
              <CardDescription>Amounts to be deducted from salary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tax">Tax</Label>
                  <Input
                    id="tax"
                    type="number"
                    value={formik.values.deductions.tax}
                    onChange={(e) => formik.setFieldValue('deductions.tax', e.target.value)}
                    onBlur={formik.handleBlur}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={formik.touched.deductions?.tax && formik.errors.deductions?.tax ? 'border-red-500' : ''}
                  />
                  {formik.touched.deductions?.tax && formik.errors.deductions?.tax && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.deductions.tax}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="insurance">Insurance</Label>
                  <Input
                    id="insurance"
                    type="number"
                    value={formik.values.deductions.insurance}
                    onChange={(e) => formik.setFieldValue('deductions.insurance', e.target.value)}
                    onBlur={formik.handleBlur}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={formik.touched.deductions?.insurance && formik.errors.deductions?.insurance ? 'border-red-500' : ''}
                  />
                  {formik.touched.deductions?.insurance && formik.errors.deductions?.insurance && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.deductions.insurance}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="loan">Loan</Label>
                  <Input
                    id="loan"
                    type="number"
                    value={formik.values.deductions.loan}
                    onChange={(e) => formik.setFieldValue('deductions.loan', e.target.value)}
                    onBlur={formik.handleBlur}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={formik.touched.deductions?.loan && formik.errors.deductions?.loan ? 'border-red-500' : ''}
                  />
                  {formik.touched.deductions?.loan && formik.errors.deductions?.loan && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.deductions.loan}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="otherDeduction">Other Deduction</Label>
                  <Input
                    id="otherDeduction"
                    type="number"
                    value={formik.values.deductions.other}
                    onChange={(e) => formik.setFieldValue('deductions.other', e.target.value)}
                    onBlur={formik.handleBlur}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={formik.touched.deductions?.other && formik.errors.deductions?.other ? 'border-red-500' : ''}
                  />
                  {formik.touched.deductions?.other && formik.errors.deductions?.other && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.deductions.other}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Salary Calculation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Net Salary Calculation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Final Amount</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(netSalary)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  <span>{isEditMode ? 'Update Payroll' : 'Create Payroll'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default function AddPayrollPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    }>
      <AddPayrollPageContent />
    </Suspense>
  );
}
