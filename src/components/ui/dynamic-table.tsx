'use client';

import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  keyExtractor?: (record: T, index: number) => string;
  mobileCardRender?: (record: T, index: number) => React.ReactNode; // Custom mobile card render
  className?: string;
}

export default function DynamicTable<T = any>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No records found.',
  pagination,
  onPageChange,
  keyExtractor = (_, index) => `row-${index}`,
  mobileCardRender,
  className = '',
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
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  className={column.minWidth ? `min-w-[${column.minWidth}]` : ''}
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((record, index) => (
          <div key={keyExtractor(record, index)}>
            {renderMobileCard(record, index)}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && onPageChange && (
        <div className="mt-6 space-y-4">
          {/* Mobile: Simplified pagination */}
          <div className="md:hidden flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Desktop: Full pagination */}
          <div className="hidden md:flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
              
              <div className="flex items-center space-x-1">
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
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

