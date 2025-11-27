'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { X, Calendar, FileText } from 'lucide-react';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const leaveTypes = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'personal', label: 'Personal Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'bereavement', label: 'Bereavement Leave' },
  { value: 'other', label: 'Other' },
];

export default function ApplyLeaveModal({ isOpen, onClose, onSuccess }: ApplyLeaveModalProps) {
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setFormData({
          leaveType: '',
          startDate: '',
          endDate: '',
          reason: '',
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit leave request');
      }
    } catch (error) {
      setError('Failed to submit leave request. Please try again.');
      console.error('Leave application error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const timeDiff = end.getTime() - start.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Apply for Leave</span>
            </CardTitle>
            <CardDescription>
              Submit a new leave request
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select
                id="leaveType"
                value={formData.leaveType}
                onChange={(e) => handleInputChange('leaveType', e.target.value)}
                required
              >
                <option value="">Select leave type</option>
                {leaveTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  required
                />
              </div>
            </div>

            {calculateDays() > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <Calendar className="h-4 w-4" />
                  <span>Total days: {calculateDays()}</span>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="reason">Reason</Label>
              <textarea
                id="reason"
                className="w-full p-2 border border-gray-300 rounded-md resize-none"
                rows={3}
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                placeholder="Please provide a reason for your leave request"
                required
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
