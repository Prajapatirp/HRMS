'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { CheckCircle, XCircle, Filter, User, Calendar as CalendarIcon, ChevronDown, Plus, Edit, Clock, AlertCircle, MapPin } from 'lucide-react';
import DynamicTable, { Column } from '@/components/ui/dynamic-table';
import { formatDate, formatDateTime } from '@/lib/utils';
import AttendanceCalendar from '@/components/attendance/AttendanceCalendar';
import FilterDrawer from '@/components/ui/filter-drawer';
import ManualAttendanceModal from '@/components/attendance/ManualAttendanceModal';
import AttendanceLocationCell from '@/components/attendance/AttendanceLocationCell';
import DynamicModal from '@/components/ui/dynamic-modal';
import { useAttendanceCheckInOut } from '@/hooks/useAttendanceCheckInOut';

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  totalHours?: number;
  overtimeHours?: number;
  status: string;
  notes?: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Employee {
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Custom Employee Dropdown Component
function EmployeeDropdown({
  value,
  onChange,
  employees,
  placeholder = 'All employees',
}: {
  value: string;
  onChange: (value: string) => void;
  employees: Employee[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(true);
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
      // Calculate if dropdown should open upward or downward
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        // Open upward if there's more space above or if space below is less than 240px
        setOpenUpward(spaceAbove > spaceBelow || spaceBelow < 240);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Scroll selected item into view when dropdown opens
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
              <button
                data-employee-id="all"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  value === ''
                    ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-500 font-medium'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {placeholder}
              </button>
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

export default function AdminAttendancePage() {
  const { user, token } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [personalAttendance, setPersonalAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarAttendance, setCalendarAttendance] = useState<AttendanceRecord[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarEmployeeId, setCalendarEmployeeId] = useState<string>('');
  const [manualAttendanceModalOpen, setManualAttendanceModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    'half-day': 0,
    absent: 0,
    late: 0,
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({
    employeeId: '',
    month: '',
    year: new Date().getFullYear().toString(),
    status: '',
    limit: '10'
  });

  const fetchAttendanceStats = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      // Fetch all records for statistics (no pagination)
      queryParams.append('limit', '1000'); // Large limit to get all records
      
      if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
      
      // If no month filter, default to current month
      if (!filters.month) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        queryParams.append('month', currentMonth.toString());
        queryParams.append('year', currentYear.toString());
      } else {
        if (filters.month) queryParams.append('month', filters.month);
        if (filters.year) queryParams.append('year', filters.year);
      }
      
      // Don't filter by status for statistics - we want all statuses

      const response = await fetch(`/api/attendance?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allRecords = data.attendance || [];
        setAttendanceStats({
          present: allRecords.filter((r: AttendanceRecord) => r.status === 'present').length,
          'half-day': allRecords.filter((r: AttendanceRecord) => r.status === 'half-day').length,
          absent: allRecords.filter((r: AttendanceRecord) => r.status === 'absent').length,
          late: allRecords.filter((r: AttendanceRecord) => r.status === 'late').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch attendance statistics:', error);
    }
  }, [filters.employeeId, filters.month, filters.year, token]);

  const fetchAttendance = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', filters.limit);
      if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
      
      // If no month filter, default to current month
      if (!filters.month) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        queryParams.append('month', currentMonth.toString());
        queryParams.append('year', currentYear.toString());
      } else {
        if (filters.month) queryParams.append('month', filters.month);
        if (filters.year) queryParams.append('year', filters.year);
      }
      
      if (filters.status) queryParams.append('status', filters.status);

      const response = await fetch(`/api/attendance?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        console.error('Failed to fetch attendance data');
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, [token]);

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update the token in localStorage and refresh the page
        localStorage.setItem('token', data.token);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
  }, [token]);

  const fetchPersonalAttendance = useCallback(async () => {
    try {
      const response = await fetch('/api/attendance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalAttendance(data.attendance);
      } else {
        console.error('Failed to fetch personal attendance data');
      }
    } catch (error) {
      console.error('Failed to fetch personal attendance data:', error);
    }
  }, [token]);

  const fetchCalendarAttendance = useCallback(async (year: number, month: number) => {
    try {
      setCalendarLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('month', month.toString());
      queryParams.append('year', year.toString());
      // Set a high limit to get all records for the month (max 31 days)
      queryParams.append('limit', '100');
      queryParams.append('page', '1');
      const selectedEmployeeId = calendarEmployeeId || filters.employeeId;
      if (selectedEmployeeId) {
        queryParams.append('employeeId', selectedEmployeeId);
      }

      const response = await fetch(`/api/attendance?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCalendarAttendance(data.attendance || []);
      } else {
        console.error('Failed to fetch calendar attendance data');
      }
    } catch (error) {
      console.error('Failed to fetch calendar attendance data:', error);
    } finally {
      setCalendarLoading(false);
    }
  }, [token, calendarEmployeeId, filters.employeeId]);

  const {
    checkingIn,
    checkingOut,
    locationError,
    clearLocationError,
    handleCheckIn,
    handleCheckOut,
  } = useAttendanceCheckInOut(token, fetchPersonalAttendance);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setPagination((prev: any) => ({ ...prev, page: 1 }));
    fetchAttendance(1);
    setFilterDrawerOpen(false);
    // Refresh calendar if it's open and showing the same employee
    if (calendarOpen && token) {
      const currentDate = new Date();
      fetchCalendarAttendance(currentDate.getFullYear(), currentDate.getMonth() + 1);
    }
  };

  const clearFilters = () => {
    setFilters({
      employeeId: '',
      month: '',
      year: new Date().getFullYear().toString(),
      status: '',
      limit: '10'
    });
    setPagination((prev: any) => ({ ...prev, page: 1 }));
    setTimeout(() => {
      fetchAttendance(1);
      fetchAttendanceStats();
    }, 100);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.employeeId) count++;
    if (filters.month) count++;
    if (filters.year && filters.year !== new Date().getFullYear().toString()) count++;
    if (filters.status) count++;
    return count;
  };

  const handlePageChange = (newPage: number) => {
    fetchAttendance(newPage);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'half-day':
        return 'bg-blue-100 text-blue-800';
      case 'holiday':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    return employee ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}` : employeeId;
  };

  const getTodayPersonalAttendance = () => {
    const today = new Date().toDateString();
    return personalAttendance.find(record => 
      new Date(record.date).toDateString() === today
    );
  };

  const todayPersonalAttendance = getTodayPersonalAttendance();
  const canCheckIn = !todayPersonalAttendance?.checkIn;
  const canCheckOut = todayPersonalAttendance?.checkIn && !todayPersonalAttendance?.checkOut;

  // Define columns for admin attendance table
  const attendanceColumns: Column<AttendanceRecord>[] = [
    {
      key: 'employeeId',
      label: 'Employee Name',
      minWidth: '150px',
      render: (value) => (
        <span className="font-medium">{getEmployeeName(value)}</span>
      ),
      mobileLabel: 'Employee',
      mobileRender: (value) => (
        <span className="font-semibold text-gray-900">{getEmployeeName(value)}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      minWidth: '120px',
      render: (value) => <span className="font-medium">{formatDate(value)}</span>,
      mobileLabel: 'Date',
    },
    {
      key: 'status',
      label: 'Status',
      minWidth: '100px',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
      mobileLabel: 'Status',
    },
    {
      key: 'checkIn',
      label: 'Check In',
      minWidth: '140px',
      render: (value) => value ? (
        <div className="flex items-center space-x-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>{formatDateTime(value)}</span>
        </div>
      ) : <span className="text-gray-400">Not checked in</span>,
      mobileLabel: 'Check In',
      mobileRender: (value) => value ? (
        <div className="flex items-center space-x-1">
          <CheckCircle className="h-3 w-3 text-green-600" />
          <span className="text-sm font-medium">{formatDateTime(value)}</span>
        </div>
      ) : <span className="text-sm text-gray-400">Not checked in</span>,
    },
    {
      key: 'checkInLocation',
      label: 'Log In Latitude - Longitude',
      minWidth: '200px',
      render: (_, record) => (
        <AttendanceLocationCell
          latitude={record.checkInLatitude}
          longitude={record.checkInLongitude}
        />
      ),
      mobileLabel: 'Log In Location',
      mobileRender: (_, record) => (
        <AttendanceLocationCell
          latitude={record.checkInLatitude}
          longitude={record.checkInLongitude}
          className="text-xs"
        />
      ),
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      minWidth: '140px',
      render: (value) => value ? (
        <div className="flex items-center space-x-1">
          <XCircle className="h-4 w-4 text-red-600" />
          <span>{formatDateTime(value)}</span>
        </div>
      ) : <span className="text-gray-400">Not checked out</span>,
      mobileLabel: 'Check Out',
      mobileRender: (value) => value ? (
        <div className="flex items-center space-x-1">
          <XCircle className="h-3 w-3 text-red-600" />
          <span className="text-sm font-medium">{formatDateTime(value)}</span>
        </div>
      ) : <span className="text-sm text-gray-400">Not checked out</span>,
    },
    {
      key: 'checkOutLocation',
      label: 'Log Out Latitude - Longitude',
      minWidth: '200px',
      render: (_, record) => (
        <AttendanceLocationCell
          latitude={record.checkOutLatitude}
          longitude={record.checkOutLongitude}
        />
      ),
      mobileLabel: 'Log Out Location',
      mobileRender: (_, record) => (
        <AttendanceLocationCell
          latitude={record.checkOutLatitude}
          longitude={record.checkOutLongitude}
          className="text-xs"
        />
      ),
    },
    {
      key: 'totalHours',
      label: 'Total Hours',
      minWidth: '100px',
      render: (value) => value ? (
        <span className="font-medium">{value.toFixed(2)}h</span>
      ) : <span className="text-gray-400">N/A</span>,
      mobileLabel: 'Total Hours',
      mobileRender: (value) => value ? (
        <span className="text-sm font-medium">{value.toFixed(2)}h</span>
      ) : <span className="text-sm text-gray-400">N/A</span>,
    },
    {
      key: 'overtimeHours',
      label: 'Overtime',
      minWidth: '100px',
      render: (value) => value && value > 0 ? (
        <span className="text-orange-600 font-medium">+{value.toFixed(2)}h</span>
      ) : <span className="text-gray-400">-</span>,
      mobileLabel: 'Overtime',
      mobileRender: (value) => value && value > 0 ? (
        <span className="text-sm font-medium text-orange-600">+{value.toFixed(2)}h</span>
      ) : <span className="text-sm text-gray-400">-</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      minWidth: '100px',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingAttendance(record);
              setManualAttendanceModalOpen(true);
            }}
            className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="Edit Attendance"
          >
            <Edit className="h-4 w-4 text-gray-700" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="px-2 py-1 text-xs text-white bg-black rounded">
                Edit Attendance
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black"></div>
              </div>
            </div>
          </button>
        </div>
      ),
      mobileLabel: 'Actions',
      mobileRender: (_, record) => (
        <div className="flex items-center space-x-2 pt-2">
          <button
            onClick={() => {
              setEditingAttendance(record);
              setManualAttendanceModalOpen(true);
            }}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-3 w-3" />
            <span>Edit</span>
          </button>
        </div>
      ),
    },
  ];

  // Custom mobile card render for admin attendance
  const renderAttendanceMobileCard = (record: AttendanceRecord) => {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-gray-900">{getEmployeeName(record.employeeId)}</span>
            </div>
            <span className="text-sm text-gray-600">{formatDate(record.date)}</span>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
            {record.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
          <div>
            <p className="text-xs text-gray-500 mb-1">Check In</p>
            {record.checkIn ? (
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-sm font-medium">{formatDateTime(record.checkIn)}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Not checked in</span>
            )}
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Check Out</p>
            {record.checkOut ? (
              <div className="flex items-center space-x-1">
                <XCircle className="h-3 w-3 text-red-600" />
                <span className="text-sm font-medium">{formatDateTime(record.checkOut)}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Not checked out</span>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Log In Latitude - Longitude</p>
            <AttendanceLocationCell
              latitude={record.checkInLatitude}
              longitude={record.checkInLongitude}
              className="text-xs"
            />
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Log Out Latitude - Longitude</p>
            <AttendanceLocationCell
              latitude={record.checkOutLatitude}
              longitude={record.checkOutLongitude}
              className="text-xs"
            />
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Hours</p>
            {record.totalHours ? (
              <span className="text-sm font-medium">{record.totalHours.toFixed(2)}h</span>
            ) : (
              <span className="text-sm text-gray-400">N/A</span>
            )}
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Overtime</p>
            {record.overtimeHours && record.overtimeHours > 0 ? (
              <span className="text-sm font-medium text-orange-600">+{record.overtimeHours.toFixed(2)}h</span>
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>
        </div>
        
        {record.notes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{record.notes}</p>
          </div>
        )}
        
        <div className="mt-3 pt-3 border-t flex justify-end">
          <button
            onClick={() => {
              setEditingAttendance(record);
              setManualAttendanceModalOpen(true);
            }}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-3 w-3" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchAttendance(1);
      fetchAttendanceStats();
      fetchEmployees();
      if (user.employeeId) {
        fetchPersonalAttendance();
      }
    }
  }, [token, user, fetchAttendance, fetchAttendanceStats, fetchEmployees, fetchPersonalAttendance]);

  // Fetch calendar data when employee selection changes or calendar opens
  useEffect(() => {
    if (calendarOpen && token) {
      const currentDate = new Date();
      fetchCalendarAttendance(currentDate.getFullYear(), currentDate.getMonth() + 1);
    }
  }, [calendarEmployeeId, calendarOpen, token, fetchCalendarAttendance]);

  // Sync calendar employee selection with main filters when main filter changes
  useEffect(() => {
    if (filters.employeeId && filters.employeeId !== calendarEmployeeId) {
      setCalendarEmployeeId(filters.employeeId);
    }
  }, [filters.employeeId, calendarEmployeeId]);

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  if (user.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          {/* <p className="text-gray-600">View and manage all employees&apos; attendance records</p> */}
        </div>

        {/* Attendance Statistics */}
        <Card>
          <CardHeader>
            <CardDescription>
              {filters.month 
                ? `Statistics for ${new Date(parseInt(filters.year), parseInt(filters.month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                : `Statistics for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
              }
              {filters.employeeId && (
                <span className="ml-2">
                  - {employees.find(emp => emp.employeeId === filters.employeeId) 
                    ? `${employees.find(emp => emp.employeeId === filters.employeeId)?.personalInfo.firstName} ${employees.find(emp => emp.employeeId === filters.employeeId)?.personalInfo.lastName}`
                    : 'Selected Employee'}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{attendanceStats.present}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="text-sm font-medium text-gray-600">Half Day</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{attendanceStats['half-day']}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{attendanceStats.absent}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="text-sm font-medium text-gray-600">Late</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{attendanceStats.late}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Attendance Section */}
        {user.employeeId && user.role !== 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>My Attendance</span>
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Your current location will be captured when you check in or check out.</p>
              </div>

              {locationError && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{locationError}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  {todayPersonalAttendance?.checkIn && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        Checked in at {formatDateTime(todayPersonalAttendance.checkIn)}
                      </span>
                    </div>
                  )}
                  {todayPersonalAttendance?.checkOut && (
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">
                        Checked out at {formatDateTime(todayPersonalAttendance.checkOut)}
                      </span>
                    </div>
                  )}
                  {todayPersonalAttendance?.totalHours && (
                    <div className="text-sm text-gray-600">
                      Total hours: {todayPersonalAttendance.totalHours}h
                      {todayPersonalAttendance.overtimeHours && todayPersonalAttendance.overtimeHours > 0 && (
                        <span className="text-orange-600 ml-2">
                          (Overtime: {todayPersonalAttendance.overtimeHours}h)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {canCheckIn && (
                    <Button 
                      onClick={() => {
                        clearLocationError();
                        handleCheckIn();
                      }} 
                      disabled={checkingIn || checkingOut}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {checkingIn ? 'Fetching location...' : 'Check In'}
                    </Button>
                  )}
                  {canCheckOut && (
                    <Button 
                      onClick={() => {
                        clearLocationError();
                        handleCheckOut();
                      }} 
                      disabled={checkingIn || checkingOut}
                      variant="destructive"
                    >
                      {checkingOut ? 'Fetching location...' : 'Check Out'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employee Profile Setup Notice for Admin without Employee ID */}
        {!user.employeeId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Attendance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="mb-4">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Employee Profile Required
                </h3>
                <p className="text-gray-600 mb-4">
                  To track your personal attendance, you need to set up an employee profile:
                </p>
                <ul className="text-left text-gray-600 space-y-1 mb-6">
                  <li>• Go to Employees page and add yourself as an employee</li>
                  <li>• Assign yourself an employee ID</li>
                  <li>• Link your admin account to the employee profile</li>
                </ul>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Once set up, you&apos;ll be able to check in and out from this page.
                  </p>
                  <Button 
                    onClick={refreshToken}
                    variant="outline"
                    className="mt-4"
                  >
                    Refresh Token (Try if already set up)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => {
              setEditingAttendance(null);
              setManualAttendanceModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Manual Attendance</span>
          </button>
          <button
            onClick={() => {
              setCalendarOpen(true);
              if (token) {
                const currentDate = new Date();
                fetchCalendarAttendance(currentDate.getFullYear(), currentDate.getMonth() + 1);
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="relative flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs font-medium rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>

        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          title="Filters"
          activeFilterCount={getActiveFilterCount()}
          onApply={applyFilters}
          onReset={clearFilters}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="employee" className="text-gray-700 mb-1">Employee</Label>
              <EmployeeDropdown
                value={filters.employeeId}
                onChange={(value) => handleFilterChange('employeeId', value)}
                employees={employees}
                placeholder="All employees"
              />
            </div>

            <div>
              <Label htmlFor="month" className="text-gray-700 mb-1">Month</Label>
              <Select
                id="month"
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="w-full"
              >
                <option value="">All months</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  return (
                    <option key={month} value={month.toString()}>
                      {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div>
              <Label htmlFor="year" className="text-gray-700 mb-1">Year</Label>
              <Input
                id="year"
                type="number"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                placeholder="2024"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-gray-700 mb-1">Status</Label>
              <Select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full"
              >
                <option value="">All statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
                <option value="holiday">Holiday</option>
              </Select>
            </div>
          </div>
        </FilterDrawer>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicTable
              data={attendance}
              columns={attendanceColumns}
              loading={loading}
              emptyMessage="No attendance records found for the selected filters."
              pagination={pagination}
              onPageChange={handlePageChange}
              recordsPerPage={filters.limit}
              onRecordsPerPageChange={(limit) => {
                setFilters((prev) => ({ ...prev, limit }));
                setPagination((prev) => ({ ...prev, page: 1 }));
                setTimeout(() => fetchAttendance(1), 100);
              }}
              keyExtractor={(record) => record._id}
              mobileCardRender={renderAttendanceMobileCard}
              stickyHeader={true}
              maxHeight="calc(100vh - 400px)"
            />
          </CardContent>
        </Card>

        {/* Manual Attendance Modal */}
        <ManualAttendanceModal
          isOpen={manualAttendanceModalOpen}
          onClose={() => {
            setManualAttendanceModalOpen(false);
            setEditingAttendance(null);
          }}
          onSuccess={() => {
            fetchAttendance(pagination.page);
            fetchAttendanceStats();
            if (calendarOpen && token) {
              const currentDate = new Date();
              fetchCalendarAttendance(currentDate.getFullYear(), currentDate.getMonth() + 1);
            }
            setEditingAttendance(null);
          }}
          employees={employees}
          token={token}
          attendanceRecord={editingAttendance}
        />

        {/* Calendar View Modal */}
        <DynamicModal
          isOpen={calendarOpen}
          onClose={() => setCalendarOpen(false)}
          title="Calendar View"
          maxWidth="max-w-4xl"
        >
          <div className="mb-4">
            <Label htmlFor="calendarEmployee" className="text-sm font-medium text-gray-700 mb-2 block">
              Select Employee
            </Label>
            <div className="max-w-xs">
              <EmployeeDropdown
                value={calendarEmployeeId}
                onChange={(value) => {
                  setCalendarEmployeeId(value);
                  // Reset calendar attendance when employee changes
                  setCalendarAttendance([]);
                }}
                employees={employees}
                placeholder="All employees"
              />
            </div>
          </div>
          <AttendanceCalendar
            attendance={calendarAttendance.map(record => ({
              date: record.date,
              status: record.status as 'present' | 'absent' | 'late' | 'half-day' | 'holiday'
            }))}
            loading={calendarLoading}
            employeeId={calendarEmployeeId || filters.employeeId || undefined}
            token={token}
            onMonthChange={fetchCalendarAttendance}
          />
        </DynamicModal>
      </div>
    </Layout>
  );
}
