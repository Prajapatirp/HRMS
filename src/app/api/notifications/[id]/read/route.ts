import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { requireAuth } from '@/middleware/auth';

async function markAsRead(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    
    const notification = await Notification.findById(params.id);
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check if user has already read this notification
    const alreadyRead = notification.readBy.some(
      (read) => read.employeeId === user.employeeId
    );

    if (!alreadyRead) {
      notification.readBy.push({
        employeeId: user.employeeId,
        readAt: new Date(),
      });
      
      await notification.save();
    }

    return NextResponse.json({
      message: 'Notification marked as read',
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = requireAuth(markAsRead);
