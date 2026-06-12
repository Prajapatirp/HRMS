import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Holiday from '@/models/Holiday';
import { verifyToken } from '@/lib/auth';

function normalizeDate(dateInput: string | Date) {
  const date = new Date(dateInput);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const upcoming = searchParams.get('upcoming') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: Record<string, unknown> = {};

    if (upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    } else if (year) {
      const yearNum = parseInt(year);
      query.date = {
        $gte: new Date(yearNum, 0, 1),
        $lte: new Date(yearNum, 11, 31, 23, 59, 59, 999),
      };
    }

    const skip = (page - 1) * limit;

    const [holidays, total] = await Promise.all([
      Holiday.find(query).sort({ date: 1 }).skip(skip).limit(limit),
      Holiday.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      holidays,
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
    console.error('Error fetching holidays:', error);
    return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, date, description } = body;

    if (!name?.trim() || !date) {
      return NextResponse.json(
        { error: 'Holiday name and date are required' },
        { status: 400 }
      );
    }

    const holidayDate = normalizeDate(date);

    const existing = await Holiday.findOne({ date: holidayDate });
    if (existing) {
      return NextResponse.json(
        { error: 'A holiday already exists on this date' },
        { status: 400 }
      );
    }

    const holiday = await Holiday.create({
      name: name.trim(),
      date: holidayDate,
      description: description?.trim() || undefined,
      createdBy: decoded.userId,
    });

    return NextResponse.json(
      { message: 'Holiday created successfully', holiday },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating holiday:', error);
    return NextResponse.json({ error: 'Failed to create holiday' }, { status: 500 });
  }
}
