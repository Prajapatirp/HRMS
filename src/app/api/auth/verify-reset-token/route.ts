import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    let token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    // Decode the token in case it was URL encoded
    try {
      token = decodeURIComponent(token);
    } catch (e) {
      // Token might not be encoded, that's okay
      console.log('Token decode error (might not be encoded):', e);
    }
    // Trim any whitespace
    token = token.trim();

    console.log('=== TOKEN VERIFICATION DEBUG ===');
    console.log('Token received - Full length:', token.length);
    console.log('Token received - First 20 chars:', token.substring(0, 20));
    console.log('Token received - Last 20 chars:', token.substring(Math.max(0, token.length - 20)));
    console.log('Token received - Is hex?', /^[0-9a-f]+$/i.test(token));

    // Check all users with reset tokens for debugging
    const allUsersWithTokens = await User.find({ resetPasswordToken: { $exists: true, $ne: null } });
    console.log('Users with reset tokens:', allUsersWithTokens.length);
    if (allUsersWithTokens.length > 0) {
      console.log('Sample token from DB (first 20 chars):', allUsersWithTokens[0].resetPasswordToken?.substring(0, 20));
      console.log('Sample token expiry:', allUsersWithTokens[0].resetPasswordExpires);
      console.log('Is sample token expired?', allUsersWithTokens[0].resetPasswordExpires && new Date() > allUsersWithTokens[0].resetPasswordExpires);
    }

    // Find user with valid reset token - use exact match
    // First, try exact match
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // Token not expired
    });
    
    // If not found, try without expiry check to see if token exists but expired
    if (!user) {
      const userWithToken = await User.findOne({
        resetPasswordToken: token,
      });
      
      if (userWithToken) {
        console.log('Token found but expired. Expiry:', userWithToken.resetPasswordExpires);
        console.log('Current time:', new Date());
        console.log('Time difference (ms):', new Date().getTime() - (userWithToken.resetPasswordExpires?.getTime() || 0));
      }
    }

    if (!user) {
      // Try to find user with token regardless of expiry for debugging
      const userWithExpiredToken = await User.findOne({
        resetPasswordToken: token,
      });
      
      if (userWithExpiredToken) {
        console.log('Token found but expired. Expiry:', userWithExpiredToken.resetPasswordExpires);
        console.log('Current time:', new Date());
      } else {
        console.log('Token not found in database at all');
        // Try case-insensitive search
        const userCaseInsensitive = await User.findOne({
          resetPasswordToken: { $regex: new RegExp(`^${token}$`, 'i') },
        });
        if (userCaseInsensitive) {
          console.log('Token found with case-insensitive search - case mismatch!');
        }
      }
      
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    console.log('Token verified successfully for user:', user.email);
    return NextResponse.json({
      message: 'Token is valid',
      email: user.email,
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

