import mongoose, { Document, Schema } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: Date;
  description?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HolidaySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

HolidaySchema.index({ date: 1 });

export default mongoose.models.Holiday || mongoose.model<IHoliday>('Holiday', HolidaySchema);
