'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DynamicTable, { Column, PaginationInfo } from '@/components/ui/dynamic-table';
import DynamicModal from '@/components/ui/dynamic-modal';
import ConfirmModal from '@/components/ui/confirm-modal';
import { Plus, Edit, Trash2, CalendarDays } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

interface Holiday {
  _id: string;
  name: string;
  date: string;
  description?: string;
  createdAt: string;
}

export default function AdminHolidaysPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [year, setYear] = useState(String(currentYear));
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchHolidays = useCallback(async (page = 1) => {
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        year,
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/holidays?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || []);
        setPagination(data.pagination);
      } else {
        const data = await response.json().catch(() => ({}));
        showToast(data.error || 'Failed to fetch holidays', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      showToast('Failed to fetch holidays', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, year, showToast]);

  useEffect(() => {
    if (token) fetchHolidays(1);
  }, [token, fetchHolidays]);

  const resetForm = () => {
    setFormData({ name: '', date: '', description: '' });
    setEditingHoliday(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: new Date(holiday.date).toISOString().split('T')[0],
      description: holiday.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.date) {
      showToast('Holiday name and date are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingHoliday ? `/api/holidays/${editingHoliday._id}` : '/api/holidays';
      const method = editingHoliday ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast(
          editingHoliday ? 'Holiday updated successfully!' : 'Holiday added successfully!',
          'success'
        );
        setModalOpen(false);
        resetForm();
        fetchHolidays(pagination.page);
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to save holiday', 'error');
      }
    } catch (error) {
      console.error('Failed to save holiday:', error);
      showToast('Failed to save holiday', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/holidays/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        showToast('Holiday deleted successfully', 'success');
        setConfirmOpen(false);
        setDeleteTarget(null);
        fetchHolidays(pagination.page);
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to delete holiday', 'error');
      }
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      showToast('Failed to delete holiday', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Holiday>[] = [
    {
      key: 'name',
      label: 'Holiday Name',
      minWidth: '180px',
      render: (value) => (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-purple-600" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      minWidth: '140px',
      render: (value) => <span className="font-medium">{formatDate(value)}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      minWidth: '220px',
      render: (value) =>
        value ? (
          <span className="text-gray-600 truncate block max-w-[220px]" title={value}>
            {value}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      minWidth: '120px',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openEditModal(record)}
            className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="Edit Holiday"
          >
            <Edit className="h-4 w-4 text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteTarget(record);
              setConfirmOpen(true);
            }}
            className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="Delete Holiday"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Holidays</h1>
            <p className="text-gray-600 mt-1">Manage company holidays for all employees</p>
          </div>
          <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Holiday
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Holiday List</CardTitle>
              <CardDescription>
                Showing {holidays.length} of {pagination.total} holidays in {year}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="yearFilter" className="text-sm text-gray-600 whitespace-nowrap">
                Year
              </Label>
              <Input
                id="yearFilter"
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-28"
              />
            </div>
          </CardHeader>
          <CardContent>
            <DynamicTable
              data={holidays}
              columns={columns}
              loading={loading}
              emptyMessage="No holidays found for this year."
              pagination={pagination}
              onPageChange={fetchHolidays}
              keyExtractor={(record) => record._id}
              stickyHeader
              maxHeight="calc(100vh - 340px)"
            />
          </CardContent>
        </Card>

        <DynamicModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            resetForm();
          }}
          title={editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
          maxWidth="max-w-lg"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                disabled={submitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? 'Saving...' : editingHoliday ? 'Update' : 'Save'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="holidayName">
                <span className="text-red-500">*</span> Holiday Name
              </Label>
              <Input
                id="holidayName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Independence Day"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="holidayDate">
                <span className="text-red-500">*</span> Date
              </Label>
              <Input
                id="holidayDate"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="holidayDescription">Description (Optional)</Label>
              <textarea
                id="holidayDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Add a short note about this holiday..."
                className="mt-1 w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y"
              />
            </div>
          </div>
        </DynamicModal>

        <ConfirmModal
          isOpen={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setDeleteTarget(null);
          }}
          onConfirm={handleDelete}
          loading={submitting}
          confirmLabel="Yes, Delete Holiday"
          confirmVariant="danger"
        >
          <p className="text-gray-900 text-base leading-relaxed">
            Are you sure you want to delete{' '}
            <span className="font-bold">{deleteTarget?.name}</span>?
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            This holiday will be removed from the employee dashboard list.
          </p>
        </ConfirmModal>
      </div>
    </Layout>
  );
}
