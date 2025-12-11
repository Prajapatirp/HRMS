import mongoose, { Document, Schema } from 'mongoose';

export interface ILeave extends Document {
  employeeId: string;
  leaveType: 'pto' | 'lop' | 'comp-off' | 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'other';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  partialDays?: number; // For partial day leaves
  reason: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'processed';
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  attachments?: string[];
  processedAt?: Date;
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
    enum: ['pto', 'lop', 'comp-off', 'sick', 'vacation', 'personal', 'maternity', 'paternity', 'bereavement', 'other'],
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
  partialDays: {
    type: Number,
    min: 0,
    max: 1,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled', 'processed'],
    default: 'pending',
  },
  approvedBy: {
    type: String,
    ref: 'Employee',
  },
  approvedAt: {
    type: Date,
  },
  rejectedBy: {
    type: String,
    ref: 'Employee',
  },
  rejectedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  attachments: [{
    type: String,
  }],
  processedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
LeaveSchema.index({ employeeId: 1, status: 1 });
LeaveSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);
