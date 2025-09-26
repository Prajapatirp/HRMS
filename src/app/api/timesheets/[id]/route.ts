import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Timesheet from '@/models/Timesheet';
import Project from '@/models/Project';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string | any | null }> }
) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      );
    }

    // For employees, they can only view their own timesheets
    if (decoded.role === 'employee' && timesheet.employeeId !== decoded.employeeId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ timesheet });
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timesheet' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      );
    }

    // For employees, they can only edit their own timesheets and only if not submitted
    if (decoded.role === 'employee') {
      if (timesheet.employeeId !== decoded.employeeId) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
      if (timesheet.status === 'submitted' || timesheet.status === 'approved') {
        return NextResponse.json(
          { error: 'Cannot edit submitted or approved timesheet' },
          { status: 400 }
        );
      }
    }

    const body = await request.json();
    const { 
      employeeName, 
      timesheetDate, 
      hours, 
      projectId, 
      taskDetails, 
      planForTomorrow,
      status 
    } = body;

    // If project is being changed, verify it exists
    if (projectId && projectId !== timesheet.projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      timesheet.projectId = projectId;
      timesheet.projectName = project.name;
    }

    // Update fields
    if (employeeName !== undefined) timesheet.employeeName = employeeName;
    if (timesheetDate !== undefined) timesheet.timesheetDate = new Date(timesheetDate);
    if (hours !== undefined) timesheet.hours = parseFloat(hours);
    if (taskDetails !== undefined) timesheet.taskDetails = taskDetails;
    if (planForTomorrow !== undefined) timesheet.planForTomorrow = planForTomorrow;
    
    // Status changes
    if (status !== undefined) {
      if (status === 'submitted' && timesheet.status === 'draft') {
        timesheet.status = 'submitted';
        timesheet.submittedAt = new Date();
      } else if ((status === 'approved' || status === 'rejected') && (decoded.role === 'admin' || decoded.role === 'hr')) {
        timesheet.status = status;
        timesheet.approvedBy = decoded.userId;
        timesheet.approvedAt = new Date();
        if (status === 'rejected' && body.rejectionReason) {
          timesheet.rejectionReason = body.rejectionReason;
        }
      }
    }

    await timesheet.save();

    return NextResponse.json(
      { message: 'Timesheet updated successfully', timesheet }
    );
  } catch (error) {
    console.error('Error updating timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to update timesheet' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string | any | null }> }
) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params as any;
    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      );
    }

    // For employees, they can only delete their own draft timesheets
    if (decoded.role === 'employee') {
      if (timesheet.employeeId !== decoded.employeeId) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
      if (timesheet.status !== 'draft') {
        return NextResponse.json(
          { error: 'Can only delete draft timesheets' },
          { status: 400 }
        );
      }
    }

    await Timesheet.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'Timesheet deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to delete timesheet' },
      { status: 500 }
    );
  }
}
