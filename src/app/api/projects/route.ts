import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
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
    const projectName = searchParams.get('projectName');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Base query - For admin/HR users, show all projects. For others, show only active projects
    const query: any = (decoded.role === 'admin' || decoded.role === 'hr') 
      ? {} 
      : { status: 'active' };

    // Filter by project name
    if (projectName) {
      query.name = { $regex: projectName, $options: 'i' };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range - Projects that overlap with the filter date range
    if (startDate || endDate) {
      const dateConditions: any[] = [];
      
      if (startDate && endDate) {
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        filterEnd.setHours(23, 59, 59, 999);
        
        // Projects that overlap with the filter date range or have no dates
        dateConditions.push(
          // Project has dates and overlaps with filter range
          {
            startDate: { $lte: filterEnd },
            endDate: { $gte: filterStart }
          },
          // Project has only start date within range
          {
            startDate: { $lte: filterEnd, $exists: true },
            endDate: { $exists: false }
          },
          // Project has only end date within range
          {
            startDate: { $exists: false },
            endDate: { $gte: filterStart, $exists: true }
          },
          // Project has no dates (include all)
          {
            startDate: { $exists: false },
            endDate: { $exists: false }
          }
        );
      } else if (startDate) {
        const filterStart = new Date(startDate);
        dateConditions.push(
          { startDate: { $lte: filterStart } },
          { startDate: { $exists: false } }
        );
      } else if (endDate) {
        const filterEnd = new Date(endDate);
        filterEnd.setHours(23, 59, 59, 999);
        dateConditions.push(
          { endDate: { $gte: filterEnd } },
          { endDate: { $exists: false } }
        );
      }
      
      if (dateConditions.length > 0) {
        query.$or = dateConditions;
      }
    }

    const skip = (page - 1) * limit;

    const projects = await Project.find(query)
      .select('name description status startDate endDate createdBy createdAt updatedAt')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      projects,
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
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
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
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'hr')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, startDate, endDate } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = new Project({
      name,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      createdBy: decoded.userId,
    });

    await project.save();

    return NextResponse.json(
      { message: 'Project created successfully', project },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
