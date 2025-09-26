'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  Bell,
  BarChart3,
  Home,
  Settings,
  LogOut,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const getNavigation = (userRole: string) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Attendance', href: '/attendance', icon: Calendar },
    { name: 'Timesheets', href: '/timesheets', icon: Clock },
    { name: 'Leave Management', href: '/leaves', icon: FileText },
    { name: 'Payroll', href: '/payroll', icon: DollarSign },
    { name: 'Performance', href: '/performance', icon: TrendingUp },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Add Employees page for admin and HR users only
  if (userRole === 'admin' || userRole === 'hr') {
    baseNavigation.splice(1, 0, { name: 'Employees', href: '/employees', icon: Users });
  }

  // Add Reports page for admin, HR, and manager users only
  if (userRole === 'admin' || userRole === 'hr' || userRole === 'manager') {
    baseNavigation.splice(-1, 0, { name: 'Reports', href: '/reports', icon: BarChart3 });
  }

  return baseNavigation;
};

const getAdminNavigation = () => {
  return [
    { name: 'Attendance', href: '/admin/attendance', icon: Calendar },
    { name: 'Projects', href: '/admin/projects', icon: FileText },
    { name: 'Timesheets', href: '/admin/timesheets', icon: Clock },
    { name: 'Leaves', href: '/admin/leaves', icon: FileText },
    { name: 'Payroll', href: '/admin/payroll', icon: DollarSign },
  ];
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, logoutLoading } = useAuth();
  const [isEmployeeDetailsOpen, setIsEmployeeDetailsOpen] = React.useState(
    pathname.startsWith('/admin')
  );

  return (
    <>
      <style jsx>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 3px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
      <div className="flex flex-col w-64 bg-white shadow-lg border-r border-gray-200 h-screen">
      <div className="flex items-center justify-center h-16 px-4 bg-blue-600 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">HRMS</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-6 sidebar-scroll" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#d1d5db #f3f4f6'
      }}>
        <nav className="space-y-2 pb-4">
          {getNavigation(user?.role || '').map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
          
          {/* Employee Details Section for Admin */}
          {user?.role === 'admin' && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsEmployeeDetailsOpen(!isEmployeeDetailsOpen)}
                className={cn(
                  'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out',
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                  isEmployeeDetailsOpen && 'bg-gray-50 text-gray-900'
                )}
              >
                <Users className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="flex-1 text-left">Employee Details</span>
                <div className="ml-auto transition-transform duration-200 ease-in-out">
                  {isEmployeeDetailsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </button>
              
              <div className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                isEmployeeDetailsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              )}>
                <div className="ml-6 mt-2 space-y-1 pb-2">
                  {getAdminNavigation().map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out',
                          'hover:bg-gray-100 hover:text-gray-900',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                          isActive
                            ? 'bg-blue-100 text-blue-700 border-l-2 border-blue-500'
                            : 'text-gray-600'
                        )}
                      >
                        <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                        <span className="flex-1">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>
      
      <div className="p-4 border-t flex-shrink-0">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          disabled={logoutLoading}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="mr-3 h-4 w-4" />
          {logoutLoading ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </div>
    </>
  );
}
