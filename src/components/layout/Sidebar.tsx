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
  Shield,
} from 'lucide-react';

const getNavigation = (userRole: string) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Attendance', href: '/attendance', icon: Calendar },
    { name: 'Leave Management', href: '/leaves', icon: FileText },
    { name: 'Payroll', href: '/payroll', icon: DollarSign },
    { name: 'Performance', href: '/performance', icon: TrendingUp },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Add Employees page for admin and HR users only
  if (userRole === 'admin' || userRole === 'hr') {
    baseNavigation.splice(1, 0, { name: 'Employees', href: '/employees', icon: Users });
  }

  if (userRole === 'admin') {
    return [
      ...baseNavigation,
      { name: 'Admin - Attendance', href: '/admin/attendance', icon: Shield },
      { name: 'Admin - Leaves', href: '/admin/leaves', icon: Shield },
      { name: 'Admin - Payroll', href: '/admin/payroll', icon: Shield },
    ];
  }

  return baseNavigation;
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, logoutLoading } = useAuth();

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
        <h1 className="text-xl font-bold text-white">HRMS</h1>
      </div>
      
      <div className="flex-1 px-4 py-6">
        <nav className="space-y-2">
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
        </nav>
      </div>
      
      <div className="p-4 border-t">
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
  );
}
