export type GeolocationErrorCode =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NOT_SUPPORTED';

export class GeolocationError extends Error {
  code: GeolocationErrorCode;

  constructor(code: GeolocationErrorCode, message: string) {
    super(message);
    this.name = 'GeolocationError';
    this.code = code;
  }
}

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

export async function getCurrentLocation(): Promise<CurrentLocation> {
  if (typeof window === 'undefined') {
    throw new GeolocationError(
      'NOT_SUPPORTED',
      'Location services are not available in this environment.'
    );
  }

  if (!navigator.geolocation) {
    throw new GeolocationError(
      'NOT_SUPPORTED',
      'Your browser does not support location services.'
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new GeolocationError(
                'PERMISSION_DENIED',
                'Location permission was denied.'
              )
            );
            break;
          case error.POSITION_UNAVAILABLE:
            reject(
              new GeolocationError(
                'POSITION_UNAVAILABLE',
                'GPS/location service is disabled or unavailable. Please enable location services and try again.'
              )
            );
            break;
          case error.TIMEOUT:
            reject(
              new GeolocationError(
                'TIMEOUT',
                'Unable to determine your location. Please try again.'
              )
            );
            break;
          default:
            reject(
              new GeolocationError(
                'POSITION_UNAVAILABLE',
                'Unable to determine your location. Please try again.'
              )
            );
        }
      },
      GEO_OPTIONS
    );
  });
}

export function isGeolocationError(error: unknown): error is GeolocationError {
  return error instanceof GeolocationError;
}

export function getGeolocationErrorMessage(
  error: GeolocationError,
  action: 'check-in' | 'check-out'
): string {
  if (error.code === 'PERMISSION_DENIED') {
    return action === 'check-in'
      ? 'Location access is required to perform check-in.'
      : 'Location access is required to perform check-out.';
  }

  return error.message;
}
