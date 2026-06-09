'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import DynamicModal from '@/components/ui/dynamic-modal';
import { Clock, CheckCircle, XCircle, Info, MapPin, AlertCircle } from 'lucide-react';

interface CheckInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: () => Promise<boolean>;
  onCheckOut: () => Promise<boolean>;
  canCheckIn: boolean;
  canCheckOut: boolean;
  checkingIn: boolean;
  checkingOut: boolean;
  locationError?: string | null;
  onClearError?: () => void;
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
  locationError,
  onClearError,
  todayAttendance,
}: CheckInOutModalProps) {
  const handleClose = () => {
    onClearError?.();
    onClose();
  };

  const handleCheckIn = async () => {
    const success = await onCheckIn();
    if (success) {
      handleClose();
    }
  };

  const handleCheckOut = async () => {
    const success = await onCheckOut();
    if (success) {
      handleClose();
    }
  };

  const isAttendanceComplete = !!(todayAttendance?.checkIn && todayAttendance?.checkOut);

  return (
    <DynamicModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Check In / Check Out"
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
          <p>Your current location will be captured when you check in or check out.</p>
        </div>

        {locationError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{locationError}</p>
          </div>
        )}

        {todayAttendance && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Today&apos;s Status</h3>
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

        <div className="space-y-3">
          {canCheckIn && !isAttendanceComplete && (
            <Button
              onClick={handleCheckIn}
              disabled={checkingIn || checkingOut || isAttendanceComplete}
              className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="h-4 w-4" />
              <span>
                {checkingIn ? 'Fetching location...' : 'Check In'}
              </span>
            </Button>
          )}

          {canCheckOut && !isAttendanceComplete && (
            <Button
              onClick={handleCheckOut}
              disabled={checkingIn || checkingOut || isAttendanceComplete}
              variant="destructive"
              className="w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="h-4 w-4" />
              <span>
                {checkingOut ? 'Fetching location...' : 'Check Out'}
              </span>
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
