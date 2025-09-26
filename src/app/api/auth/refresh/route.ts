import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken, verifyToken, extractTokenFromHeader } from '@/lib/auth';

export async function POST(request: NextRequest | any | string | null) {
  try {
    await connectDB();
    
    const token = extractTokenFromHeader(request.headers.get('authorization') as string | undefined | any);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      );
    }

    // Verify the current token
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get the latest user data from database
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate a new token with updated user data
    const newToken = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    });

    return NextResponse.json({
      message: 'Token refreshed successfully',
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
    });

  } catch {
    console.error('Token refresh error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
