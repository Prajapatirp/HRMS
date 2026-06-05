'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export function DashboardContent() {
  const { user } = useAuth();

  const displayName = user?.email || (user?.role?.toLowerCase() === 'admin' ? 'Admin' : 'User');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {displayName}</p>
      </div>

      <Card className="rounded-lg border border-blue-100 bg-white shadow-sm">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 p-6 shadow-lg flex items-center justify-center">
              <Construction className="h-16 w-16 text-white" />
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-gray-800">Under Process</h2>
              <p className="text-lg text-gray-600 max-w-md">
                We're working hard to bring you an amazing dashboard experience.
                Stay tuned for exciting updates!
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Layout>
      <DashboardContent />
    </Layout>
  );
}
