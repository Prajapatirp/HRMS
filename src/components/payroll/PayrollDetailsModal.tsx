'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, User, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import DynamicModal from '@/components/ui/dynamic-modal';

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
  createdAt: string;
  updatedAt: string;
}

interface PayrollDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll: PayrollRecord | null | any;
  onDownloadPDF: (payroll: PayrollRecord) => void;
  employeeName?: string;
}

export default function PayrollDetailsModal({ isOpen, onClose, payroll, onDownloadPDF, employeeName }: PayrollDetailsModalProps) {
  if (!isOpen || !payroll) return null;

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
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

  const totalAllowances = Object.values(payroll.allowances).reduce((sum: any, val: any) => sum + val, 0);
  const totalDeductions = Object.values(payroll.deductions).reduce((sum: any, val: any) => sum + val, 0);

  return (
    <DynamicModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payroll Details - ${getMonthName(payroll.month)} ${payroll.year}`}
      maxWidth="max-w-4xl"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="default"
            onClick={() => onDownloadPDF(payroll)}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
          {/* Employee Name Badge */}
          {employeeName && (
            <div className="flex items-center">
              <span className="inline-block px-3 py-1 bg-gray-900 text-white text-sm font-medium rounded-full">
                {employeeName}
              </span>
            </div>
          )}

          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Pay Period</p>
                <p className="font-semibold">{getMonthName(payroll.month)} {payroll.year}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Net Salary</p>
                <p className="font-semibold text-green-600">{formatCurrency(payroll.netSalary)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <User className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payroll.status)}`}>
                  {payroll.status}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Earnings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Basic Salary</span>
                    <span className="font-semibold">{formatCurrency(payroll.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Housing Allowance</span>
                    <span>{formatCurrency(payroll.allowances.housing)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Transport Allowance</span>
                    <span>{formatCurrency(payroll.allowances.transport)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Medical Allowance</span>
                    <span>{formatCurrency(payroll.allowances.medical)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Other Allowances</span>
                    <span>{formatCurrency(payroll.allowances.other)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Overtime Pay</span>
                    <span>{formatCurrency(payroll.overtime)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Bonus</span>
                    <span>{formatCurrency(payroll.bonus)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4">
                  <span className="font-semibold text-green-800">Total Earnings</span>
                  <span className="font-bold text-green-800">
                    {formatCurrency(payroll.basicSalary + totalAllowances + payroll.overtime + payroll.bonus)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Deductions Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Deductions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Tax</span>
                    <span>{formatCurrency(payroll.deductions.tax)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Insurance</span>
                    <span>{formatCurrency(payroll.deductions.insurance)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Loan Deduction</span>
                    <span>{formatCurrency(payroll.deductions.loan)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Other Deductions</span>
                    <span>{formatCurrency(payroll.deductions.other)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-4">
                  <span className="font-semibold text-red-800">Total Deductions</span>
                  <span className="font-bold text-red-800">{formatCurrency(totalDeductions as any)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Net Salary</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(payroll.netSalary)}</span>
              </div>
              {payroll.paidAt && (
                <div className="mt-2 text-sm text-gray-600">
                  Paid on: {formatDate(payroll.paidAt)}
                </div>
              )}
            </CardContent>
          </Card>

      </div>
    </DynamicModal>
  );
}
