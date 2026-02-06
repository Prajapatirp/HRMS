'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import DynamicModal from '@/components/ui/dynamic-modal';
import { Clock, ChevronDown } from 'lucide-react';

interface Employee {
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  notes?: string;
}

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: Employee[];
  token: string | null;
  attendanceRecord?: AttendanceRecord | null;
}

// Custom Employee Dropdown Component
function EmployeeDropdown({
  value,
  onChange,
  employees,
  placeholder = 'Select Employee',
}: {
  value: string;
  onChange: (value: string) => void;
  employees: Employee[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setOpenUpward(spaceAbove > spaceBelow || spaceBelow < 240);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const selectedButton = menuRef.current.querySelector(
        value ? `[data-employee-id="${value}"]` : '[data-employee-id="all"]'
      ) as HTMLElement;
      if (selectedButton) {
        selectedButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [isOpen, value]);

  const selectedEmployee = employees.find(emp => emp.employeeId === value);
  const displayText = selectedEmployee 
    ? `${selectedEmployee.personalInfo.firstName} ${selectedEmployee.personalInfo.lastName}`
    : placeholder;

  return (
    <div className="relative z-50 w-full" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-blue-50 border border-blue-300 text-blue-600 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer flex items-center justify-between hover:bg-blue-100 transition-colors"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            ref={menuRef}
            className={`absolute left-0 w-full bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden max-h-60 overflow-y-auto ${
              openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
            style={{ zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              {employees.map((emp) => (
                <button
                  key={emp.employeeId}
                  data-employee-id={emp.employeeId}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(emp.employeeId);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    value === emp.employeeId
                      ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-500 font-medium'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {emp.personalInfo.firstName} {emp.personalInfo.lastName}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ManualAttendanceModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  employees,
  token,
  attendanceRecord = null
}: ManualAttendanceModalProps) {
  const isEditMode = !!attendanceRecord;
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [date, setDate] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [status, setStatus] = useState('present');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && attendanceRecord) {
        // Populate form with existing attendance data
        setSelectedEmployee(attendanceRecord.employeeId);
        const recordDate = new Date(attendanceRecord.date);
        setDate(recordDate.toISOString().split('T')[0]);
        
        if (attendanceRecord.checkIn) {
          const checkInDate = new Date(attendanceRecord.checkIn);
          const hours = String(checkInDate.getHours()).padStart(2, '0');
          const minutes = String(checkInDate.getMinutes()).padStart(2, '0');
          setCheckIn(`${hours}:${minutes}`);
        } else {
          setCheckIn('');
        }
        
        if (attendanceRecord.checkOut) {
          const checkOutDate = new Date(attendanceRecord.checkOut);
          const hours = String(checkOutDate.getHours()).padStart(2, '0');
          const minutes = String(checkOutDate.getMinutes()).padStart(2, '0');
          setCheckOut(`${hours}:${minutes}`);
        } else {
          setCheckOut('');
        }
        
        setStatus(attendanceRecord.status || 'present');
        setNotes(attendanceRecord.notes || '');
      } else {
        // Set default date to today for new records
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        // Reset form
        setSelectedEmployee('');
        setCheckIn('');
        setCheckOut('');
        setStatus('present');
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, isEditMode, attendanceRecord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedEmployee) {
      setError('Please select an employee');
      setLoading(false);
      return;
    }

    if (!date) {
      setError('Please select a date');
      setLoading(false);
      return;
    }

    if (!checkIn && !checkOut) {
      setError('Please provide at least check-in or check-out time');
      setLoading(false);
      return;
    }

    try {
      if (isEditMode && attendanceRecord) {
        // Update existing attendance
        const checkInDateTime = checkIn ? `${date}T${checkIn}:00` : null;
        const checkOutDateTime = checkOut ? `${date}T${checkOut}:00` : null;

        const response = await fetch('/api/attendance/admin', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            attendanceId: attendanceRecord._id,
            checkIn: checkInDateTime,
            checkOut: checkOutDateTime,
            status: status,
            notes: notes || undefined,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          onSuccess();
          onClose();
        } else {
          setError(data.error || 'Failed to update attendance');
        }
      } else {
        // Create new attendance
        const checkInDateTime = checkIn ? `${date}T${checkIn}:00` : undefined;
        const checkOutDateTime = checkOut ? `${date}T${checkOut}:00` : undefined;

        const response = await fetch('/api/attendance/admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            employeeId: selectedEmployee,
            date: date,
            checkIn: checkInDateTime,
            checkOut: checkOutDateTime,
            status: status,
            notes: notes || undefined,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          onSuccess();
          onClose();
        } else {
          setError(data.error || 'Failed to add attendance');
        }
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} attendance:`, error);
      setError(`An error occurred while ${isEditMode ? 'updating' : 'adding'} attendance`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DynamicModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Attendance" : "Add Manual Attendance"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="employee" className="text-gray-700 mb-2 block">
              Employee <span className="text-red-500">*</span>
            </Label>
            {isEditMode ? (
              <Input
                type="text"
                value={employees.find(emp => emp.employeeId === selectedEmployee) 
                  ? `${employees.find(emp => emp.employeeId === selectedEmployee)?.personalInfo.firstName} ${employees.find(emp => emp.employeeId === selectedEmployee)?.personalInfo.lastName}`
                  : selectedEmployee}
                disabled
                className="w-full bg-gray-50"
              />
            ) : (
              <EmployeeDropdown
                value={selectedEmployee}
                onChange={setSelectedEmployee}
                employees={employees}
                placeholder="Select Employee"
              />
            )}
          </div>

          <div>
            <Label htmlFor="date" className="text-gray-700 mb-2 block">
              Date <span className="text-red-500">*</span>
            </Label>
            {isEditMode ? (
              <Input
                id="date"
                type="date"
                value={date}
                disabled
                className="w-full bg-gray-50"
              />
            ) : (
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full"
                required
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkIn" className="text-gray-700 mb-2 block">
                Check In Time
              </Label>
              <Input
                id="checkIn"
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="checkOut" className="text-gray-700 mb-2 block">
                Check Out Time
              </Label>
              <Input
                id="checkOut"
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status" className="text-gray-700 mb-2 block">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full"
              required
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half-day">Half Day</option>
              <option value="holiday">Holiday</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes" className="text-gray-700 mb-2 block">
              Notes (Optional)
            </Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Add any additional notes..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                {isEditMode ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                {isEditMode ? 'Update Attendance' : 'Add Attendance'}
              </>
            )}
          </Button>
        </div>
      </form>
    </DynamicModal>
  );
}
