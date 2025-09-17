import mongoose, { Document, Schema } from 'mongoose';

export interface ILeave extends Document {
  employeeId: string;
  leaveType: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'other';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema: Schema = new Schema({
  employeeId: {
    type: String,
    ref: 'Employee',
    required: true,
  },
  leaveType: {
    type: String,
    enum: ['sick', 'vacation', 'personal', 'maternity', 'paternity', 'bereavement', 'other'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  totalDays: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  approvedBy: {
    type: String,
    ref: 'Employee',
  },
  approvedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  attachments: [{
    type: String,
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);
