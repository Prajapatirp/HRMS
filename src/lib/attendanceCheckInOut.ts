import {
  getCurrentLocation,
  getGeolocationErrorMessage,
  isGeolocationError,
} from '@/lib/geolocation';

export type AttendanceActionResult =
  | { success: true }
  | { success: false; error: string };

interface AttendanceRequestOptions {
  employeeId?: string;
  notes?: string;
}

async function submitAttendanceAction(
  endpoint: '/api/attendance/check-in' | '/api/attendance/check-out',
  token: string,
  action: 'check-in' | 'check-out',
  options?: AttendanceRequestOptions
): Promise<AttendanceActionResult> {
  try {
    const location = await getCurrentLocation();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: options?.employeeId,
        notes: options?.notes,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        locationTimestamp: location.timestamp,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData.error ||
        (action === 'check-in' ? 'Check-in failed.' : 'Check-out failed.');
      return { success: false, error: message };
    }

    return { success: true };
  } catch (error) {
    if (isGeolocationError(error)) {
      return {
        success: false,
        error: getGeolocationErrorMessage(error, action),
      };
    }

    return {
      success: false,
      error:
        action === 'check-in'
          ? 'Check-in failed. Please try again.'
          : 'Check-out failed. Please try again.',
    };
  }
}

export async function performCheckIn(
  token: string,
  options?: AttendanceRequestOptions
): Promise<AttendanceActionResult> {
  return submitAttendanceAction('/api/attendance/check-in', token, 'check-in', options);
}

export async function performCheckOut(
  token: string,
  options?: AttendanceRequestOptions
): Promise<AttendanceActionResult> {
  return submitAttendanceAction('/api/attendance/check-out', token, 'check-out', options);
}
