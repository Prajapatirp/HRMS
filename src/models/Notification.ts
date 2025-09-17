import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'announcement';
  recipientType: 'all' | 'department' | 'individual';
  recipients: string[]; // employee IDs or department names
  isRead: boolean;
  readBy: {
    employeeId: string;
    readAt: Date;
  }[];
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'announcement'],
    default: 'info',
  },
  recipientType: {
    type: String,
    enum: ['all', 'department', 'individual'],
    required: true,
  },
  recipients: [{
    type: String,
  }],
  isRead: {
    type: Boolean,
    default: false,
  },
  readBy: [{
    employeeId: { type: String, ref: 'Employee' },
    readAt: { type: Date, default: Date.now },
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  expiresAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
