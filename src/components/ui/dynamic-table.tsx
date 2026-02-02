'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export interface Column<T = any> {
  key: string;
  label: string;
  minWidth?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  mobileLabel?: string; // Label for mobile card view
  mobileRender?: (value: any, record: T, index: number) => React.ReactNode; // Custom render for mobile
  hideOnMobile?: boolean; // Hide this column on mobile
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface DynamicTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  recordsPerPage?: string;
  onRecordsPerPageChange?: (limit: string) => void;
  keyExtractor?: (record: T, index: number) => string;
  mobileCardRender?: (record: T, index: number) => React.ReactNode; // Custom mobile card render
  className?: string;
  stickyHeader?: boolean; // Enable sticky header
  maxHeight?: string; // Max height for table container when sticky header is enabled
}

// Custom Records Per Page Dropdown Component
function RecordsPerPageDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const options = ['10', '20', '50', '100'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-24 bg-blue-50 border border-blue-300 text-blue-600 rounded-md px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer flex items-center justify-between"
      >
        <span>{value} / page</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute right-0 bottom-full mb-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden"
            style={{ zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    value === option
                      ? 'bg-blue-50 text-gray-700 border-l-2 border-blue-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option} / page
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DynamicTable<T = any>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No records found.',
  pagination,
  onPageChange,
  recordsPerPage,
  onRecordsPerPageChange,
  keyExtractor = (_, index) => `row-${index}`,
  mobileCardRender,
  className = '',
  stickyHeader = false,
  maxHeight = 'calc(100vh - 300px)',
}: DynamicTableProps<T>) {
  // Default mobile card render if not provided
  const defaultMobileCardRender = (record: T, index: number) => {
    const visibleColumns = columns.filter(col => !col.hideOnMobile);
    
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        {visibleColumns.map((column, colIndex) => {
          const value = (record as any)[column.key];
          const displayValue = column.mobileRender 
            ? column.mobileRender(value, record, index)
            : column.render 
            ? column.render(value, record, index)
            : value;
          
          return (
            <div 
              key={column.key} 
              className={colIndex < visibleColumns.length - 1 ? 'mb-3 pb-3 border-b' : ''}
            >
              <p className="text-xs text-gray-500 mb-1">
                {column.mobileLabel || column.label}
              </p>
              <div className="text-sm text-gray-900">
                {displayValue !== null && displayValue !== undefined ? displayValue : '-'}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMobileCard = mobileCardRender || defaultMobileCardRender;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop/Tablet Table View */}
      <div 
        className={`hidden md:block ${stickyHeader ? 'overflow-auto' : 'overflow-x-auto'}`}
        style={stickyHeader ? { maxHeight } : undefined}
      >
        <div className="relative">
          <Table>
            <TableHeader className={stickyHeader ? 'sticky top-0 z-10 bg-gray-50 shadow-sm' : ''}>
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={column.key}
                    className={`${column.minWidth ? `min-w-[${column.minWidth}]` : ''} ${stickyHeader ? 'bg-gray-50' : ''}`}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          <TableBody>
            {data.map((record, index) => (
              <TableRow key={keyExtractor(record, index)}>
                {columns.map((column) => {
                  const value = (record as any)[column.key];
                  const displayValue = column.render 
                    ? column.render(value, record, index)
                    : value !== null && value !== undefined 
                    ? String(value)
                    : '-';
                  
                  return (
                    <TableCell key={column.key}>
                      {displayValue}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 px-1">
        {data.map((record, index) => (
          <div key={keyExtractor(record, index)}>
            {renderMobileCard(record, index)}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.pages > 0 && (
        <div className="mt-4">
          {/* Mobile: Simplified pagination */}
          <div className="md:hidden bg-white rounded-lg px-4 py-3 space-y-3">
            {/* Records per page - Mobile */}
            {onRecordsPerPageChange && recordsPerPage && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="recordsPerPageMobile" className="text-sm text-gray-700 whitespace-nowrap">
                  Records per page:
                </Label>
                <Select
                  id="recordsPerPageMobile"
                  value={recordsPerPage}
                  onChange={(e) => onRecordsPerPageChange(e.target.value)}
                  className="w-24"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </Select>
              </div>
            )}
            
            {/* Pagination buttons - Mobile */}
            {onPageChange && pagination.pages > 1 && (
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="flex items-center space-x-1 flex-shrink-0 min-w-[80px]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                
                <span className="text-sm text-gray-600 whitespace-nowrap px-2">
                  Page {pagination.page} of {pagination.pages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="flex items-center space-x-1 flex-shrink-0 min-w-[80px]"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Desktop: Full pagination */}
          <div className="hidden md:flex items-center justify-between bg-white rounded-lg px-4 py-3 overflow-visible flex-nowrap">
            <div className="text-sm text-gray-600 font-medium whitespace-nowrap flex-shrink-0">
              Total Records: {pagination.total}
            </div>
            
            <div className="flex items-center gap-2 relative flex-nowrap flex-shrink-0">
              {onPageChange && pagination.pages > 1 && (
                <>
                  <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <div className="flex items-center gap-1 flex-nowrap">
                    {/* First page */}
                    {pagination.page > 3 && pagination.pages > 5 && (
                      <>
                        <button
                          onClick={() => onPageChange(1)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap flex-shrink-0"
                        >
                          1
                        </button>
                        {pagination.page > 4 && (
                          <span className="px-1 text-gray-400 whitespace-nowrap flex-shrink-0">...</span>
                        )}
                      </>
                    )}
                    
                    {/* Page numbers around current page */}
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => onPageChange(pageNum)}
                          className={`px-3 py-1 text-sm rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                            pagination.page === pageNum
                              ? 'bg-blue-100 text-blue-600 border border-blue-300 font-medium'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    {/* Last page */}
                    {pagination.page < pagination.pages - 2 && pagination.pages > 5 && (
                      <>
                        {pagination.page < pagination.pages - 3 && (
                          <span className="px-1 text-gray-400 whitespace-nowrap flex-shrink-0">...</span>
                        )}
                        <button
                          onClick={() => onPageChange(pagination.pages)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap flex-shrink-0"
                        >
                          {pagination.pages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              
              {onRecordsPerPageChange && recordsPerPage && (
                <div className="flex-shrink-0">
                  <RecordsPerPageDropdown
                    value={recordsPerPage}
                    onChange={onRecordsPerPageChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

