import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import Employee from '@/models/Employee';
import { requireAuth } from '@/middleware/auth';
import { sendTicketUpdateEmailToEmployee } from '@/lib/email';

async function getTicket(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const ticket = await Ticket.findOne({ ticketId: params.id });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this ticket
    if (user.role !== 'admin' && user.role !== 'hr' && ticket.employeeId !== user.employeeId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ ticket });

  } catch (error) {
    console.error('Get ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateTicket(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const { user } = (req as any);
    const updateData = await req.json();

    const ticket = await Ticket.findOne({ ticketId: params.id });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Employees can only update their own tickets if status is "Open"
    // Admins/HR can update any ticket
    if (user.role !== 'admin' && user.role !== 'hr') {
      if (ticket.employeeId !== user.employeeId) {
        return NextResponse.json(
          { error: 'Unauthorized. You can only update your own tickets.' },
          { status: 403 }
        );
      }
      if (ticket.status !== 'Open') {
        return NextResponse.json(
          { error: 'You can only update tickets with "Open" status.' },
          { status: 400 }
        );
      }
      // Employees can only update ticketType, subject, description, and priority
      // They cannot update status
      if (updateData.status) {
        return NextResponse.json(
          { error: 'Employees cannot change ticket status.' },
          { status: 403 }
        );
      }
      ticket.ticketType = updateData.ticketType || ticket.ticketType;
      ticket.subject = updateData.subject || ticket.subject;
      ticket.description = updateData.description || ticket.description;
      ticket.priority = updateData.priority || ticket.priority;
      if (updateData.date !== undefined) {
        ticket.date = updateData.date ? new Date(updateData.date) : undefined;
      }
    } else {
      // Admin/HR can update any field including status
      // If status is being updated, add to track history
      if (updateData.status && updateData.status !== ticket.status) {
        ticket.trackHistory.push({
          status: updateData.status,
          date: new Date(),
          note: updateData.note || undefined,
        });
      }

      // Update ticket fields
      if (updateData.status) ticket.status = updateData.status;
      if (updateData.priority) ticket.priority = updateData.priority;
      if (updateData.ticketType) ticket.ticketType = updateData.ticketType;
      if (updateData.subject) ticket.subject = updateData.subject;
      if (updateData.description) ticket.description = updateData.description;
      if (updateData.note && !updateData.status) {
        // If only note is updated, add it to the last track history entry
        if (ticket.trackHistory.length > 0) {
          ticket.trackHistory[ticket.trackHistory.length - 1].note = updateData.note;
        }
      }
    }

    await ticket.save();

    // Send email to employee about status update
    try {
      const employee = await Employee.findOne({ employeeId: ticket.employeeId });
      if (employee) {
        await sendTicketUpdateEmailToEmployee(
          employee.personalInfo.email,
          ticket.employeeName,
          ticket.ticketId,
          ticket.status,
          updateData.note
        );
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Ticket updated successfully',
      ticket,
    });

  } catch (error) {
    console.error('Update ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deleteTicket(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const { user } = (req as any);

    const ticket = await Ticket.findOne({ ticketId: params.id });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Only admin/HR can delete tickets, or the employee who created it (only if status is "Open")
    if (user.role !== 'admin' && user.role !== 'hr') {
      if (ticket.employeeId !== user.employeeId) {
        return NextResponse.json(
          { error: 'Unauthorized. You can only delete your own tickets.' },
          { status: 403 }
        );
      }
      if (ticket.status !== 'Open') {
        return NextResponse.json(
          { error: 'You can only delete tickets with "Open" status.' },
          { status: 400 }
        );
      }
    }

    await Ticket.deleteOne({ ticketId: params.id });

    return NextResponse.json({
      message: 'Ticket deleted successfully',
    });

  } catch (error) {
    console.error('Delete ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getTicket);
export const PUT = requireAuth(updateTicket);
export const DELETE = requireAuth(deleteTicket);
