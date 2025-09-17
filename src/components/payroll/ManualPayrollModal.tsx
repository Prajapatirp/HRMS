'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, X, Calculator } from 'lucide-react';

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

interface ManualPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualPayrollModal({ isOpen, onClose, onSuccess }: ManualPayrollModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [workingDays, setWorkingDays] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [allowances, setAllowances] = useState({
    housing: '',
    transport: '',
    medical: '',
    other: ''
  });
  const [deductions, setDeductions] = useState({
    tax: '',
    insurance: '',
    loan: '',
    other: ''
  });
  const [overtime, setOvertime] = useState('');
  const [bonus, setBonus] = useState('');
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

  const calculateNetSalary = () => {
    const basic = parseFloat(basicSalary) || 0;
    const housing = parseFloat(allowances.housing) || 0;
    const transport = parseFloat(allowances.transport) || 0;
    const medical = parseFloat(allowances.medical) || 0;
    const otherAllowance = parseFloat(allowances.other) || 0;
    const tax = parseFloat(deductions.tax) || 0;
    const insurance = parseFloat(deductions.insurance) || 0;
    const loan = parseFloat(deductions.loan) || 0;
    const otherDeduction = parseFloat(deductions.other) || 0;
    const overtimePay = parseFloat(overtime) || 0;
    const bonusPay = parseFloat(bonus) || 0;

    const totalAllowances = housing + transport + medical + otherAllowance;
    const totalDeductions = tax + insurance + loan + otherDeduction;
    const netSalary = basic + totalAllowances + overtimePay + bonusPay - totalDeductions;

    return netSalary;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          month: parseInt(month),
          year: parseInt(year),
          basicSalary: parseFloat(basicSalary) || 0,
          allowances: {
            housing: parseFloat(allowances.housing) || 0,
            transport: parseFloat(allowances.transport) || 0,
            medical: parseFloat(allowances.medical) || 0,
            other: parseFloat(allowances.other) || 0,
          },
          deductions: {
            tax: parseFloat(deductions.tax) || 0,
            insurance: parseFloat(deductions.insurance) || 0,
            loan: parseFloat(deductions.loan) || 0,
            other: parseFloat(deductions.other) || 0,
          },
          overtime: parseFloat(overtime) || 0,
          bonus: parseFloat(bonus) || 0,
          status,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Payroll created successfully!');
        onSuccess();
        onClose();
        resetForm();
      } else {
        setError(data.error || 'Failed to create payroll');
      }
    } catch (error) {
      setError('Failed to create payroll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedEmployee('');
    setMonth('');
    setYear('');
    setWorkingDays('');
    setBasicSalary('');
    setAllowances({ housing: '', transport: '', medical: '', other: '' });
    setDeductions({ tax: '', insurance: '', loan: '', other: '' });
    setOvertime('');
    setBonus('');
    setStatus('pending');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const selectedEmployeeData = employees.find(emp => emp.employeeId === selectedEmployee);
  const netSalary = calculateNetSalary();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Manual Payroll Management</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Select employee and period for payroll</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.personalInfo.firstName} {emp.personalInfo.lastName} - {emp.employeeId}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="month">Month</Label>
                  <Select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
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
                </div>

                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="workingDays">Working Days</Label>
                  <Input
                    id="workingDays"
                    type="number"
                    value={workingDays}
                    onChange={(e) => setWorkingDays(e.target.value)}
                    placeholder="e.g., 22"
                    min="0"
                    max="31"
                  />
                </div>
              </div>

              {selectedEmployeeData && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Employee Information</h4>
                  <p className="text-sm text-blue-700">
                    <strong>Name:</strong> {selectedEmployeeData.personalInfo.firstName} {selectedEmployeeData.personalInfo.lastName}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Department:</strong> {selectedEmployeeData.jobInfo.department}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Position:</strong> {selectedEmployeeData.jobInfo.designation}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Base Salary:</strong> ${selectedEmployeeData.jobInfo.salary?.toLocaleString()}
                  </p>
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
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="overtime">Overtime Pay</Label>
                  <Input
                    id="overtime"
                    type="number"
                    value={overtime}
                    onChange={(e) => setOvertime(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="bonus">Bonus</Label>
                  <Input
                    id="bonus"
                    type="number"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="processed">Processed</option>
                    <option value="paid">Paid</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allowances */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Allowances</CardTitle>
              <CardDescription>Additional payments to employee</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="housingAllowance">Housing Allowance</Label>
                  <Input
                    id="housingAllowance"
                    type="number"
                    value={allowances.housing}
                    onChange={(e) => setAllowances(prev => ({ ...prev, housing: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="transportAllowance">Transport Allowance</Label>
                  <Input
                    id="transportAllowance"
                    type="number"
                    value={allowances.transport}
                    onChange={(e) => setAllowances(prev => ({ ...prev, transport: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="medicalAllowance">Medical Allowance</Label>
                  <Input
                    id="medicalAllowance"
                    type="number"
                    value={allowances.medical}
                    onChange={(e) => setAllowances(prev => ({ ...prev, medical: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="otherAllowance">Other Allowance</Label>
                  <Input
                    id="otherAllowance"
                    type="number"
                    value={allowances.other}
                    onChange={(e) => setAllowances(prev => ({ ...prev, other: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
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
                    value={deductions.tax}
                    onChange={(e) => setDeductions(prev => ({ ...prev, tax: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="insurance">Insurance</Label>
                  <Input
                    id="insurance"
                    type="number"
                    value={deductions.insurance}
                    onChange={(e) => setDeductions(prev => ({ ...prev, insurance: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="loan">Loan</Label>
                  <Input
                    id="loan"
                    type="number"
                    value={deductions.loan}
                    onChange={(e) => setDeductions(prev => ({ ...prev, loan: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="otherDeduction">Other Deduction</Label>
                  <Input
                    id="otherDeduction"
                    type="number"
                    value={deductions.other}
                    onChange={(e) => setDeductions(prev => ({ ...prev, other: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
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
                    ${netSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
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
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  <span>Create Payroll</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
