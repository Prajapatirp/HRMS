'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, User, Mail, Phone, MapPin, Calendar, DollarSign, Building, Briefcase } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Employee {
  _id: string;
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  jobInfo: {
    department: string;
    designation: string;
    employmentType: string;
    joiningDate: string;
    salary: number;
    workLocation: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null | any;
  onEdit: () => void;
}

export default function EmployeeDetailsModal({ isOpen, onClose, employee, onEdit }: EmployeeDetailsModalProps) {
  const router = useRouter();

  const handleEdit = () => {
    onClose();
    router.push(`/employees/add?id=${employee.employeeId}`);
  };

  if (!isOpen || !employee) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex-shrink-0 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Employee Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-8 bg-white overflow-y-auto flex-1">
          {/* Employee Header */}
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {employee.personalInfo.firstName.charAt(0)}
                {employee.personalInfo.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {employee.personalInfo.firstName} {employee.personalInfo.lastName}
              </h3>
              <p className="text-gray-600">{employee.employeeId}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                employee.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {employee.status}
              </span>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <p className="text-gray-900">{employee.personalInfo.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <p className="text-gray-900">{employee.personalInfo.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {employee.personalInfo.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {employee.personalInfo.phone}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(employee.personalInfo.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <p className="text-gray-900 capitalize">{employee.personalInfo.gender}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Address
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900">{employee.personalInfo.address.street}</p>
              <p className="text-gray-900">
                {employee.personalInfo.address.city}, {employee.personalInfo.address.state} {employee.personalInfo.address.zipCode}
              </p>
              <p className="text-gray-900">{employee.personalInfo.address.country}</p>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{employee.personalInfo.emergencyContact.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Relationship</label>
                <p className="text-gray-900">{employee.personalInfo.emergencyContact.relationship}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900">{employee.personalInfo.emergencyContact.phone}</p>
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Job Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="text-gray-900 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    {employee.jobInfo.department}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Designation</label>
                  <p className="text-gray-900">{employee.jobInfo.designation}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                  <p className="text-gray-900 capitalize">{employee.jobInfo.employmentType}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(employee.jobInfo.joiningDate)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Salary</label>
                  <p className="text-gray-900 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    ${employee.jobInfo.salary.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Location</label>
                  <p className="text-gray-900">{employee.jobInfo.workLocation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="text-gray-900">{formatDate(employee.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-gray-900">{formatDate(employee.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleEdit}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              Edit Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
