import mongoose, { Document, Schema } from 'mongoose';

export interface IPerformance extends Document {
  employeeId: string;
  reviewPeriod: {
    startDate: Date;
    endDate: Date;
  };
  goals: {
    description: string;
    target: string;
    achieved: string;
    rating: number; // 1-5 scale
  }[];
  competencies: {
    skill: string;
    rating: number; // 1-5 scale
    comments: string;
  }[];
  overallRating: number; // 1-5 scale
  strengths: string[];
  areasForImprovement: string[];
  reviewerComments: string;
  employeeComments?: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  reviewedBy: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceSchema: Schema = new Schema({
  employeeId: {
    type: String,
    ref: 'Employee',
    required: true,
  },
  reviewPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  goals: [{
    description: { type: String, required: true },
    target: { type: String, required: true },
    achieved: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
  }],
  competencies: [{
    skill: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comments: { type: String, required: true },
  }],
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  strengths: [{
    type: String,
  }],
  areasForImprovement: [{
    type: String,
  }],
  reviewerComments: {
    type: String,
    required: true,
  },
  employeeComments: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'approved'],
    default: 'draft',
  },
  reviewedBy: {
    type: String,
    ref: 'Employee',
    required: true,
  },
  reviewedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Performance || mongoose.model<IPerformance>('Performance', PerformanceSchema);
