'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Target, TrendingUp, X, Calendar, User, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';

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
  createdAt: string;
}

interface PerformanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: PerformanceReview | null | any;
}

export default function PerformanceDetailsModal({ isOpen, onClose, review }: PerformanceDetailsModalProps) {
  if (!isOpen || !review) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Performance Review Details</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Review Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {formatDate(review.reviewPeriod.startDate)} to {formatDate(review.reviewPeriod.endDate)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Overall Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <span className={`text-2xl font-bold ${getOverallRatingColor(review.overallRating)}`}>
                    {review.overallRating.toFixed(1)}
                  </span>
                  <div className="flex items-center space-x-1">
                    {getRatingStars(Math.round(review.overallRating))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                  {review.status}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Goals Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Goals & Objectives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {review.goals.map((goal: any, index: any) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{goal.description}</h4>
                      <div className="flex items-center space-x-1">
                        {getRatingStars(goal.rating)}
                        <span className="ml-2 text-sm font-medium text-gray-600">
                          {goal.rating}/5
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Target:</p>
                        <p className="text-gray-600">{goal.target}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Achieved:</p>
                        <p className="text-gray-600">{goal.achieved}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competencies Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Competencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {review.competencies.map((competency: any, index: any) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{competency.skill}</h4>
                      <div className="flex items-center space-x-1">
                        {getRatingStars(competency.rating)}
                        <span className="ml-2 text-sm font-medium text-gray-600">
                          {competency.rating}/5
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{competency.comments}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strengths and Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.strengths.map((strength: any, index: any) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2 mt-1">•</span>
                      <span className="text-sm text-gray-600">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.areasForImprovement.map((area: any, index: any) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-1">•</span>
                      <span className="text-sm text-gray-600">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Reviewer Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
                  {review.reviewerComments}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Reviewed by: {review.reviewedBy} • {review.reviewedAt ? formatDate(review.reviewedAt) : 'Not reviewed yet'}
                </div>
              </CardContent>
            </Card>

            {review.employeeComments && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Employee Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                    {review.employeeComments}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end p-6 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
