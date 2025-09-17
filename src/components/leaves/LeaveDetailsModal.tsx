'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Calendar, Clock, User, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

interface LeaveRequest {
  _id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

interface LeaveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: LeaveRequest | null;
  employeeName?: string;
  approverName?: string;
}

const leaveTypes = {
  sick: 'Sick Leave',
  vacation: 'Vacation',
  personal: 'Personal Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  bereavement: 'Bereavement Leave',
  other: 'Other'
};

const statusConfig = {
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    iconColor: 'text-yellow-600'
  },
  approved: { 
    label: 'Approved', 
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  rejected: { 
    label: 'Rejected', 
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    iconColor: 'text-red-600'
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-gray-100 text-gray-800',
    icon: AlertCircle,
    iconColor: 'text-gray-600'
  }
};

export default function LeaveDetailsModal({ isOpen, onClose, leave, employeeName, approverName }: LeaveDetailsModalProps) {
  if (!isOpen || !leave) return null;

  const statusInfo = statusConfig[leave.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick':
        return 'text-red-600';
      case 'vacation':
        return 'text-blue-600';
      case 'personal':
        return 'text-purple-600';
      case 'maternity':
        return 'text-pink-600';
      case 'paternity':
        return 'text-indigo-600';
      case 'bereavement':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Leave Request Details</span>
            </CardTitle>
            <CardDescription>
              Complete information about this leave request
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Information */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold">
                {employeeName || leave.employeeId}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                <StatusIcon className={`inline h-3 w-3 mr-1 ${statusInfo.iconColor}`} />
                {statusInfo.label}
              </span>
            </div>
            <div className={`font-medium capitalize ${getLeaveTypeColor(leave.leaveType)}`}>
              {leaveTypes[leave.leaveType as keyof typeof leaveTypes] || leave.leaveType}
            </div>
          </div>

          {/* Leave Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Leave Period
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium">{formatDate(leave.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">End Date:</span>
                  <span className="font-medium">{formatDate(leave.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Days:</span>
                  <span className="font-medium">{leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Status Information
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Applied On:</span>
                  <span className="font-medium">{formatDateTime(leave.createdAt)}</span>
                </div>
                {leave.approvedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed On:</span>
                    <span className="font-medium">{formatDateTime(leave.approvedAt)}</span>
                  </div>
                )}
                {leave.approvedBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed By:</span>
                    <span className="font-medium">{approverName || leave.approvedBy}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Reason
            </h4>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-gray-700">{leave.reason}</p>
            </div>
          </div>

          {/* Rejection Reason */}
          {leave.rejectionReason && (
            <div className="space-y-2">
              <h4 className="font-semibold text-red-900 flex items-center">
                <XCircle className="h-4 w-4 mr-2" />
                Rejection Reason
              </h4>
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{leave.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Attachments */}
          {leave.attachments && leave.attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Attachments
              </h4>
              <div className="space-y-1">
                {leave.attachments.map((attachment, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded-md flex items-center justify-between">
                    <span className="text-sm text-gray-700">{attachment}</span>
                    <Button size="sm" variant="outline">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Leave request submitted</span>
                <span className="text-gray-400">{formatDateTime(leave.createdAt)}</span>
              </div>
              {leave.approvedAt && (
                <div className="flex items-center space-x-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${leave.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-gray-600">Leave request {leave.status}</span>
                  <span className="text-gray-400">{formatDateTime(leave.approvedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
