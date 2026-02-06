'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Filter, Eye, Edit, Trash2, RefreshCw, Clock } from 'lucide-react';
import DynamicTable, { Column, PaginationInfo } from '@/components/ui/dynamic-table';
import { formatDate } from '@/lib/utils';
import FilterDrawer from '@/components/ui/filter-drawer';
import DynamicModal from '@/components/ui/dynamic-modal';

interface Ticket {
  _id: string;
  ticketId: string;
  employeeId: string;
  employeeName: string;
  ticketType: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  date?: string | Date;
  trackHistory: Array<{
    status: string;
    date: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTicketsPage() {
  const { user, token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filters, setFilters] = useState({
    ticketType: '',
    priority: '',
    status: '',
    startDate: '',
    endDate: '',
    limit: '15',
  });
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    note: '',
  });
  const [updating, setUpdating] = useState(false);

  const fetchTickets = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', filters.limit);
      if (filters.ticketType) queryParams.append('ticketType', filters.ticketType);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(`/api/tickets?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    if (token) {
      fetchTickets(1);
    }
  }, [token, fetchTickets]);

  const handlePageChange = (newPage: number) => {
    fetchTickets(newPage);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTickets(1);
    setFilterDrawerOpen(false);
  };

  const clearFilters = () => {
    const clearedFilters = {
      ticketType: '',
      priority: '',
      status: '',
      startDate: '',
      endDate: '',
      limit: '15',
    };
    setFilters(clearedFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(() => {
      fetchTickets(1);
    }, 100);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.ticketType) count++;
    if (filters.priority) count++;
    if (filters.status) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  };

  const handleStatusUpdate = async () => {
    if (!selectedTicket || !statusUpdate.status) {
      alert('Please select a status');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/tickets/${selectedTicket.ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: statusUpdate.status,
          note: statusUpdate.note,
        }),
      });

      if (response.ok) {
        setStatusModalOpen(false);
        setStatusUpdate({ status: '', note: '' });
        fetchTickets(pagination.page);
        alert('Ticket status updated successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update ticket status');
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      alert('Failed to update ticket status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReopenTicket = async (ticket: Ticket) => {
    if (!confirm('Are you sure you want to reopen the ticket?')) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'Open',
          note: 'Ticket reopened by admin',
        }),
      });

      if (response.ok) {
        fetchTickets(pagination.page);
        alert('Ticket reopened successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reopen ticket');
      }
    } catch (error) {
      console.error('Failed to reopen ticket:', error);
      alert('Failed to reopen ticket. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchTickets(pagination.page);
        alert('Ticket deleted successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete ticket');
      }
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      alert('Failed to delete ticket. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800';
      case 'InProgress':
        return 'bg-purple-100 text-purple-800';
      case 'Closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const ticketColumns: Column<Ticket>[] = [
    {
      key: 'ticketId',
      label: 'Ticket Id',
      minWidth: '100px',
      render: (value) => (
        <span className="font-medium text-blue-600">{value}</span>
      ),
    },
    {
      key: 'employeeName',
      label: 'User Name',
      minWidth: '150px',
    },
    {
      key: 'ticketType',
      label: 'Ticket Type',
      minWidth: '120px',
    },
    {
      key: 'subject',
      label: 'Subject',
      minWidth: '200px',
    },
    {
      key: 'priority',
      label: 'Priority',
      minWidth: '100px',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      minWidth: '100px',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      minWidth: '120px',
      render: (value) => formatDate(value),
    },
    {
      key: 'actions',
      label: 'Action(s)',
      minWidth: '200px',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedTicket(record);
              setViewModalOpen(true);
            }}
            className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="View Ticket"
          >
            <Eye className="h-4 w-4 text-gray-700" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="px-2 py-1 text-xs text-white bg-black rounded">
                View Ticket
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black"></div>
              </div>
            </div>
          </button>
          <button
            onClick={() => {
              setSelectedTicket(record);
              setTrackModalOpen(true);
            }}
            className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="Track Ticket"
          >
            <Clock className="h-4 w-4 text-gray-700" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="px-2 py-1 text-xs text-white bg-black rounded">
                Track Ticket
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black"></div>
              </div>
            </div>
          </button>
          {record.status !== 'Closed' && (
            <button
              onClick={() => {
                setSelectedTicket(record);
                setStatusUpdate({ status: record.status, note: '' });
                setEditModalOpen(true);
              }}
              className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
              title="Update Status"
            >
              <Edit className="h-4 w-4 text-gray-700" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <div className="px-2 py-1 text-xs text-white bg-black rounded">
                  Update Status
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                  <div className="border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </button>
          )}
          {record.status === 'Closed' && (
            <button
              onClick={() => handleReopenTicket(record)}
              className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
              title="Reopen Ticket"
            >
              <RefreshCw className="h-4 w-4 text-gray-700" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <div className="px-2 py-1 text-xs text-white bg-black rounded">
                  Reopen Ticket
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                  <div className="border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </button>
          )}
          <button
            onClick={() => handleDeleteTicket(record.ticketId)}
            className="relative group w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="Delete Ticket"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="px-2 py-1 text-xs text-white bg-black rounded">
                Delete Ticket
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black"></div>
              </div>
            </div>
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ticket List</h1>
        </div>

        {/* Filter Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="relative flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs font-medium rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>

        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          title="Search Filters"
          activeFilterCount={getActiveFilterCount()}
          onApply={applyFilters}
          onReset={clearFilters}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="ticketType">Ticket Type</Label>
              <Select
                id="ticketType"
                value={filters.ticketType}
                onChange={(e) => handleFilterChange('ticketType', e.target.value)}
                className="w-full"
              >
                <option value="">Please select</option>
                <option value="Work From Home">Work From Home</option>
                <option value="Early Leave">Early Leave</option>
                <option value="Emergency Break">Emergency Break</option>
                <option value="Support">Support</option>
                <option value="Others">Others</option>
                <option value="Hardware">Hardware</option>
                <option value="Suggestion">Suggestion</option>
                <option value="Software">Software</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Ticket Priority</Label>
              <Select
                id="priority"
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full"
              >
                <option value="">Please select</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Ticket Status</Label>
              <Select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full"
              >
                <option value="">Please select</option>
                <option value="Open">Open</option>
                <option value="InProgress">InProgress</option>
                <option value="Closed">Closed</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </FilterDrawer>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicTable
              data={tickets}
              columns={ticketColumns}
              loading={loading}
              emptyMessage="No tickets found."
              pagination={pagination}
              onPageChange={handlePageChange}
              recordsPerPage={filters.limit}
              onRecordsPerPageChange={(limit) => {
                handleFilterChange('limit', limit);
                setPagination((prev) => ({ ...prev, page: 1 }));
                setTimeout(() => {
                  fetchTickets(1);
                }, 100);
              }}
              keyExtractor={(record) => record._id}
              stickyHeader={true}
              maxHeight="calc(100vh - 400px)"
            />
          </CardContent>
        </Card>

        {/* View Ticket Modal */}
        <DynamicModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedTicket(null);
          }}
          title="Ticket Details"
          maxWidth="max-w-3xl"
        >
          {selectedTicket && (
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-sm font-normal mb-1 block">Ticket ID:</Label>
                  <p className="text-gray-900 font-semibold text-lg">{selectedTicket.ticketId}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm font-normal mb-1 block">Employee Name:</Label>
                  <p className="text-gray-900 font-medium">{selectedTicket.employeeName}</p>
                </div>
                <div>
                  <Label className="text-gray-700 text-sm font-normal mb-1 block">Status:</Label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm font-normal mb-1 block">Ticket Type:</Label>
                  <p className="text-gray-900 font-medium">{selectedTicket.ticketType}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm font-normal mb-1 block">Priority:</Label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                {selectedTicket.date && (
                  <div>
                    <Label className="text-gray-500 text-sm font-normal mb-1 block">Date:</Label>
                    <p className="text-gray-900 font-medium">{formatDate(selectedTicket.date.toString())}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-500 text-sm font-normal mb-1 block">Created Date:</Label>
                  <p className="text-gray-900 font-medium">{formatDate(selectedTicket.createdAt)}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500 text-sm font-normal mb-1 block">Subject:</Label>
                <p className="text-gray-900 font-medium">{selectedTicket.subject}</p>
              </div>
              <div>
                <Label className="text-gray-500 text-sm font-normal mb-1 block">Description:</Label>
                <div
                  className="ticket-description-view mt-2 p-4 border border-gray-200 rounded-md bg-white"
                  dangerouslySetInnerHTML={{ __html: selectedTicket.description }}
                  style={{
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    minHeight: '100px',
                    lineHeight: '1.6',
                    fontSize: '14px',
                    color: '#374151',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
          )}
        </DynamicModal>

        {/* Edit Ticket Modal */}
        <DynamicModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedTicket(null);
            setStatusUpdate({ status: '', note: '' });
          }}
          title="Update Ticket Status"
          maxWidth="max-w-2xl"
        >
          {selectedTicket && (
            <div className="space-y-4 p-6">
              <div>
                <Label htmlFor="status" className="text-gray-700 text-sm font-normal mb-1 block">
                  <span className="text-red-500">*</span> Status:
                </Label>
                <Select
                  id="status"
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  className="w-full"
                  required
                >
                  <option value="">Please select</option>
                  <option value="Open">Open</option>
                  <option value="InProgress">InProgress</option>
                  <option value="Closed">Closed</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="note" className="text-gray-700 text-sm font-normal mb-1 block">Note (Optional):</Label>
                <textarea
                  id="note"
                  value={statusUpdate.note}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, note: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                  rows={4}
                  placeholder="Add a note about this status update..."
                />
              </div>
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditModalOpen(false);
                    setStatusUpdate({ status: '', note: '' });
                  }}
                  className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={updating || !statusUpdate.status}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {updating ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          )}
        </DynamicModal>

        {/* Track Ticket Modal */}
        <DynamicModal
          isOpen={trackModalOpen}
          onClose={() => {
            setTrackModalOpen(false);
            setSelectedTicket(null);
          }}
          title="Track Details"
          maxWidth="max-w-2xl"
        >
          {selectedTicket && (
            <div className="p-6">
              <div className="relative">
                {selectedTicket.trackHistory.map((track, index) => (
                  <div key={index} className="relative pb-8">
                    {index !== selectedTicket.trackHistory.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-300" />
                    )}
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        track.status === 'Closed' ? 'border-green-500 bg-green-50' :
                        track.status === 'InProgress' ? 'border-purple-500 bg-purple-50' :
                        'border-blue-500 bg-blue-50'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${
                          track.status === 'Closed' ? 'bg-green-500' :
                          track.status === 'InProgress' ? 'bg-purple-500' :
                          'bg-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{track.status}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(track.date)} -&gt; {new Date(track.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                        {track.note && (
                          <p className="text-sm text-gray-700 mt-1">-&gt; {track.note}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DynamicModal>
      </div>
    </Layout>
  );
}
