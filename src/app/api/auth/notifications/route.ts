import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/middleware/auth';

async function getNotificationSettings(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    
    // Get user details
    const userDetails = await User.findById(user.userId).select('-password');
    if (!userDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return notification settings (default values if not set)
    const notificationSettings = userDetails.notificationSettings || {
      emailNotifications: true,
      leaveReminders: true,
      payrollAlerts: true,
      announcementAlerts: true,
    };

    return NextResponse.json({
      notificationSettings,
    });

  } catch (error) {
    console.error('Get notification settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateNotificationSettings(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const { notificationSettings } = await req.json();
    
    // Get current user
    const currentUser = await User.findById(user.userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update notification settings
    currentUser.notificationSettings = {
      emailNotifications: notificationSettings.emailNotifications || false,
      leaveReminders: notificationSettings.leaveReminders || false,
      payrollAlerts: notificationSettings.payrollAlerts || false,
      announcementAlerts: notificationSettings.announcementAlerts || false,
    };

    await currentUser.save();

    return NextResponse.json({
      message: 'Notification settings updated successfully',
      notificationSettings: currentUser.notificationSettings,
    });

  } catch (error) {
    console.error('Update notification settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getNotificationSettings);
export const PUT = requireAuth(updateNotificationSettings);
