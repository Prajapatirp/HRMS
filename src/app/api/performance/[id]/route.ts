import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Performance from '@/models/Performance';
import { requireAuth, requireRole } from '@/middleware/auth';

async function getPerformanceById(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const performance = await Performance.findById(params.id);

    if (!performance) {
      return NextResponse.json(
        { error: 'Performance review not found' },
        { status: 404 }
      );
    }

    // Check if user can access this performance review
    if (user.role !== 'admin' && user.role !== 'hr' && performance.employeeId !== user.employeeId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ performance });

  } catch (error) {
    console.error('Get performance by ID error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updatePerformance(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const updateData = await req.json();

    // Find the performance review
    const performance = await Performance.findById(params.id);
    if (!performance) {
      return NextResponse.json(
        { error: 'Performance review not found' },
        { status: 404 }
      );
    }

    // Check if user can update this performance review
    if (user.role !== 'admin' && user.role !== 'hr' && performance.employeeId !== user.employeeId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update the performance review
    const updatedPerformance = await Performance.findByIdAndUpdate(
      params.id,
      {
        ...updateData,
        reviewPeriod: {
          startDate: new Date(updateData.reviewPeriod.startDate),
          endDate: new Date(updateData.reviewPeriod.endDate),
        },
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Performance review updated successfully',
      performance: updatedPerformance,
    });

  } catch (error) {
    console.error('Update performance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deletePerformance(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const { user } = (req as any);

    // Find the performance review
    const performance = await Performance.findById(params.id);
    if (!performance) {
      return NextResponse.json(
        { error: 'Performance review not found' },
        { status: 404 }
      );
    }

    // Only admin and HR can delete performance reviews
    if (user.role !== 'admin' && user.role !== 'hr') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await Performance.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: 'Performance review deleted successfully',
    });

  } catch (error) {
    console.error('Delete performance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getPerformanceById);
export const PUT = requireAuth(updatePerformance);
export const DELETE = requireRole(['admin', 'hr'])(deletePerformance);
