'use client';

import React from 'react';

interface AttendanceLocationCellProps {
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

function hasValidCoordinates(
  latitude?: number | null,
  longitude?: number | null
): boolean {
  if (latitude == null || longitude == null) return false;
  const lat = Number(latitude);
  const lng = Number(longitude);
  return !Number.isNaN(lat) && !Number.isNaN(lng);
}

export default function AttendanceLocationCell({
  latitude,
  longitude,
  className = '',
}: AttendanceLocationCellProps) {
  if (!hasValidCoordinates(latitude, longitude)) {
    return <span className={`text-gray-500 ${className}`}>-</span>;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    <div className={`text-sm text-gray-900 leading-snug break-all ${className}`}>
      <div>{lat} -</div>
      <div>{lng}</div>
    </div>
  );
}

export function formatAttendanceLocationText(
  latitude?: number | null,
  longitude?: number | null
): string {
  if (!hasValidCoordinates(latitude, longitude)) return '-';
  return `${Number(latitude)} -\n${Number(longitude)}`;
}
