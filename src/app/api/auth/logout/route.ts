import { NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';

async function logout() {
  try {
    // The requireAuth middleware already validates the token
    // For JWT tokens, we don't need to blacklist them on the server side
    // since they have expiration times. However, we can add additional
    // server-side cleanup if needed (like clearing refresh tokens, etc.)
    
    return NextResponse.json({
      message: 'Logout successful',
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = requireAuth(logout);
