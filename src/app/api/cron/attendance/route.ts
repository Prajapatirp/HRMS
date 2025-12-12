import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import { sendCheckoutReminderEmail } from '@/lib/email';

// This endpoint should be called by a cron job service
// For Vercel, you can use Vercel Cron Jobs
// For other platforms, use a cron service like cron-job.org or EasyCron
// Schedule: Daily at 11:30 PM for reminders, and at 12:00 AM for auto-checkout

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if it's around 11:30 PM (for reminders) or 12:00 AM (for auto-checkout)
    const isReminderTime = currentHour === 23 && currentMinute >= 30;
    const isAutoCheckoutTime = currentHour === 0 && currentMinute < 5;
    
    if (!isReminderTime && !isAutoCheckoutTime) {
      return NextResponse.json({
        message: 'Not the scheduled time for attendance processing',
        currentTime: now.toISOString(),
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const isWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 6; // Monday to Saturday

    // Get all active employees
    const employees = await Employee.find({ status: 'active' });
    
    let processedCount = 0;
    let absentCount = 0;
    let halfDayCount = 0;
    let reminderCount = 0;
    let autoCheckoutCount = 0;

    for (const employee of employees) {
      // Find today's attendance record
      let attendance = await Attendance.findOne({
        employeeId: employee.employeeId,
        date: today,
      });

      // If it's a working day and no attendance record exists, mark as absent
      if (isWorkingDay && !attendance) {
        attendance = new Attendance({
          employeeId: employee.employeeId,
          date: today,
          status: 'absent',
        });
        await attendance.save();
        absentCount++;
        processedCount++;
        continue;
      }

      // If attendance exists, process it
      if (attendance) {
        // If check-in exists but no check-out
        if (attendance.checkIn && !attendance.checkOut) {
          if (isReminderTime && !attendance.reminderSent) {
            // Send reminder email
            try {
              await sendCheckoutReminderEmail(
                employee.personalInfo.email,
                `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`
              );
              attendance.reminderSent = true;
              await attendance.save();
              reminderCount++;
              processedCount++;
            } catch (error) {
              console.error(`Failed to send reminder to ${employee.employeeId}:`, error);
            }
          } else if (isAutoCheckoutTime) {
            // Auto-checkout at midnight (but mark as not counted)
            const checkOutTime = new Date();
            checkOutTime.setHours(23, 59, 59, 0); // Set to end of day
            
            attendance.checkOut = checkOutTime;
            attendance.autoCheckout = true;
            
            // Calculate hours but mark as auto-checkout
            const checkInTime = new Date(attendance.checkIn);
            const diffMs = checkOutTime.getTime() - checkInTime.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            
            attendance.totalHours = Math.round(diffHours * 100) / 100;
            
            // Don't calculate overtime for auto-checkout
            attendance.overtimeHours = 0;
            
            // Update status based on hours (but note it's auto-checkout)
            if (diffHours < 5) {
              attendance.status = 'half-day';
              halfDayCount++;
            } else {
              // Even if hours are >= 5, mark as half-day since it's auto-checkout
              // Or you can keep it as present but note it's auto-checkout
              // For now, we'll keep the status as is but mark autoCheckout
            }
            
            await attendance.save();
            autoCheckoutCount++;
            processedCount++;
          }
        } else if (attendance.checkIn && attendance.checkOut && !attendance.autoCheckout) {
          // Check if working hours are less than 5 hours (half-day)
          // Recalculate hours to ensure accuracy
          const checkInTime = new Date(attendance.checkIn);
          const checkOutTime = new Date(attendance.checkOut);
          const diffMs = checkOutTime.getTime() - checkInTime.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          const calculatedHours = Math.round(diffHours * 100) / 100;
          
          // Update total hours if different
          if (attendance.totalHours !== calculatedHours) {
            attendance.totalHours = calculatedHours;
          }
          
          // Update status if hours < 5 and currently marked as present
          if (calculatedHours < 5 && attendance.status === 'present') {
            attendance.status = 'half-day';
            await attendance.save();
            halfDayCount++;
            processedCount++;
          } else if (calculatedHours >= 5 && attendance.status === 'half-day' && !attendance.autoCheckout) {
            // If hours are >= 5 and was marked as half-day (but not auto-checkout), update to present
            attendance.status = 'present';
            await attendance.save();
            processedCount++;
          }
        } else if (!attendance.checkIn && isWorkingDay) {
          // No check-in on a working day - ensure it's marked as absent
          if (attendance.status !== 'absent') {
            attendance.status = 'absent';
            await attendance.save();
            absentCount++;
            processedCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance processing completed',
      processed: processedCount,
      absent: absentCount,
      halfDay: halfDayCount,
      remindersSent: reminderCount,
      autoCheckouts: autoCheckoutCount,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('Cron attendance processing error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}

