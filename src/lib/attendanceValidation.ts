export interface LocationPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export function parseLocationPayload(body: {
  latitude?: unknown;
  longitude?: unknown;
  accuracy?: unknown;
}): { valid: true; location: LocationPayload } | { valid: false; error: string } {
  const { latitude, longitude, accuracy } = body;

  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    return {
      valid: false,
      error: 'Latitude and longitude are required for this operation.',
    };
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return {
      valid: false,
      error: 'Latitude and longitude must be valid numbers.',
    };
  }

  if (lat < -90 || lat > 90) {
    return {
      valid: false,
      error: 'Latitude must be between -90 and 90.',
    };
  }

  if (lng < -180 || lng > 180) {
    return {
      valid: false,
      error: 'Longitude must be between -180 and 180.',
    };
  }

  const location: LocationPayload = { latitude: lat, longitude: lng };

  if (accuracy !== undefined && accuracy !== null && accuracy !== '') {
    const acc = Number(accuracy);
    if (!Number.isNaN(acc) && acc >= 0) {
      location.accuracy = acc;
    }
  }

  return { valid: true, location };
}
