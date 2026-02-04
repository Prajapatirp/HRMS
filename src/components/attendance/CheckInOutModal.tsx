'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import DynamicModal from '@/components/ui/dynamic-modal';
import { Clock, CheckCircle, XCircle, Info } from 'lucide-react';

interface CheckInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: () => Promise<void>;
  onCheckOut: () => Promise<void>;
  canCheckIn: boolean;
  canCheckOut: boolean;
  checkingIn: boolean;
  checkingOut: boolean;
  todayAttendance?: {
    checkIn?: string;
    checkOut?: string;
    totalHours?: number;
    overtimeHours?: number;
  } | null;
}

export default function CheckInOutModal({
  isOpen,
  onClose,
  onCheckIn,
  onCheckOut,
  canCheckIn,
  canCheckOut,
  checkingIn,
  checkingOut,
  todayAttendance,
}: CheckInOutModalProps) {
  const handleCheckIn = async () => {
    await onCheckIn();
    onClose();
  };

  const handleCheckOut = async () => {
    await onCheckOut();
    onClose();
  };

  // Check if attendance is already completed
  const isAttendanceComplete = !!(todayAttendance?.checkIn && todayAttendance?.checkOut);

  return (
    <DynamicModal
      isOpen={isOpen}
      onClose={onClose}
      title="Check In / Check Out"
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        {/* Today's Status */}
        {todayAttendance && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Today's Status</h3>
            {todayAttendance.checkIn && (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700">
                  Checked in at {new Date(todayAttendance.checkIn).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            )}
            {todayAttendance.checkOut && (
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-gray-700">
                  Checked out at {new Date(todayAttendance.checkOut).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            )}
            {todayAttendance.totalHours && (
              <div className="text-sm text-gray-700">
                Total hours: {todayAttendance.totalHours.toFixed(2)}h
                {todayAttendance.overtimeHours && todayAttendance.overtimeHours > 0 && (
                  <span className="text-orange-600 ml-2">
                    (Overtime: {todayAttendance.overtimeHours.toFixed(2)}h)
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Completion Message */}
        {isAttendanceComplete && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Attendance Completed
                </p>
                <p className="text-sm text-blue-700">
                  You have already completed your check-in and check-out for today. No further action is required.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {canCheckIn && !isAttendanceComplete && (
            <Button
              onClick={handleCheckIn}
              disabled={checkingIn || isAttendanceComplete}
              className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="h-4 w-4" />
              <span>{checkingIn ? 'Checking In...' : 'Check In'}</span>
            </Button>
          )}

          {canCheckOut && !isAttendanceComplete && (
            <Button
              onClick={handleCheckOut}
              disabled={checkingOut || isAttendanceComplete}
              variant="destructive"
              className="w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="h-4 w-4" />
              <span>{checkingOut ? 'Checking Out...' : 'Check Out'}</span>
            </Button>
          )}

          {!canCheckIn && !canCheckOut && !isAttendanceComplete && (
            <div className="text-center py-4">
              <p className="text-gray-600 text-sm">
                No action available at this time.
              </p>
            </div>
          )}
        </div>
      </div>
    </DynamicModal>
  );
}
