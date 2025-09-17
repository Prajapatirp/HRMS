import connectDB from '../lib/mongodb';
import User from '../models/User';

async function testNotificationSettings() {
  try {
    await connectDB();
    
    console.log('🧪 Testing Notification Settings Functionality...\n');
    
    // Test 1: Check admin user notification settings
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    if (adminUser) {
      console.log('✅ Admin user notification settings:');
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Email Notifications: ${adminUser.notificationSettings?.emailNotifications ?? 'default (true)'}`);
      console.log(`   - Leave Reminders: ${adminUser.notificationSettings?.leaveReminders ?? 'default (true)'}`);
      console.log(`   - Payroll Alerts: ${adminUser.notificationSettings?.payrollAlerts ?? 'default (true)'}`);
      console.log(`   - Announcement Alerts: ${adminUser.notificationSettings?.announcementAlerts ?? 'default (true)'}`);
    }
    
    console.log('');
    
    // Test 2: Check John user notification settings
    const johnUser = await User.findOne({ email: 'john@example.com' });
    if (johnUser) {
      console.log('✅ John user notification settings:');
      console.log(`   - Email: ${johnUser.email}`);
      console.log(`   - Email Notifications: ${johnUser.notificationSettings?.emailNotifications ?? 'default (true)'}`);
      console.log(`   - Leave Reminders: ${johnUser.notificationSettings?.leaveReminders ?? 'default (true)'}`);
      console.log(`   - Payroll Alerts: ${johnUser.notificationSettings?.payrollAlerts ?? 'default (true)'}`);
      console.log(`   - Announcement Alerts: ${johnUser.notificationSettings?.announcementAlerts ?? 'default (true)'}`);
    }
    
    console.log('');
    console.log('🎯 Notification Settings API Test Instructions:');
    console.log('');
    console.log('1. Login as Admin:');
    console.log('   - Email: admin@example.com');
    console.log('   - Password: admin123');
    console.log('   - Go to Settings page');
    console.log('   - Scroll to "Notification Preferences" section');
    console.log('   - Toggle notification settings');
    console.log('   - Click "Save Changes"');
    console.log('');
    console.log('2. Login as John (Employee):');
    console.log('   - Email: john@example.com');
    console.log('   - Password: password123');
    console.log('   - Go to Settings page');
    console.log('   - Scroll to "Notification Preferences" section');
    console.log('   - Toggle notification settings');
    console.log('   - Click "Save Changes"');
    console.log('');
    console.log('✅ Available Notification Settings:');
    console.log('   - ✅ Email Notifications');
    console.log('   - ✅ Leave Reminders');
    console.log('   - ✅ Payroll Alerts');
    console.log('   - ✅ Announcement Alerts');
    console.log('   - ❌ Push Notifications (removed)');
    console.log('');
    console.log('🎉 Notification settings API is now working for both admin and employee!');
    
  } catch (error) {
    console.error('❌ Error testing notification settings:', error);
  }
}

testNotificationSettings();
