'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  onApply?: () => void;
  onReset?: () => void;
  activeFilterCount?: number;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  title = 'Filters',
  children,
  onApply,
  onReset,
  activeFilterCount = 0,
}: FilterDrawerProps) {
  return (
    <>
      {/* Backdrop - starts below header */}
      <div
        className={`fixed top-16 left-0 right-0 bottom-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Drawer - starts below header */}
      <div
        className={`fixed right-0 top-16 h-[calc(100vh-4rem)] w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">{title}</h2>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
              aria-label="Close drawer"
              type="button"
            >
              <X className="h-5 w-5 text-gray-600" strokeWidth={2.5} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900">
            {children}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 gap-2">
            {onReset && (
              <button
                onClick={onReset}
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                type="button"
              >
                Reset
              </button>
            )}
            {onApply ? (
              <Button
                onClick={onApply}
                className="flex-1"
                type="button"
              >
                Apply Filters
              </Button>
            ) : (
              <Button
                onClick={onClose}
                className="flex-1"
                type="button"
              >
                Exit
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
