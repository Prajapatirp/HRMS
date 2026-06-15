'use client';

import React from 'react';
import { hasValidCoordinates } from '@/lib/attendanceLocation';

interface AttendanceLocationCellProps {
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
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
