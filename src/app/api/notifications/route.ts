import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { requireAuth, requireRole } from '@/middleware/auth';

async function getNotifications(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');

    const query: any = {
      $or: [
        { recipientType: 'all' },
        { recipientType: 'department', recipients: user.department },
        { recipientType: 'individual', recipients: user.employeeId },
      ],
    };
    
    if (type) {
      query.type = type;
    }
    
    if (isRead !== null) {
      query.isRead = isRead === 'true';
    }

    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createNotification(req: NextRequest) {
  try {
    await connectDB();
    
    const notificationData = await request.json();

    const notification = new Notification(notificationData);
    await notification.save();

    return NextResponse.json({
      message: 'Notification created successfully',
      notification,
    }, { status: 201 });

  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getNotifications);
export const POST = requireRole(['admin', 'hr'])(createNotification);
