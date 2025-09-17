import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
    employeeId?: string;
  };
}

export const authenticateToken = (req: NextRequest): { user: any; error?: string } => {
  const token = extractTokenFromHeader(req.headers.get('authorization'));
  
  if (!token) {
    return { user: null, error: 'Access token required' };
  }

  try {
    const payload = verifyToken(token);
    return { user: payload };
  } catch (error) {
    return { user: null, error: 'Invalid or expired token' };
  }
};

export const requireAuth = (handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) => {
  return async (req: NextRequest, context?: any) => {
    const { user, error } = authenticateToken(req);
    
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    (req as AuthenticatedRequest).user = user;
    return handler(req as AuthenticatedRequest, context);
  };
};

export const requireRole = (allowedRoles: string[]) => {
  return (handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) => {
    return async (req: NextRequest, context?: any) => {
      const { user, error } = authenticateToken(req);
      
      if (error || !user) {
        return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
      }

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      (req as AuthenticatedRequest).user = user;
      return handler(req as AuthenticatedRequest, context);
    };
  };
};
