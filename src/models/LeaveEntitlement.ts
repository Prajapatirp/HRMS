import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveEntitlement extends Document {
  employeeId: string;
  leaveType: 'pto' | 'lop' | 'comp-off' | 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'other';
  year: number;
  entitlement: number; // Total days entitled for this year
  accrued: number; // Days accrued so far
  used: number; // Days used
  pending: number; // Days pending approval
  available: number; // Available balance (accrued - used - pending)
  accrualRate: number; // Days per month (for monthly accrual)
  createdAt: Date;
  updatedAt: Date;
}

const LeaveEntitlementSchema: Schema = new Schema({
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
  year: {
    type: Number,
    required: true,
  },
  entitlement: {
    type: Number,
    required: true,
    default: 0,
  },
  accrued: {
    type: Number,
    default: 0,
  },
  used: {
    type: Number,
    default: 0,
  },
  pending: {
    type: Number,
    default: 0,
  },
  available: {
    type: Number,
    default: 0,
  },
  accrualRate: {
    type: Number,
    default: 0, // Days per month
  },
}, {
  timestamps: true,
});

// Unique constraint: one entitlement per employee, leave type, and year
LeaveEntitlementSchema.index({ employeeId: 1, leaveType: 1, year: 1 }, { unique: true });

export default mongoose.models.LeaveEntitlement || mongoose.model<ILeaveEntitlement>('LeaveEntitlement', LeaveEntitlementSchema);


