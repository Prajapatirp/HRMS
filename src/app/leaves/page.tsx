'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Calendar, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import ApplyLeaveModal from '@/components/leaves/ApplyLeaveModal';
import LeaveDetailsModal from '@/components/leaves/LeaveDetailsModal';

interface LeaveRequest {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  createdAt: string;
}

export default function LeavesPage() {
  const { user, token } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (token) {
      fetchLeaves();
    }
  }, [token]);

  const fetchLeaves = async () => {
    try {
      const response = await fetch('/api/leaves', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaves(data.leaves);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch leaves:', errorData.error);
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuccess = () => {
    fetchLeaves(); // Refresh the leaves list
  };

  const handleViewDetails = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setSelectedLeave(null);
    setShowDetailsModal(false);
  };

  const handleCancelLeave = async (leaveId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      const response = await fetch(`/api/leaves?id=${leaveId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        fetchLeaves(); // Refresh the leaves list
      } else {
        const errorData = await response.json();
        alert(`Failed to cancel leave: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Cancel leave error:', error);
      alert('Failed to cancel leave. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  if (!user.employeeId) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600">Manage your leave requests and approvals</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Employee Profile Required</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="mb-4">
                  <FileText className="h-16 w-16 text-red-500 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Employee Profile Not Found
                </h3>
                <p className="text-gray-600 mb-4">
                  Your account doesn't have an employee profile set up. Please contact HR to:
                </p>
                <ul className="text-left text-gray-600 space-y-1 mb-6">
                  <li>• Set up your employee profile</li>
                  <li>• Assign you an employee ID</li>
                  <li>• Enable leave management</li>
                </ul>
                <p className="text-sm text-gray-500">
                  Once your employee profile is set up, you'll be able to apply for leaves.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600">Manage your leave requests and approvals</p>
          </div>
          <Button 
            className="flex items-center space-x-2"
            onClick={() => setShowApplyModal(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Apply Leave</span>
          </Button>
        </div>

        {/* Leave Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leaves</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaves.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leaves.filter(leave => leave.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leaves.filter(leave => leave.status === 'approved').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leaves.filter(leave => leave.status === 'rejected').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>Your leave application history</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {leaves.map((leave) => (
                  <div key={leave._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`font-medium capitalize ${getLeaveTypeColor(leave.leaveType)}`}>
                            {leave.leaveType} Leave
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                            {leave.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Start Date:</span>
                            <p>{formatDate(leave.startDate)}</p>
                          </div>
                          <div>
                            <span className="font-medium">End Date:</span>
                            <p>{formatDate(leave.endDate)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>
                            <p>{leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <span className="font-medium text-sm">Reason:</span>
                          <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          Applied on {formatDate(leave.createdAt)}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        {leave.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCancelLeave(leave._id)}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(leave)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {leaves.length === 0 && !loading && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests</h3>
                <p className="text-gray-600 mb-4">You haven't applied for any leaves yet.</p>
                <Button 
                  className="flex items-center space-x-2"
                  onClick={() => setShowApplyModal(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span>Apply for Leave</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Apply Leave Modal */}
        <ApplyLeaveModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onSuccess={handleApplySuccess}
        />

        {/* Leave Details Modal */}
        <LeaveDetailsModal
          isOpen={showDetailsModal}
          onClose={handleCloseDetails}
          leave={selectedLeave}
          employeeName={user?.email}
        />
      </div>
    </Layout>
  );
}
