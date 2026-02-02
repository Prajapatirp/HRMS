'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TrendingUp, Plus, Star, Target, Award, Filter, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import CreateReviewModal from '@/components/performance/CreateReviewModal';
import PerformanceDetailsModal from '@/components/performance/PerformanceDetailsModal';
import EditPerformanceModal from '@/components/performance/EditPerformanceModal';
import FilterDrawer from '@/components/ui/filter-drawer';

interface PerformanceReview {
  _id: string;
  reviewPeriod: {
    startDate: string;
    endDate: string;
  };
  goals: Array<{
    description: string;
    target: string;
    achieved: string;
    rating: number;
  }>;
  competencies: Array<{
    skill: string;
    rating: number;
    comments: string;
  }>;
  overallRating: number;
  strengths: string[];
  areasForImprovement: string[];
  reviewerComments: string;
  employeeComments?: string;
  status: string;
  reviewedBy: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function PerformancePage() {
  const { user, token } = useAuth();
  const [performance, setPerformance] = useState<PerformanceReview[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    minRating: '',
    maxRating: '',
    reviewedBy: '',
    limit: '10'
  });

  const fetchPerformance = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', filters.limit);
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.minRating) queryParams.append('minRating', filters.minRating);
      if (filters.maxRating) queryParams.append('maxRating', filters.maxRating);
      if (filters.reviewedBy) queryParams.append('reviewedBy', filters.reviewedBy);

      const response = await fetch(`/api/performance?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPerformance(data.performance);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    if (token) {
      fetchPerformance();
    }
  }, [token, fetchPerformance]);

  const handleCreateSuccess = () => {
    fetchPerformance(); // Refresh the performance list
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setPagination((prev: any) => ({ ...prev, page: 1 }));
    fetchPerformance(1);
    setFilterDrawerOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      minRating: '',
      maxRating: '',
      reviewedBy: '',
      limit: '10'
    });
    setPagination((prev: any) => ({ ...prev, page: 1 }));
    setTimeout(() => fetchPerformance(1), 100);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.minRating) count++;
    if (filters.maxRating) count++;
    if (filters.reviewedBy) count++;
    return count;
  };

  const handlePageChange = (newPage: number) => {
    fetchPerformance(newPage);
  };

  const handleViewDetails = (review: PerformanceReview) => {
    setSelectedReview(review);
    setShowDetailsModal(true);
  };

  const handleEditReview = (review: PerformanceReview) => {
    setSelectedReview(review);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    fetchPerformance(pagination.page);
    setShowEditModal(false);
    setSelectedReview(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getOverallRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
            {/* <p className="text-gray-600">Track your performance reviews and goals</p>s */}
          </div>
          {(user.role === 'admin' || user.role === 'hr' || user.role === 'manager') && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Review</span>
            </Button>
          )}
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performance.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance.length > 0 
                  ? (performance.reduce((sum, review) => sum + review.overallRating, 0) / performance.length).toFixed(1)
                  : '0.0'
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Goals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance.reduce((sum, review) => 
                  sum + review.goals.filter(goal => goal.rating >= 4).length, 0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Review</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance.length > 0 
                  ? performance[0].overallRating.toFixed(1)
                  : 'N/A'
                }
              </div>
            </CardContent>
          </Card>
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
          title="Filter Performance Reviews"
          activeFilterCount={getActiveFilterCount()}
          onApply={applyFilters}
          onReset={clearFilters}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="status" className="text-gray-700 mb-1">Status</Label>
              <Select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full"
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate" className="text-gray-700 mb-1">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="endDate" className="text-gray-700 mb-1">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="minRating" className="text-gray-700 mb-1">Min Rating</Label>
              <Select
                id="minRating"
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
                className="w-full"
              >
                <option value="">Any rating</option>
                <option value="1">1+ stars</option>
                <option value="2">2+ stars</option>
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="5">5 stars</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxRating" className="text-gray-700 mb-1">Max Rating</Label>
              <Select
                id="maxRating"
                value={filters.maxRating}
                onChange={(e) => handleFilterChange('maxRating', e.target.value)}
                className="w-full"
              >
                <option value="">Any rating</option>
                <option value="1">1 star</option>
                <option value="2">2 stars</option>
                <option value="3">3 stars</option>
                <option value="4">4 stars</option>
                <option value="5">5 stars</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="reviewedBy" className="text-gray-700 mb-1">Reviewed By</Label>
              <Input
                id="reviewedBy"
                value={filters.reviewedBy}
                onChange={(e) => handleFilterChange('reviewedBy', e.target.value)}
                placeholder="Search reviewer"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="limit" className="text-gray-700 mb-1">Records per page</Label>
              <Select
                id="limit"
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', e.target.value)}
                className="w-full"
              >
                <option value="5">5 records</option>
                <option value="10">10 records</option>
                <option value="20">20 records</option>
                <option value="50">50 records</option>
              </Select>
            </div>
          </div>
        </FilterDrawer>

        {/* Performance Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Reviews</CardTitle>
            <CardDescription>
              Showing {performance.length} of {pagination.total} records
              {pagination.total > 0 && (
                <span> (Page {pagination.page} of {pagination.pages})</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Review Period</TableHead>
                    <TableHead>Overall Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Goals Count</TableHead>
                    <TableHead>Reviewed By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performance.map((review: any) => (
                    <TableRow key={review._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formatDate(review.reviewPeriod.startDate)} to {formatDate(review.reviewPeriod.endDate)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg font-bold ${getOverallRatingColor(review.overallRating)}`}>
                            {review.overallRating.toFixed(1)}
                          </span>
                          <div className="flex items-center space-x-1">
                            {getRatingStars(Math.round(review.overallRating))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                          {review.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {review.goals.length} goals
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {review.reviewedBy}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {formatDate(review.createdAt || new Date().toISOString())}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(review)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </Button>
                          {(review.status === 'draft' || user.role === 'admin' || user.role === 'hr') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditReview(review)}
                              className="flex items-center space-x-1"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {performance.length === 0 && !loading && (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No performance reviews</h3>
                <p className="text-gray-600">No performance reviews found matching your criteria.</p>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
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
                          onClick={() => handlePageChange(pageNum)}
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
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Review Modal */}
        <CreateReviewModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />

        {/* Performance Details Modal */}
        <PerformanceDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedReview(null);
          }}
          review={selectedReview}
        />

        {/* Edit Performance Modal */}
        <EditPerformanceModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedReview(null);
          }}
          review={selectedReview}
          onSuccess={handleEditSuccess}
        />
      </div>
    </Layout>
  );
}
