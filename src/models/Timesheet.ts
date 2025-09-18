import mongoose, { Document, Schema } from 'mongoose';

export interface ITimesheet extends Document {
  employeeId: string;
  employeeName: string;
  timesheetDate: Date;
  hours: number;
  projectId: string;
  projectName: string;
  taskDetails: string;
  planForTomorrow?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimesheetSchema: Schema = new Schema({
  employeeId: {
    type: String,
    required: true,
    ref: 'Employee',
  },
  employeeName: {
    type: String,
    required: true,
  },
  timesheetDate: {
    type: Date,
    required: true,
  },
  hours: {
    type: Number,
    required: true,
    min: 0,
    max: 24,
  },
  projectId: {
    type: String,
    required: true,
    ref: 'Project',
  },
  projectName: {
    type: String,
    required: true,
  },
  taskDetails: {
    type: String,
    required: true,
    trim: true,
  },
  planForTomorrow: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft',
  },
  submittedAt: {
    type: Date,
  },
  approvedBy: {
    type: String,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
TimesheetSchema.index({ employeeId: 1, timesheetDate: 1 });
TimesheetSchema.index({ projectId: 1 });
TimesheetSchema.index({ status: 1 });

export default mongoose.models.Timesheet || mongoose.model<ITimesheet>('Timesheet', TimesheetSchema);
