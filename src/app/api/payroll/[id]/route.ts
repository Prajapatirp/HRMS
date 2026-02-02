import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payroll from '@/models/Payroll';
import { requireRole, requireAuth } from '@/middleware/auth';

async function updatePayroll(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const payrollData = await req.json();

    // Find the payroll record
    const payroll = await Payroll.findById(params.id);
    
    if (!payroll) {
      return NextResponse.json(
        { error: 'Payroll record not found' },
        { status: 404 }
      );
    }

    // Check if user has permission (admin/HR or the employee themselves)
    if (user.role !== 'admin' && user.role !== 'hr') {
      if (payroll.employeeId !== user.employeeId) {
        return NextResponse.json(
          { error: 'You do not have permission to update this payroll record' },
          { status: 403 }
        );
      }
    }

    // Check if updating month/year would create a duplicate
    if (payrollData.month && payrollData.year) {
      const existingPayroll = await Payroll.findOne({
        employeeId: payroll.employeeId,
        month: payrollData.month,
        year: payrollData.year,
        _id: { $ne: params.id },
      });

      if (existingPayroll) {
        return NextResponse.json(
          { error: 'Payroll record already exists for this employee and month' },
          { status: 400 }
        );
      }
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
    
    const netSalary = (payrollData.basicSalary || payroll.basicSalary) + 
                     totalAllowances + 
                     (payrollData.overtime || payroll.overtime) + 
                     (payrollData.bonus || payroll.bonus) - 
                     totalDeductions;

    // Update payroll record
    payroll.employeeId = payrollData.employeeId || payroll.employeeId;
    payroll.month = payrollData.month || payroll.month;
    payroll.year = payrollData.year || payroll.year;
    payroll.basicSalary = payrollData.basicSalary !== undefined ? payrollData.basicSalary : payroll.basicSalary;
    payroll.allowances = {
      housing: payrollData.allowances?.housing !== undefined ? payrollData.allowances.housing : payroll.allowances.housing,
      transport: payrollData.allowances?.transport !== undefined ? payrollData.allowances.transport : payroll.allowances.transport,
      medical: payrollData.allowances?.medical !== undefined ? payrollData.allowances.medical : payroll.allowances.medical,
      other: payrollData.allowances?.other !== undefined ? payrollData.allowances.other : payroll.allowances.other,
    };
    payroll.deductions = {
      tax: payrollData.deductions?.tax !== undefined ? payrollData.deductions.tax : payroll.deductions.tax,
      insurance: payrollData.deductions?.insurance !== undefined ? payrollData.deductions.insurance : payroll.deductions.insurance,
      loan: payrollData.deductions?.loan !== undefined ? payrollData.deductions.loan : payroll.deductions.loan,
      other: payrollData.deductions?.other !== undefined ? payrollData.deductions.other : payroll.deductions.other,
    };
    payroll.overtime = payrollData.overtime !== undefined ? payrollData.overtime : payroll.overtime;
    payroll.bonus = payrollData.bonus !== undefined ? payrollData.bonus : payroll.bonus;
    payroll.netSalary = netSalary;
    
    // Set paidAt when status changes to 'paid'
    payroll.status = payrollData.status || payroll.status;
    if (payroll.status === 'paid') {
      if (payrollData.paidDate) {
        payroll.paidAt = new Date(payrollData.paidDate);
      } else if (!payroll.paidAt) {
        payroll.paidAt = new Date();
      }
    } else if (payroll.status !== 'paid' && payrollData.paidDate === null) {
      // Clear paidAt if status is changed away from 'paid' and paidDate is explicitly null
      payroll.paidAt = undefined;
    }

    await payroll.save();

    return NextResponse.json({
      message: 'Payroll updated successfully',
      payroll,
    });

  } catch (error) {
    console.error('Update payroll error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function patchPayrollStatus(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const updateData = await req.json();

    // Only admin and HR can update status
    if (user.role !== 'admin' && user.role !== 'hr') {
      return NextResponse.json(
        { error: 'You do not have permission to update payroll status' },
        { status: 403 }
      );
    }

    // Find the payroll record
    const payroll = await Payroll.findById(params?.id);
    
    if (!payroll) {
      return NextResponse.json(
        { error: 'Payroll record not found' },
        { status: 404 }
      );
    }

    // Update status
    if (updateData.status) {
      const previousStatus = payroll.status;
      payroll.status = updateData.status;
      
      // Handle paidAt based on status
      if (updateData.status === 'paid') {
        if (updateData.paidDate) {
          payroll.paidAt = new Date(updateData.paidDate);
        } else if (!payroll.paidAt) {
          payroll.paidAt = new Date();
        }
      } else if (updateData.status !== 'paid' && previousStatus === 'paid') {
        // Clear paidAt if status is changed away from 'paid'
        payroll.paidAt = undefined;
      }
    }

    await payroll.save();

    return NextResponse.json({
      message: 'Payroll status updated successfully',
      payroll,
    });

  } catch (error) {
    console.error('Patch payroll status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PUT = requireAuth(updatePayroll);
export const PATCH = requireRole(['admin', 'hr'])(patchPayrollStatus);
