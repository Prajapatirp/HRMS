'use client';

import { useCallback, useState } from 'react';
import {
  performCheckIn,
  performCheckOut,
} from '@/lib/attendanceCheckInOut';

export function useAttendanceCheckInOut(
  token: string | null | undefined,
  onSuccess?: () => void | Promise<void>
) {
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const clearLocationError = useCallback(() => {
    setLocationError(null);
  }, []);

  const handleCheckIn = useCallback(async (): Promise<boolean> => {
    if (!token) return false;

    setLocationError(null);
    setCheckingIn(true);

    try {
      const result = await performCheckIn(token);
      if (result.success) {
        await onSuccess?.();
        return true;
      }
      setLocationError(result.error);
      return false;
    } finally {
      setCheckingIn(false);
    }
  }, [token, onSuccess]);

  const handleCheckOut = useCallback(async (): Promise<boolean> => {
    if (!token) return false;

    setLocationError(null);
    setCheckingOut(true);

    try {
      const result = await performCheckOut(token);
      if (result.success) {
        await onSuccess?.();
        return true;
      }
      setLocationError(result.error);
      return false;
    } finally {
      setCheckingOut(false);
    }
  }, [token, onSuccess]);

  return {
    checkingIn,
    checkingOut,
    locationError,
    clearLocationError,
    handleCheckIn,
    handleCheckOut,
  };
}
