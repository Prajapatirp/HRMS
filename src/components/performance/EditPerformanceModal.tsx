'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Trash2, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
}

interface EditPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: PerformanceReview | null;
  onSuccess: () => void;
}

export default function EditPerformanceModal({ isOpen, onClose, review, onSuccess }: EditPerformanceModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    reviewPeriod: {
      startDate: '',
      endDate: '',
    },
    goals: [] as Array<{
      description: string;
      target: string;
      achieved: string;
      rating: number;
    }>,
    competencies: [] as Array<{
      skill: string;
      rating: number;
      comments: string;
    }>,
    overallRating: 0,
    strengths: [] as string[],
    areasForImprovement: [] as string[],
    reviewerComments: '',
    employeeComments: '',
    status: 'draft',
  });

  useEffect(() => {
    if (review) {
      setFormData({
        reviewPeriod: {
          startDate: review.reviewPeriod.startDate.split('T')[0],
          endDate: review.reviewPeriod.endDate.split('T')[0],
        },
        goals: review.goals.map(goal => ({
          description: goal.description,
          target: goal.target,
          achieved: goal.achieved,
          rating: goal.rating,
        })),
        competencies: review.competencies.map(comp => ({
          skill: comp.skill,
          rating: comp.rating,
          comments: comp.comments,
        })),
        overallRating: review.overallRating,
        strengths: [...review.strengths],
        areasForImprovement: [...review.areasForImprovement],
        reviewerComments: review.reviewerComments,
        employeeComments: review.employeeComments || '',
        status: review.status,
      });
    }
  }, [review]);

  const addGoal = () => {
    setFormData((prev: any) => ({
      ...prev,
      goals: [...prev.goals, { description: '', target: '', achieved: '', rating: 1 }],
    }));
  };

  const removeGoal = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      goals: prev.goals.filter((_: any, i: number) => i !== index),
    }));
  };

  const updateGoal = (index: number, field: string, value: string | number) => {
    setFormData((prev: any) => ({
      ...prev,
      goals: prev.goals.map((goal: any, i: number) => 
        i === index ? { ...goal, [field]: value } : goal
      ),
    }));
  };

  const addCompetency = () => {
    setFormData((prev: any) => ({
      ...prev,
      competencies: [...prev.competencies, { skill: '', rating: 1, comments: '' }],
    }));
  };

  const removeCompetency = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      competencies: prev.competencies.filter((_: any, i: number) => i !== index),
    }));
  };

  const updateCompetency = (index: number, field: string, value: string | number) => {
    setFormData((prev: any) => ({
      ...prev,
      competencies: prev.competencies.map((comp: any, i: number) => 
        i === index ? { ...comp, [field]: value } : comp
      ),
    }));
  };

  const addStrength = () => {
    setFormData((prev: any) => ({
      ...prev,
      strengths: [...prev.strengths, ''],
    }));
  };

  const removeStrength = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      strengths: prev.strengths.filter((_: any, i: number) => i !== index),
    }));
  };

  const updateStrength = (index: number, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      strengths: prev.strengths.map((strength: any, i: number) => 
        i === index ? value : strength
      ),
    }));
  };

  const addAreaForImprovement = () => {
    setFormData((prev: any) => ({
      ...prev,
      areasForImprovement: [...prev.areasForImprovement, ''],
    }));
  };

  const removeAreaForImprovement = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      areasForImprovement: prev.areasForImprovement.filter((_: any, i: number) => i !== index),
    }));
  };

  const updateAreaForImprovement = (index: number, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      areasForImprovement: prev.areasForImprovement.map((area: any, i: number) => 
        i === index ? value : area
      ),
    }));
  };

  const getRatingStars = (rating: number, onChange: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 cursor-pointer ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
        onClick={() => onChange(i + 1)}
      />
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!review) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/performance/${review._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to update performance review');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Performance Review</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Review Period */}
          <Card>
            <CardHeader>
              <CardTitle>Review Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.reviewPeriod.startDate}
                    onChange={(e) => setFormData((prev: any) => ({
                      ...prev,
                      reviewPeriod: { ...prev.reviewPeriod, startDate: e.target.value }
                    }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.reviewPeriod.endDate}
                    onChange={(e) => setFormData((prev: any) => ({
                      ...prev,
                      reviewPeriod: { ...prev.reviewPeriod, endDate: e.target.value }
                    }))}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Goals & Objectives</CardTitle>
                <Button type="button" onClick={addGoal} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.goals.map((goal, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Goal {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeGoal(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={goal.description}
                          onChange={(e) => updateGoal(index, 'description', e.target.value)}
                          placeholder="Goal description"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Target</Label>
                          <Input
                            value={goal.target}
                            onChange={(e) => updateGoal(index, 'target', e.target.value)}
                            placeholder="Target achievement"
                            required
                          />
                        </div>
                        <div>
                          <Label>Achieved</Label>
                          <Input
                            value={goal.achieved}
                            onChange={(e) => updateGoal(index, 'achieved', e.target.value)}
                            placeholder="Actual achievement"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Rating</Label>
                        <div className="flex items-center space-x-2">
                          {getRatingStars(goal.rating, (rating) => updateGoal(index, 'rating', rating))}
                          <span className="text-sm text-gray-600">{goal.rating}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competencies */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Competencies</CardTitle>
                <Button type="button" onClick={addCompetency} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Competency
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.competencies.map((competency, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Competency {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCompetency(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Skill</Label>
                        <Input
                          value={competency.skill}
                          onChange={(e) => updateCompetency(index, 'skill', e.target.value)}
                          placeholder="Skill name"
                          required
                        />
                      </div>
                      <div>
                        <Label>Rating</Label>
                        <div className="flex items-center space-x-2">
                          {getRatingStars(competency.rating, (rating) => updateCompetency(index, 'rating', rating))}
                          <span className="text-sm text-gray-600">{competency.rating}/5</span>
                        </div>
                      </div>
                      <div>
                        <Label>Comments</Label>
                        <Input
                          value={competency.comments}
                          onChange={(e) => updateCompetency(index, 'comments', e.target.value)}
                          placeholder="Comments about this competency"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overall Rating */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getRatingStars(formData.overallRating, (rating) => setFormData((prev: any) => ({ ...prev, overallRating: rating })))}
                <span className="text-lg font-medium text-gray-600">{formData.overallRating}/5</span>
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Strengths</CardTitle>
                <Button type="button" onClick={addStrength} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Strength
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formData.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={strength}
                      onChange={(e) => updateStrength(index, e.target.value)}
                      placeholder="Enter a strength"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeStrength(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Areas for Improvement</CardTitle>
                <Button type="button" onClick={addAreaForImprovement} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Area
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formData.areasForImprovement.map((area, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={area}
                      onChange={(e) => updateAreaForImprovement(index, e.target.value)}
                      placeholder="Enter an area for improvement"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAreaForImprovement(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reviewerComments">Reviewer Comments</Label>
                  <Input
                    id="reviewerComments"
                    value={formData.reviewerComments}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, reviewerComments: e.target.value }))}
                    placeholder="Enter reviewer comments"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="employeeComments">Employee Comments</Label>
                  <Input
                    id="employeeComments"
                    value={formData.employeeComments}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, employeeComments: e.target.value }))}
                    placeholder="Enter employee comments (optional)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.status}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, status: e.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
              </Select>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
