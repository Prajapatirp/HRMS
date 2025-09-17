import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  totalHours?: number;
  overtimeHours?: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema({
  employeeId: {
    type: String,
    ref: 'Employee',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  checkIn: {
    type: Date,
  },
  checkOut: {
    type: Date,
  },
  totalHours: {
    type: Number,
    default: 0,
  },
  overtimeHours: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'holiday'],
    default: 'absent',
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Compound index to ensure one attendance record per employee per day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
