import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  employeeId?: string;
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  notificationSettings?: {
    emailNotifications: boolean;
    leaveReminders: boolean;
    payrollAlerts: boolean;
    announcementAlerts: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['admin', 'hr', 'manager', 'employee'],
    default: 'employee',
  },
  employeeId: {
    type: String,
    ref: 'Employee',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  notificationSettings: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    leaveReminders: {
      type: Boolean,
      default: true,
    },
    payrollAlerts: {
      type: Boolean,
      default: true,
    },
    announcementAlerts: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
