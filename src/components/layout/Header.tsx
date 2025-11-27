'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuClick: () => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export default function Header({ onMenuClick, onToggleSidebar, sidebarCollapsed }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden hover:bg-gray-100 hover:text-blue-600 border border-gray-200 rounded-md transition-colors"
            aria-label="Toggle menu"
            title="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hidden md:flex hover:bg-gray-100 hover:text-blue-600 border border-gray-200 rounded-md transition-colors"
            aria-label="Toggle sidebar"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
          
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search employees, departments..."
              className="pl-10 w-64 lg:w-80"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="ghost" size="icon" className="relative">
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
  );
}
