/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Performance from '@/models/Performance';
import { requireAuth, requireRole } from '@/middleware/auth';

async function getPerformance(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const { searchParams } = new URL(req.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filter parameters
    const employeeId = searchParams.get('employeeId') || user.employeeId;
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    const reviewedBy = searchParams.get('reviewedBy');

    // Build query
    const query: any = {};
    
    // For admin/HR, they can view all performance reviews
    // For employees, they can only view their own
    if (user.role === 'admin' || user.role === 'hr') {
      if (employeeId) {
        query.employeeId = employeeId;
      }
    } else {
      query.employeeId = user.employeeId;
    }
    
    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query['reviewPeriod.startDate'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query['reviewPeriod.startDate'] = { $gte: new Date(startDate) };
    } else if (endDate) {
      query['reviewPeriod.endDate'] = { $lte: new Date(endDate) };
    }

    if (minRating) {
      query.overallRating = { ...query.overallRating, $gte: parseFloat(minRating) };
    }
    if (maxRating) {
      query.overallRating = { ...query.overallRating, $lte: parseFloat(maxRating) };
    }

    if (reviewedBy) {
      query.reviewedBy = { $regex: reviewedBy, $options: 'i' };
    }

    // Get performance reviews with pagination
    const performance = await Performance.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Performance.countDocuments(query);

    return NextResponse.json({
      performance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Get performance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createPerformance(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const performanceData = await req.json();

    // Validate required fields
    if (!performanceData.employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    if (!performanceData.reviewPeriod?.startDate || !performanceData.reviewPeriod?.endDate) {
      return NextResponse.json(
        { error: 'Review period start and end dates are required' },
        { status: 400 }
      );
    }

    if (!performanceData.goals || performanceData.goals.length === 0) {
      return NextResponse.json(
        { error: 'At least one goal is required' },
        { status: 400 }
      );
    }

    if (!performanceData.competencies || performanceData.competencies.length === 0) {
      return NextResponse.json(
        { error: 'At least one competency is required' },
        { status: 400 }
      );
    }

    if (!performanceData.reviewerComments) {
      return NextResponse.json(
        { error: 'Reviewer comments are required' },
        { status: 400 }
      );
    }

    const performance = new Performance({
      ...performanceData,
      reviewedBy: user.employeeId || user.email || user.userId,
    });

    await performance.save();

    console.log(`Performance review created for employee ${performanceData.employeeId} by ${user.employeeId || user.email}`);

    return NextResponse.json({
      message: 'Performance review created successfully',
      performance,
    }, { status: 201 });

  } catch (error) {
    console.error('Create performance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getPerformance);
export const POST = requireRole(['admin', 'hr', 'manager'])(createPerformance);
