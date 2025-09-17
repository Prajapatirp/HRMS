/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, X, Plus, Trash2, Star } from 'lucide-react';

interface Employee {
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
  };
  jobInfo: {
    department: string;
    position: string;
  };
}

interface CreateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Goal {
  description: string;
  target: string;
  achieved: string;
  rating: number;
}

interface Competency {
  skill: string;
  rating: number;
  comments: string;
}

export default function CreateReviewModal({ isOpen, onClose, onSuccess }: CreateReviewModalProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    reviewPeriod: {
      startDate: '',
      endDate: '',
    },
    goals: [
      { description: '', target: '', achieved: '', rating: 3 }
    ] as Goal[],
    competencies: [
      { skill: '', rating: 3, comments: '' }
    ] as Competency[],
    overallRating: 3,
    strengths: [''],
    areasForImprovement: [''],
    reviewerComments: '',
    status: 'draft' as 'draft' | 'submitted' | 'reviewed' | 'approved',
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Fetch employees when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      } else {
        console.error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parentField: string, childField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField as keyof typeof prev],
        [childField]: value
      }
    }));
  };

  const handleArrayInputChange = (field: string, index: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].map((item: any, i: number) => 
        i === index ? { ...item, ...value } : item
      )
    }));
  };

  const addGoal = () => {
    setFormData(prev => ({
      ...prev,
      goals: [...prev.goals, { description: '', target: '', achieved: '', rating: 3 }]
    }));
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const addCompetency = () => {
    setFormData(prev => ({
      ...prev,
      competencies: [...prev.competencies, { skill: '', rating: 3, comments: '' }]
    }));
  };

  const removeCompetency = (index: number) => {
    setFormData(prev => ({
      ...prev,
      competencies: prev.competencies.filter((_, i) => i !== index)
    }));
  };

  const addStrength = () => {
    setFormData(prev => ({
      ...prev,
      strengths: [...prev.strengths, '']
    }));
  };

  const removeStrength = (index: number) => {
    setFormData(prev => ({
      ...prev,
      strengths: prev.strengths.filter((_, i) => i !== index)
    }));
  };

  const addImprovementArea = () => {
    setFormData(prev => ({
      ...prev,
      areasForImprovement: [...prev.areasForImprovement, '']
    }));
  };

  const removeImprovementArea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      areasForImprovement: prev.areasForImprovement.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Clean up empty strings from arrays
      const cleanedData = {
        ...formData,
        strengths: formData.strengths.filter(s => s.trim() !== ''),
        areasForImprovement: formData.areasForImprovement.filter(a => a.trim() !== ''),
      };

      const response = await fetch('/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(cleanedData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Performance review created successfully!');
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          employeeId: '',
          reviewPeriod: { startDate: '', endDate: '' },
          goals: [{ description: '', target: '', achieved: '', rating: 3 }],
          competencies: [{ skill: '', rating: 3, comments: '' }],
          overallRating: 3,
          strengths: [''],
          areasForImprovement: [''],
          reviewerComments: '',
          status: 'draft',
        });
        setError('');
      } else {
        setError(data.error || 'Failed to create performance review');
      }
    } catch (err) {
      setError('Failed to create performance review');
      console.error('Create performance review error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRatingStars = (rating: number, onChange: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onChange(i + 1)}
        className={`h-5 w-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        } hover:text-yellow-400 transition-colors`}
      >
        <Star className="h-full w-full" />
      </button>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Create Performance Review</span>
            </CardTitle>
            <CardDescription>
              Create a new performance review for an employee
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Select Employee</Label>
                {loadingEmployees ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading employees...</span>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-red-50 text-red-600 text-sm">
                    No employees found. Please ensure employees are added to the system.
                  </div>
                ) : (
                  <select
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select an employee</option>
                    {employees.map((employee) => (
                      <option key={employee.employeeId} value={employee.employeeId}>
                        {employee.personalInfo.firstName} {employee.personalInfo.lastName} - {employee.employeeId}
                        {employee.jobInfo.department && ` (${employee.jobInfo.department})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>

            {/* Selected Employee Info */}
            {formData.employeeId && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Selected Employee</h4>
                {(() => {
                  const selectedEmployee = employees.find(emp => emp.employeeId === formData.employeeId);
                  return selectedEmployee ? (
                    <div className="text-sm text-blue-800">
                      <p><strong>Name:</strong> {selectedEmployee.personalInfo.firstName} {selectedEmployee.personalInfo.lastName}</p>
                      <p><strong>Employee ID:</strong> {selectedEmployee.employeeId}</p>
                      {selectedEmployee.jobInfo.department && (
                        <p><strong>Department:</strong> {selectedEmployee.jobInfo.department}</p>
                      )}
                      {selectedEmployee.jobInfo.position && (
                        <p><strong>Position:</strong> {selectedEmployee.jobInfo.position}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-blue-800">Employee information not available</p>
                  );
                })()}
              </div>
            )}

            {/* Review Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.reviewPeriod.startDate}
                  onChange={(e) => handleNestedInputChange('reviewPeriod', 'startDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.reviewPeriod.endDate}
                  onChange={(e) => handleNestedInputChange('reviewPeriod', 'endDate', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Goals */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Goals & Objectives</Label>
                <Button type="button" onClick={addGoal} size="sm" className="flex items-center space-x-1">
                  <Plus className="h-4 w-4" />
                  <span>Add Goal</span>
                </Button>
              </div>
              {formData.goals.map((goal, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Goal {index + 1}</span>
                    {formData.goals.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeGoal(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={goal.description}
                        onChange={(e) => handleArrayInputChange('goals', index, { description: e.target.value })}
                        placeholder="Goal description"
                        required
                      />
                    </div>
                    <div>
                      <Label>Target</Label>
                      <Input
                        value={goal.target}
                        onChange={(e) => handleArrayInputChange('goals', index, { target: e.target.value })}
                        placeholder="Target to achieve"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Achieved</Label>
                      <Input
                        value={goal.achieved}
                        onChange={(e) => handleArrayInputChange('goals', index, { achieved: e.target.value })}
                        placeholder="What was achieved"
                        required
                      />
                    </div>
                    <div>
                      <Label>Rating</Label>
                      <div className="flex items-center space-x-1">
                        {getRatingStars(goal.rating, (rating) => handleArrayInputChange('goals', index, { rating }))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Competencies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Competencies</Label>
                <Button type="button" onClick={addCompetency} size="sm" className="flex items-center space-x-1">
                  <Plus className="h-4 w-4" />
                  <span>Add Competency</span>
                </Button>
              </div>
              {formData.competencies.map((competency, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Competency {index + 1}</span>
                    {formData.competencies.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeCompetency(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Skill</Label>
                      <Input
                        value={competency.skill}
                        onChange={(e) => handleArrayInputChange('competencies', index, { skill: e.target.value })}
                        placeholder="Skill name"
                        required
                      />
                    </div>
                    <div>
                      <Label>Rating</Label>
                      <div className="flex items-center space-x-1">
                        {getRatingStars(competency.rating, (rating) => handleArrayInputChange('competencies', index, { rating }))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Comments</Label>
                    <Input
                      value={competency.comments}
                      onChange={(e) => handleArrayInputChange('competencies', index, { comments: e.target.value })}
                      placeholder="Comments about this competency"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Rating */}
            <div className="space-y-2">
              <Label>Overall Rating</Label>
              <div className="flex items-center space-x-1">
                {getRatingStars(formData.overallRating, (rating) => handleInputChange('overallRating', rating))}
              </div>
            </div>

            {/* Strengths */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Strengths</Label>
                <Button type="button" onClick={addStrength} size="sm" className="flex items-center space-x-1">
                  <Plus className="h-4 w-4" />
                  <span>Add Strength</span>
                </Button>
              </div>
              {formData.strengths.map((strength, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={strength}
                    onChange={(e) => {
                      const newStrengths = [...formData.strengths];
                      newStrengths[index] = e.target.value;
                      handleInputChange('strengths', newStrengths);
                    }}
                    placeholder="Enter a strength"
                  />
                  {formData.strengths.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeStrength(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Areas for Improvement */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Areas for Improvement</Label>
                <Button type="button" onClick={addImprovementArea} size="sm" className="flex items-center space-x-1">
                  <Plus className="h-4 w-4" />
                  <span>Add Area</span>
                </Button>
              </div>
              {formData.areasForImprovement.map((area, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={area}
                    onChange={(e) => {
                      const newAreas = [...formData.areasForImprovement];
                      newAreas[index] = e.target.value;
                      handleInputChange('areasForImprovement', newAreas);
                    }}
                    placeholder="Enter an area for improvement"
                  />
                  {formData.areasForImprovement.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeImprovementArea(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Reviewer Comments */}
            <div className="space-y-2">
              <Label htmlFor="reviewerComments">Reviewer Comments</Label>
              <textarea
                id="reviewerComments"
                value={formData.reviewerComments}
                onChange={(e) => handleInputChange('reviewerComments', e.target.value)}
                placeholder="Enter reviewer comments"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

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
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Review'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
