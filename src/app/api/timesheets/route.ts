import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Timesheet from '@/models/Timesheet';
import Project from '@/models/Project';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const employeeId = searchParams.get('employeeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    // For employees, only show their own timesheets
    if (decoded.role === 'employee') {
      query.employeeId = decoded.employeeId;
    }

    // For admin/HR, they can filter by employee
    if (employeeId && (decoded.role === 'admin' || decoded.role === 'hr')) {
      query.employeeId = employeeId;
    }

    if (projectId) {
      query.projectId = projectId;
    }

    if (startDate || endDate) {
      query.timesheetDate = {};
      if (startDate) {
        query.timesheetDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // Include the entire end date
        query.timesheetDate.$lte = endDateTime;
      }
    }

    const skip = (page - 1) * limit;

    const timesheets = await Timesheet.find(query)
      .sort({ timesheetDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Timesheet.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      timesheets,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timesheets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { 
      employeeId, 
      employeeName, 
      timesheetDate, 
      hours, 
      projectId, 
      taskDetails, 
      planForTomorrow 
    } = body;

    // Validation
    if (!employeeId || !employeeName || !timesheetDate || !hours || !projectId || !taskDetails) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // For employees, they can only create timesheets for themselves
    if (decoded.role === 'employee' && decoded.employeeId !== employeeId) {
      return NextResponse.json(
        { error: 'You can only create timesheets for yourself' },
        { status: 403 }
      );
    }

    // Check if timesheet already exists for this employee and date
    // const existingTimesheet = await Timesheet.findOne({
    //   employeeId,
    //   timesheetDate: new Date(timesheetDate),
    // });

    // if (existingTimesheet) {
    //   return NextResponse.json(
    //     { error: 'Timesheet already exists for this date' },
    //     { status: 400 }
    //   );
    // }

    const timesheet = new Timesheet({
      employeeId,
      employeeName,
      timesheetDate: new Date(timesheetDate),
      hours: parseFloat(hours),
      projectId,
      projectName: project.name,
      taskDetails,
      planForTomorrow,
    });

    await timesheet.save();

    return NextResponse.json(
      { message: 'Timesheet created successfully', timesheet },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to create timesheet' },
      { status: 500 }
    );
  }
}
