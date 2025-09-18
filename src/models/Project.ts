import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'completed';
  startDate?: Date;
  endDate?: Date;
  createdBy: string; // Admin/HR who created the project
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active',
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  createdBy: {
    type: String,
    required: true,
    ref: 'User',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
