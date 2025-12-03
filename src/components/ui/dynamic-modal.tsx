'use client';

import React from 'react';
import { X } from 'lucide-react';

interface DynamicModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
  className?: string;
}

export default function DynamicModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-4xl',
  showCloseButton = true,
  className = '',
}: DynamicModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col transform transition-all overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex-shrink-0 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 bg-white overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer (if provided) */}
        {footer && (
          <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-white flex-shrink-0 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

