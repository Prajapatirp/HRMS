'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
}

interface AttendanceCalendarProps {
  attendance: AttendanceRecord[];
  loading?: boolean;
  employeeId?: string;
  token?: string | any;
  onMonthChange?: (year: number, month: number) => void;
}

export default function AttendanceCalendar({
  attendance,
  loading = false,
  token,
  onMonthChange,
}: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarAttendance, setCalendarAttendance] = useState<Map<string, string>>(new Map());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Convert attendance array to a map for quick lookup
  useEffect(() => {
    const attendanceMap = new Map<string, string>();
    attendance.forEach((record) => {
      // Handle both string and Date objects
      const recordDate = typeof record.date === 'string' ? new Date(record.date) : new Date(record.date);
      // Normalize to YYYY-MM-DD format
      const year = recordDate.getFullYear();
      const month = String(recordDate.getMonth() + 1).padStart(2, '0');
      const day = String(recordDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      attendanceMap.set(dateKey, record.status);
    });
    setCalendarAttendance(attendanceMap);
  }, [attendance]);

  // Fetch attendance for the current month
  useEffect(() => {
    if (token && onMonthChange) {
      onMonthChange(year, month + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days: (number | null)[] = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500 hover:bg-green-600 shadow-sm';
      case 'absent':
        return 'bg-red-500 hover:bg-red-600 shadow-sm';
      case 'late':
        return 'bg-yellow-500 hover:bg-yellow-600 shadow-sm';
      case 'half-day':
        return 'bg-blue-500 hover:bg-blue-600 shadow-sm';
      case 'holiday':
        return 'bg-purple-500 hover:bg-purple-600 shadow-sm';
      default:
        return 'bg-gray-200 hover:bg-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'Late';
      case 'half-day':
        return 'Half Day';
      case 'holiday':
        return 'Holiday';
      default:
        return '';
    }
  };

  const formatDateKey = (day: number) => {
    const date = new Date(year, month, day);
    // Normalize to YYYY-MM-DD format to match the map keys
    const dateYear = date.getFullYear();
    const dateMonth = String(date.getMonth() + 1).padStart(2, '0');
    const dateDay = String(date.getDate()).padStart(2, '0');
    return `${dateYear}-${dateMonth}-${dateDay}`;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="p-1 h-7 w-7"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <h3 className="text-sm font-semibold text-gray-900 min-w-[140px] text-center">
            {monthNames[month]} {year}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="p-1 h-7 w-7"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="text-xs h-7 px-2.5"
        >
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50/80 border-b border-gray-200">
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-1 text-center text-[10px] font-semibold text-gray-600 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 bg-white">
          {days.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="h-8 border-r border-b border-gray-200 last:border-r-0 bg-gray-50/50"
                />
              );
            }

            const dateKey = formatDateKey(day);
            const status = calendarAttendance.get(dateKey);
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`
                  h-8 border-r border-b border-gray-200 last:border-r-0 p-0.5
                  ${isToday ? 'bg-blue-50/50' : ''}
                  ${loading ? 'opacity-50' : ''}
                `}
              >
                <div
                  className={`
                    w-full h-full rounded-md flex items-center justify-center
                    ${status ? getStatusColor(status) : 'bg-gray-50 hover:bg-gray-100'}
                    ${status ? 'text-white font-medium shadow-sm' : 'text-gray-700'}
                    transition-all cursor-pointer text-[10px]
                    ${isToday && !status ? 'ring-2 ring-blue-400 ring-inset' : ''}
                    ${isToday && status ? 'ring-2 ring-blue-300 ring-inset' : ''}
                    ${loading ? 'animate-pulse' : 'hover:scale-105'}
                  `}
                  title={status ? `${day} ${monthNames[month]} - ${getStatusLabel(status)}` : `${day} ${monthNames[month]}`}
                >
                  {day}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[10px]">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded bg-green-500 shadow-sm"></div>
          <span className="text-gray-700">Present</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded bg-red-500 shadow-sm"></div>
          <span className="text-gray-700">Absent</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded bg-yellow-500 shadow-sm"></div>
          <span className="text-gray-700">Late</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded bg-blue-500 shadow-sm"></div>
          <span className="text-gray-700">Half Day</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded bg-purple-500 shadow-sm"></div>
          <span className="text-gray-700">Holiday</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded bg-gray-200 border border-gray-300"></div>
          <span className="text-gray-700">No Record</span>
        </div>
      </div>
    </div>
  );
}

