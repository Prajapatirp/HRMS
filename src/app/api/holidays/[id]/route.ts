import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Holiday from '@/models/Holiday';
import { verifyToken } from '@/lib/auth';

function normalizeDate(dateInput: string | Date) {
  const date = new Date(dateInput);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'hr')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, date, description } = body;

    if (date) {
      const holidayDate = normalizeDate(date);
      const duplicate = await Holiday.findOne({
        date: holidayDate,
        _id: { $ne: id },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'A holiday already exists on this date' },
          { status: 400 }
        );
      }
      holiday.date = holidayDate;
    }

    if (name !== undefined) holiday.name = name.trim();
    if (description !== undefined) holiday.description = description?.trim() || undefined;

    await holiday.save();

    return NextResponse.json({ message: 'Holiday updated successfully', holiday });
  } catch (error) {
    console.error('Error updating holiday:', error);
    return NextResponse.json({ error: 'Failed to update holiday' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'hr')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const holiday = await Holiday.findByIdAndDelete(id);
    if (!holiday) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 });
  }
}
