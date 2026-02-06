import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import Employee from '@/models/Employee';
import { requireAuth } from '@/middleware/auth';
import { sendTicketCreatedEmailToAdmin } from '@/lib/email';

async function getTickets(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;

    const ticketType = searchParams.get('ticketType');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = {};
    
    // If user is not admin, only show their own tickets
    if (user.role !== 'admin' && user.role !== 'hr') {
      if (!user.employeeId) {
        return NextResponse.json(
          { error: 'Employee ID not found' },
          { status: 400 }
        );
      }
      query.employeeId = user.employeeId;
    }

    if (ticketType) {
      query.ticketType = ticketType;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateTime;
      }
    }

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Ticket.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createTicket(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    
    if (!user.employeeId) {
      return NextResponse.json(
        { error: 'Employee ID not found. Please contact HR to set up your employee profile.' },
        { status: 400 }
      );
    }

    const { ticketType, subject, description, priority, date } = await req.json();

    if (!ticketType || !subject || !description || !priority) {
      return NextResponse.json(
        { error: 'All required fields are required' },
        { status: 400 }
      );
    }

    // Get employee details
    const employee = await Employee.findOne({ employeeId: user.employeeId });
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Generate unique ticket ID
    let ticketId: string = '';
    let isUnique = false;
    while (!isUnique) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      ticketId = `T${timestamp.toString().slice(-6)}${random}`;
      
      // Check if ticket ID already exists
      const existingTicket = await Ticket.findOne({ ticketId });
      if (!existingTicket) {
        isUnique = true;
      }
    }

    // Create ticket with initial track history
    const ticket = new Ticket({
      ticketId,
      employeeId: user.employeeId,
      employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
      ticketType,
      subject,
      description,
      priority,
      date: date ? new Date(date) : undefined,
      status: 'Open',
      trackHistory: [{
        status: 'Open',
        date: new Date(),
      }],
    });

    await ticket.save();

    // Send email to all admin users
    try {
      const adminUsers = await User.find({ role: 'admin', isActive: true });
      for (const admin of adminUsers) {
        await sendTicketCreatedEmailToAdmin(
          admin.email,
          ticketId,
          ticket.employeeName,
          ticketType,
          subject,
          priority
        );
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Ticket created successfully',
      ticket,
    }, { status: 201 });

  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getTickets);
export const POST = requireAuth(createTicket);
