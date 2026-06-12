'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Loader2, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Holiday {
  _id: string;
  name: string;
  date: string;
  description?: string;
}

export default function EmployeeDashboard() {
  const { token } = useAuth();
  const currentYear = new Date().getFullYear();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHolidays = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/holidays?year=${currentYear}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || []);
      }
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
    } finally {
      setLoading(false);
    }
  }, [token, currentYear]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Holiday Calendar {currentYear}</CardTitle>
            <CardDescription>Company holidays scheduled for this year</CardDescription>
          </div>
          <Link
            href="/attendance"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View Attendance
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No holidays have been scheduled for {currentYear} yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {holidays.map((holiday) => {
                const isPast = new Date(holiday.date) < today;
                const isToday =
                  new Date(holiday.date).toDateString() === today.toDateString();

                return (
                  <div
                    key={holiday._id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 first:pt-0 last:pb-0 ${
                      isPast ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          isToday
                            ? 'bg-blue-100'
                            : isPast
                              ? 'bg-gray-100'
                              : 'bg-purple-100'
                        }`}
                      >
                        <CalendarDays
                          className={`h-5 w-5 ${
                            isToday
                              ? 'text-blue-600'
                              : isPast
                                ? 'text-gray-500'
                                : 'text-purple-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{holiday.name}</p>
                        {holiday.description && (
                          <p className="text-sm text-gray-500 mt-0.5">{holiday.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:text-right sm:flex-shrink-0">
                      <span className="text-sm font-medium text-gray-700">
                        {formatDate(holiday.date)}
                      </span>
                      {isToday && (
                        <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Today
                        </span>
                      )}
                      {!isPast && !isToday && (
                        <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
