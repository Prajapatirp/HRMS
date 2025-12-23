# Attendance Cron Job Setup

This document explains how to set up the automated attendance processing cron jobs.

## Features

The cron job performs the following tasks:

1. **Mark Absent**: If an employee misses check-in on working days (Monday to Saturday), they are automatically marked as absent.

2. **Mark Half-Day**: If an employee's working hours are below 5 hours, their status is automatically changed to "half-day".

3. **Check-Out Reminders**: At 11:30 PM, employees who have checked in but not checked out receive a reminder email.

4. **Auto-Checkout**: At 12:00 AM (midnight), employees who haven't checked out are automatically checked out, but this checkout is marked as `autoCheckout: true` and won't be counted in attendance calculations.

## Setup Instructions

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

If you're deploying on Vercel, the `vercel.json` file is already configured with the cron schedules:

- **11:30 PM daily**: Sends check-out reminders
- **12:00 AM daily**: Performs auto-checkout and processes attendance

Make sure to set the `CRON_SECRET` environment variable in your Vercel project settings for security.

### Option 2: External Cron Service

If you're not using Vercel, you can use external cron services like:

- **cron-job.org** (Free tier available)
- **EasyCron** (Free tier available)
- **Cronitor**
- **GitHub Actions** (for GitHub-hosted projects)

#### Setup Steps:

1. **Set Environment Variable**:
   ```env
   CRON_SECRET=your-secret-key-here
   ```

2. **Create Two Cron Jobs**:

   **Job 1 - Reminder Emails (11:30 PM daily)**:
   - URL: `https://your-domain.com/api/cron/attendance`
   - Schedule: `30 23 * * *` (11:30 PM every day)
   - Method: GET or POST
   - Headers: `Authorization: Bearer your-secret-key-here`

   **Job 2 - Auto-Checkout (12:00 AM daily)**:
   - URL: `https://your-domain.com/api/cron/attendance`
   - Schedule: `0 0 * * *` (12:00 AM every day)
   - Method: GET or POST
   - Headers: `Authorization: Bearer your-secret-key-here`

### Option 3: Manual Testing

You can manually trigger the cron job for testing:

```bash
curl -X GET "https://your-domain.com/api/cron/attendance" \
  -H "Authorization: Bearer your-secret-key-here"
```

Or use POST:

```bash
curl -X POST "https://your-domain.com/api/cron/attendance" \
  -H "Authorization: Bearer your-secret-key-here"
```

## API Endpoint

**Endpoint**: `/api/cron/attendance`

**Methods**: GET, POST

**Authentication**: 
- Header: `Authorization: Bearer {CRON_SECRET}`
- The `CRON_SECRET` must match the environment variable

**Response**:
```json
{
  "success": true,
  "message": "Attendance processing completed",
  "processed": 10,
  "absent": 2,
  "halfDay": 1,
  "remindersSent": 5,
  "autoCheckouts": 3,
  "timestamp": "2025-12-11T23:30:00.000Z"
}
```

## How It Works

### 11:30 PM - Reminder Emails

1. Finds all employees who checked in but haven't checked out
2. Sends reminder emails to those employees
3. Marks `reminderSent: true` to prevent duplicate emails

### 12:00 AM - Auto-Checkout & Processing

1. **Missing Check-Ins**: For working days (Mon-Sat), creates absent records for employees without attendance
2. **Auto-Checkout**: For employees who checked in but didn't check out:
   - Sets checkout time to 11:59 PM
   - Marks `autoCheckout: true`
   - Calculates hours but doesn't count for attendance
3. **Half-Day Detection**: Updates status to "half-day" if working hours < 5 hours
4. **Status Updates**: Processes all attendance records and updates statuses accordingly

## Database Changes

The `Attendance` model has been updated with two new fields:

- `autoCheckout`: Boolean - Indicates if checkout was automatically generated
- `reminderSent`: Boolean - Indicates if a reminder email was sent

## Email Configuration

Make sure your email settings in `src/lib/email.ts` are properly configured for sending reminder emails.

## Troubleshooting

1. **Cron job not running**: Check your cron service logs and verify the schedule
2. **Emails not sending**: Verify email configuration in `src/lib/email.ts`
3. **Unauthorized errors**: Ensure `CRON_SECRET` environment variable is set correctly
4. **Attendance not updating**: Check database connection and employee status (must be 'active')

## Notes

- The cron job only processes active employees
- Working days are defined as Monday to Saturday (Sunday is excluded)
- Auto-checkout records are marked but not counted in attendance calculations
- Half-day threshold is set to 5 hours (configurable in the code)

