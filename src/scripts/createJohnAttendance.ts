import connectDB from '../lib/mongodb';
import Attendance from '../models/Attendance';

async function createJohnAttendance() {
  try {
    await connectDB();
    
    const johnEmployeeId = 'EMP1758094397026';
    
    // Check if attendance records already exist
    const existingCount = await Attendance.countDocuments({ employeeId: johnEmployeeId });
    if (existingCount > 0) {
      console.log(`✅ John already has ${existingCount} attendance records!`);
      return;
    }

    // Create attendance records for the past 30 days
    const attendanceRecords = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }
      
      // Randomly determine attendance status (90% present, 5% late, 5% absent)
      const random = Math.random();
      let status = 'present';
      let checkIn, checkOut, totalHours, overtimeHours;
      
      if (random < 0.9) {
        // Present
        status = 'present';
        checkIn = new Date(date);
        checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0); // 9:00-9:30 AM
        
        checkOut = new Date(date);
        checkOut.setHours(17, Math.floor(Math.random() * 60), 0, 0); // 5:00-6:00 PM
        
        const diffMs = checkOut.getTime() - checkIn.getTime();
        totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        
        if (totalHours > 8) {
          overtimeHours = Math.round((totalHours - 8) * 100) / 100;
        }
      } else if (random < 0.95) {
        // Late
        status = 'late';
        checkIn = new Date(date);
        checkIn.setHours(10, Math.floor(Math.random() * 60), 0, 0); // 10:00-11:00 AM
        
        checkOut = new Date(date);
        checkOut.setHours(18, Math.floor(Math.random() * 60), 0, 0); // 6:00-7:00 PM
        
        const diffMs = checkOut.getTime() - checkIn.getTime();
        totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        
        if (totalHours > 8) {
          overtimeHours = Math.round((totalHours - 8) * 100) / 100;
        }
      } else {
        // Absent
        status = 'absent';
        checkIn = null;
        checkOut = null;
        totalHours = 0;
        overtimeHours = 0;
      }
      
      const attendance = new Attendance({
        employeeId: johnEmployeeId,
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        checkIn: checkIn,
        checkOut: checkOut,
        totalHours: totalHours,
        overtimeHours: overtimeHours,
        status: status,
        notes: status === 'late' ? 'Traffic delay' : undefined,
      });
      
      attendanceRecords.push(attendance);
    }
    
    // Save all attendance records
    await Attendance.insertMany(attendanceRecords);
    
    console.log(`✅ Created ${attendanceRecords.length} attendance records for John!`);
    console.log(`📅 Date range: ${attendanceRecords[attendanceRecords.length - 1].date.toDateString()} to ${attendanceRecords[0].date.toDateString()}`);
    console.log('');
    console.log('📊 Summary:');
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    console.log(`- Present: ${presentCount} days`);
    console.log(`- Late: ${lateCount} days`);
    console.log(`- Absent: ${absentCount} days`);
    console.log('');
    console.log('🎉 John can now test the attendance filtering and pagination!');
    
  } catch (error) {
    console.error('❌ Error creating John attendance:', error);
  }
}

createJohnAttendance();
