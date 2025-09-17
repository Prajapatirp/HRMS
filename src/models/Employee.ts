import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  jobInfo: {
    department: string;
    designation: string;
    reportingManager?: string;
    employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
    joiningDate: Date;
    salary: number;
    workLocation: string;
  };
  status: 'active' | 'inactive' | 'terminated';
  documents: {
    resume?: string;
    idProof?: string;
    addressProof?: string;
    other?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema: Schema = new Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
  },
  personalInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
    },
  },
  jobInfo: {
    department: { type: String, required: true },
    designation: { type: String, required: true },
    reportingManager: { type: String, ref: 'Employee' },
    employmentType: { 
      type: String, 
      enum: ['full-time', 'part-time', 'contract', 'intern'],
      required: true 
    },
    joiningDate: { type: Date, required: true },
    salary: { type: Number, required: true },
    workLocation: { type: String, required: true },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated'],
    default: 'active',
  },
  documents: {
    resume: { type: String },
    idProof: { type: String },
    addressProof: { type: String },
    other: [{ type: String }],
  },
}, {
  timestamps: true,
});

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
