export function hasValidCoordinates(
  latitude?: number | null,
  longitude?: number | null
): boolean {
  if (latitude == null || longitude == null) return false;
  const lat = Number(latitude);
  const lng = Number(longitude);
  return !Number.isNaN(lat) && !Number.isNaN(lng);
}

export function formatAttendanceLocationText(
  latitude?: number | null,
  longitude?: number | null
): string {
  if (!hasValidCoordinates(latitude, longitude)) return '-';
  return `${Number(latitude)} - ${Number(longitude)}`;
}
