import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import { requireRole, requireAuth } from '@/middleware/auth';

async function getPayroll(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};
    
    // If user is admin or HR, they can view all payroll records
    // If user is employee, they can only view their own records
    if (user.role === 'admin' || user.role === 'hr') {
      if (employeeId) {
        query.employeeId = employeeId;
      }
    } else {
      // Employee can only view their own payroll records
      if (!user.employeeId) {
        return NextResponse.json(
          { error: 'Employee ID not found. Please contact HR to set up your employee profile.' },
          { status: 400 }
        );
      }
      query.employeeId = user.employeeId;
    }
    
    if (month) {
      query.month = parseInt(month);
    }
    
    if (year) {
      query.year = parseInt(year);
    }

    const skip = (page - 1) * limit;
    
    const payroll = await Payroll.find(query)
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payroll.countDocuments(query);

    return NextResponse.json({
      payroll,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get payroll error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createPayroll(req: NextRequest) {
  try {
    await connectDB();
    
    const payrollData = await req.json();

    // Validate required fields
    if (!payrollData.employeeId || !payrollData.month || !payrollData.year) {
      return NextResponse.json(
        { error: 'Employee ID, month, and year are required' },
        { status: 400 }
      );
    }

    // Check if payroll already exists
    const existingPayroll = await Payroll.findOne({
      employeeId: payrollData.employeeId,
      month: payrollData.month,
      year: payrollData.year,
    });

    if (existingPayroll) {
      return NextResponse.json(
        { error: 'Payroll record already exists for this employee and month' },
        { status: 400 }
      );
    }

    // Calculate net salary
    const totalAllowances = (payrollData.allowances?.housing || 0) + 
                          (payrollData.allowances?.transport || 0) + 
                          (payrollData.allowances?.medical || 0) + 
                          (payrollData.allowances?.other || 0);
    
    const totalDeductions = (payrollData.deductions?.tax || 0) + 
                           (payrollData.deductions?.insurance || 0) + 
                           (payrollData.deductions?.loan || 0) + 
                           (payrollData.deductions?.other || 0);
    
    const netSalary = (payrollData.basicSalary || 0) + 
                     totalAllowances + 
                     (payrollData.overtime || 0) + 
                     (payrollData.bonus || 0) - 
                     totalDeductions;

    const payroll = new Payroll({
      employeeId: payrollData.employeeId,
      month: payrollData.month,
      year: payrollData.year,
      basicSalary: payrollData.basicSalary || 0,
      allowances: {
        housing: payrollData.allowances?.housing || 0,
        transport: payrollData.allowances?.transport || 0,
        medical: payrollData.allowances?.medical || 0,
        other: payrollData.allowances?.other || 0,
      },
      deductions: {
        tax: payrollData.deductions?.tax || 0,
        insurance: payrollData.deductions?.insurance || 0,
        loan: payrollData.deductions?.loan || 0,
        other: payrollData.deductions?.other || 0,
      },
      overtime: payrollData.overtime || 0,
      bonus: payrollData.bonus || 0,
      netSalary,
      status: payrollData.status || 'pending',
    });

    await payroll.save();

    return NextResponse.json({
      message: 'Payroll created successfully',
      payroll,
    }, { status: 201 });

  } catch (error) {
    console.error('Create payroll error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getPayroll);
export const POST = requireRole(['admin', 'hr'])(createPayroll);
