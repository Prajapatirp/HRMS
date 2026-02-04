'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Menu, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CheckInOutModal from '@/components/attendance/CheckInOutModal';

interface HeaderProps {
  onMenuClick: () => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  overtimeHours?: number;
  status: string;
}

export default function Header({ onMenuClick, onToggleSidebar, sidebarCollapsed }: HeaderProps) {
  const { user, token } = useAuth();
  const [checkInOutModalOpen, setCheckInOutModalOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);

  // Fetch today's attendance to determine check-in/out status
  const fetchTodayAttendance = React.useCallback(async () => {
    if (!token || !user?.employeeId) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const response = await fetch(`/api/attendance?date=${todayStr}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Find today's record - check both ISO date string and Date object
        const todayRecord = data.attendance?.find((record: AttendanceRecord) => {
          if (!record.date) return false;
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          const recordDateStr = recordDate.toISOString().split('T')[0];
          return recordDateStr === todayStr;
        });
        
        // If no record found, try to get the first record if only one exists
        if (!todayRecord && data.attendance && data.attendance.length === 1) {
          const singleRecord = data.attendance[0];
          const recordDate = new Date(singleRecord.date);
          recordDate.setHours(0, 0, 0, 0);
          const recordDateStr = recordDate.toISOString().split('T')[0];
          if (recordDateStr === todayStr) {
            setTodayAttendance(singleRecord);
            return;
          }
        }
        
        setTodayAttendance(todayRecord || null);
      } else {
        console.error('Failed to fetch attendance:', response.status);
        setTodayAttendance(null);
      }
    } catch (error) {
      console.error('Failed to fetch today attendance:', error);
      setTodayAttendance(null);
    }
  }, [token, user?.employeeId]);

  useEffect(() => {
    if (token && user?.employeeId) {
      fetchTodayAttendance();
    }
  }, [token, user?.employeeId, fetchTodayAttendance]);

  // Refresh attendance when modal opens (as backup)
  useEffect(() => {
    if (checkInOutModalOpen && token && user?.employeeId) {
      // Small delay to ensure modal is open before fetching
      const timer = setTimeout(() => {
        fetchTodayAttendance();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [checkInOutModalOpen, token, user?.employeeId, fetchTodayAttendance]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        await fetchTodayAttendance();
      } else {
        const errorData = await response.json();
        console.error('Check-in failed:', errorData.error);
        alert(`Check-in failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      alert('Check-in failed. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        await fetchTodayAttendance();
      } else {
        const errorData = await response.json();
        console.error('Check-out failed:', errorData.error);
        alert(`Check-out failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Check-out failed:', error);
      alert('Check-out failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const canCheckIn = !todayAttendance?.checkIn;
  const canCheckOut = !!(todayAttendance?.checkIn && !todayAttendance?.checkOut);

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="outline"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden bg-gray-50 hover:bg-gray-100 hover:text-blue-600 border border-gray-200 rounded-md transition-colors"
              aria-label="Toggle menu"
              title="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Desktop sidebar toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleSidebar}
              className="hidden md:flex bg-gray-50 hover:bg-gray-100 hover:text-blue-600 border border-gray-200 rounded-md transition-colors"
              aria-label="Toggle sidebar"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
            
            {/* <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employees, departments..."
                className="pl-10 w-64 lg:w-80"
              />
            </div> */}
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Check In/Out Button - Only show for employees (not admins) */}
            {user?.employeeId && user?.role !== 'admin' && (
              <Button
                variant="outline"
                onClick={async () => {
                  // Fetch latest attendance data first, then open modal
                  if (token && user?.employeeId) {
                    await fetchTodayAttendance();
                  }
                  setCheckInOutModalOpen(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-600 rounded-md transition-colors"
                title="Check In / Check Out"
              >
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Check In/Out</span>
              </Button>
            )}
            
            <Button variant="outline" size="icon" className="relative bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </Button>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Check In/Out Modal */}
      {user?.employeeId && user?.role !== 'admin' && (
        <CheckInOutModal
          isOpen={checkInOutModalOpen}
          onClose={() => setCheckInOutModalOpen(false)}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          canCheckIn={canCheckIn}
          canCheckOut={canCheckOut}
          checkingIn={checkingIn}
          checkingOut={checkingOut}
          todayAttendance={todayAttendance}
        />
      )}
    </>
  );
}
