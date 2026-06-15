'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={`bg-gray-50 border border-gray-200 rounded-md dark:bg-gray-800 dark:border-gray-700 ${className}`}
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-5 w-5 text-blue-600" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={`bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700 ${className}`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5 text-blue-600" />
      )}
    </Button>
  );
}
