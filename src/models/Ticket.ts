import mongoose, { Document, Schema } from 'mongoose';

export interface ITicket extends Document {
  ticketId: string;
  employeeId: string;
  employeeName: string;
  ticketType: 'Work From Home' | 'Early Leave' | 'Emergency Break' | 'Support' | 'Others' | 'Hardware' | 'Suggestion' | 'Software';
  subject: string;
  description: string; // Rich text HTML
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'InProgress' | 'Closed';
  date?: Date;
  trackHistory: Array<{
    status: string;
    date: Date;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema = new Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
  },
  employeeId: {
    type: String,
    required: true,
    ref: 'Employee',
  },
  employeeName: {
    type: String,
    required: true,
  },
  ticketType: {
    type: String,
    enum: ['Work From Home', 'Early Leave', 'Emergency Break', 'Support', 'Others', 'Hardware', 'Suggestion', 'Software'],
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    required: true,
  },
  date: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    enum: ['Open', 'InProgress', 'Closed'],
    default: 'Open',
  },
  trackHistory: [{
    status: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
    },
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
