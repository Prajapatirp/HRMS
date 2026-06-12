'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';

export function DashboardContent() {
  const { user } = useAuth();

  const displayName = user?.email || (user?.role?.toLowerCase() === 'admin' ? 'Admin' : 'User');
  const isAdminView = user?.role === 'admin' || user?.role === 'hr';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {displayName}</p>
      </div>

      {isAdminView ? (
        <AdminDashboard />
      ) : (
        <EmployeeDashboard />
      )}
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
