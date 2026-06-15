'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  confirmLabel: string;
  cancelLabel?: string;
  children: React.ReactNode;
  confirmVariant?: 'primary' | 'danger';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  confirmLabel,
  cancelLabel = 'Cancel',
  children,
  confirmVariant = 'primary',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-transparent dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex gap-4 pr-8">
          <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-orange-400 flex items-center justify-center">
            <span className="text-orange-500 text-lg font-bold leading-none">!</span>
          </div>
          <div className="pt-0.5 space-y-1">{children}</div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={
              confirmVariant === 'danger'
                ? 'px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium'
                : 'px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium'
            }
          >
            {loading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
