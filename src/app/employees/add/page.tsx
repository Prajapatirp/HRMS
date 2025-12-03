'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Phone, MapPin, DollarSign, ArrowLeft } from 'lucide-react';

const validationSchema = Yup.object({
  personalInfo: Yup.object({
    firstName: Yup.string()
      .required('First name is required')
      .min(2, 'First name must be at least 2 characters'),
    lastName: Yup.string()
      .required('Last name is required')
      .min(2, 'Last name must be at least 2 characters'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    phone: Yup.string()
      .required('Phone number is required')
      .test('phone-length', 'Phone number must be exactly 10 digits', (value) => {
        if (!value) return false;
        const digitsOnly = value.replace(/\D/g, '');
        return digitsOnly.length === 10;
      }),
    dateOfBirth: Yup.date()
      .required('Date of birth is required')
      .max(new Date(), 'Date of birth cannot be in the future'),
    gender: Yup.string()
      .required('Gender is required')
      .oneOf(['male', 'female', 'other'], 'Invalid gender selection'),
    address: Yup.object({
      street: Yup.string()
        .required('Street address is required')
        .min(5, 'Street address must be at least 5 characters'),
      city: Yup.string()
        .required('City is required')
        .min(2, 'City must be at least 2 characters'),
      state: Yup.string()
        .required('State is required')
        .min(2, 'State must be at least 2 characters'),
      zipCode: Yup.string()
        .required('ZIP code is required')
        .matches(/^\d{6}(-\d{4})?$/, 'Invalid ZIP code format'),
      country: Yup.string()
        .required('Country is required')
        .min(2, 'Country must be at least 2 characters'),
    }),
    emergencyContact: Yup.object({
      name: Yup.string()
        .required('Emergency contact name is required')
        .min(2, 'Name must be at least 2 characters'),
      relationship: Yup.string()
        .required('Relationship is required')
        .min(2, 'Relationship must be at least 2 characters'),
      phone: Yup.string()
        .required('Emergency contact phone is required')
        .test('phone-length', 'Phone number must be exactly 10 digits', (value) => {
          if (!value) return false;
          const digitsOnly = value.replace(/\D/g, '');
          return digitsOnly.length === 10;
        }),
    }),
  }),
  jobInfo: Yup.object({
    department: Yup.string()
      .required('Department is required'),
    designation: Yup.string()
      .required('Designation is required')
      .min(2, 'Designation must be at least 2 characters'),
    employmentType: Yup.string()
      .required('Employment type is required')
      .oneOf(['full-time', 'part-time', 'contract', 'intern'], 'Invalid employment type'),
    joiningDate: Yup.date()
      .required('Joining date is required'),
    salary: Yup.number()
      .required('Salary is required')
      .min(0, 'Salary must be a positive number'),
    workLocation: Yup.string()
      .required('Work location is required')
      .min(2, 'Work location must be at least 2 characters'),
  }),
});

function AddEmployeePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('id');
  const isEditMode = !!employeeId;
  const { token } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(isEditMode);
  const [error, setError] = React.useState('');
  const [employeeData, setEmployeeData] = React.useState<any>(null);

  // Fetch employee data if in edit mode
  React.useEffect(() => {
    if (isEditMode && token && employeeId) {
      const fetchEmployee = async () => {
        try {
          setFetching(true);
          const response = await fetch(`/api/employees/${employeeId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setEmployeeData(data.employee);
          } else {
            setError('Failed to load employee data');
          }
        } catch {
          setError('Network error. Please try again.');
        } finally {
          setFetching(false);
        }
      };

      fetchEmployee();
    }
  }, [isEditMode, token, employeeId]);

  const getInitialValues = () => {
    if (isEditMode && employeeData) {
      return {
        personalInfo: {
          firstName: employeeData.personalInfo?.firstName || '',
          lastName: employeeData.personalInfo?.lastName || '',
          email: employeeData.personalInfo?.email || '',
          phone: employeeData.personalInfo?.phone || '',
          dateOfBirth: employeeData.personalInfo?.dateOfBirth ? employeeData.personalInfo.dateOfBirth.split('T')[0] : '',
          gender: employeeData.personalInfo?.gender || '',
          address: {
            street: employeeData.personalInfo?.address?.street || '',
            city: employeeData.personalInfo?.address?.city || '',
            state: employeeData.personalInfo?.address?.state || '',
            zipCode: employeeData.personalInfo?.address?.zipCode || '',
            country: employeeData.personalInfo?.address?.country || '',
          },
          emergencyContact: {
            name: employeeData.personalInfo?.emergencyContact?.name || '',
            relationship: employeeData.personalInfo?.emergencyContact?.relationship || '',
            phone: employeeData.personalInfo?.emergencyContact?.phone || '',
          },
        },
        jobInfo: {
          department: employeeData.jobInfo?.department || '',
          designation: employeeData.jobInfo?.designation || '',
          employmentType: employeeData.jobInfo?.employmentType || '',
          joiningDate: employeeData.jobInfo?.joiningDate ? employeeData.jobInfo.joiningDate.split('T')[0] : '',
          salary: employeeData.jobInfo?.salary?.toString() || '',
          workLocation: employeeData.jobInfo?.workLocation || '',
        },
      };
    }

    return {
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
        },
      },
      jobInfo: {
        department: '',
        designation: '',
        employmentType: '',
        joiningDate: '',
        salary: '',
        workLocation: '',
      },
    };
  };

  const formik = useFormik({
    initialValues: getInitialValues(),
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');

      try {
        // Convert salary to number
        const submitData = {
          ...values,
          jobInfo: {
            ...values.jobInfo,
            salary: Number(values.jobInfo.salary),
          },
        };

        const url = isEditMode ? `/api/employees/${employeeId}` : '/api/employees';
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(submitData),
        });

        const data = await response.json();

        if (response.ok) {
          router.push('/employees');
        } else {
          setError(data.error || (isEditMode ? 'Failed to update employee' : 'Failed to create employee'));
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div className="ml-auto">
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Employee' : 'Add New Employee'}
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <form onSubmit={formik.handleSubmit} className="space-y-8">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="personalInfo.firstName"
                      placeholder="Enter first name"
                      value={formik.values.personalInfo.firstName}
                      onChange={(e) => formik.setFieldValue('personalInfo.firstName', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.personalInfo?.firstName && formik.errors.personalInfo?.firstName
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.personalInfo?.firstName && formik.errors.personalInfo?.firstName && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.firstName)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="personalInfo.lastName"
                      placeholder="Enter last name"
                      value={formik.values.personalInfo.lastName}
                      onChange={(e) => formik.setFieldValue('personalInfo.lastName', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.personalInfo?.lastName && formik.errors.personalInfo?.lastName
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.personalInfo?.lastName && formik.errors.personalInfo?.lastName && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.lastName)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      name="personalInfo.email"
                      placeholder="Enter email address"
                      value={formik.values.personalInfo.email}
                      onChange={(e) => formik.setFieldValue('personalInfo.email', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.personalInfo?.email && formik.errors.personalInfo?.email
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.personalInfo?.email && formik.errors.personalInfo?.email && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.email)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      name="personalInfo.phone"
                      placeholder="Enter phone number"
                      value={formik.values.personalInfo.phone}
                      onChange={(e) => formik.setFieldValue('personalInfo.phone', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.personalInfo?.phone && formik.errors.personalInfo?.phone
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.personalInfo?.phone && formik.errors.personalInfo?.phone && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.phone)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      name="personalInfo.dateOfBirth"
                      value={formik.values.personalInfo.dateOfBirth}
                      onChange={(e) => formik.setFieldValue('personalInfo.dateOfBirth', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.personalInfo?.dateOfBirth && formik.errors.personalInfo?.dateOfBirth
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.personalInfo?.dateOfBirth && formik.errors.personalInfo?.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.dateOfBirth)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="personalInfo.gender"
                      value={formik.values.personalInfo.gender}
                      onChange={(e) => {
                        formik.setFieldValue('personalInfo.gender', e.target.value);
                        formik.setFieldTouched('personalInfo.gender', true);
                      }}
                      onBlur={(e) => formik.handleBlur(e)}
                      className={`w-full px-3 py-2 border-2 border-gray-400 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formik.touched.personalInfo?.gender && formik.errors.personalInfo?.gender
                          ? 'border-red-500'
                          : ''
                      }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {formik.touched.personalInfo?.gender && formik.errors.personalInfo?.gender && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.gender)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="personalInfo.address.street"
                      placeholder="Enter street address"
                      value={formik.values.personalInfo.address.street}
                      onChange={(e) => formik.setFieldValue('personalInfo.address.street', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.personalInfo?.address?.street && formik.errors.personalInfo?.address?.street
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.personalInfo?.address?.street && formik.errors.personalInfo?.address?.street && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.address.street)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="personalInfo.address.city"
                      placeholder="Enter city"
                      value={formik.values.personalInfo.address.city}
                      onChange={(e) => formik.setFieldValue('personalInfo.address.city', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.personalInfo?.address?.city && formik.errors.personalInfo?.address?.city
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.personalInfo?.address?.city && formik.errors.personalInfo?.address?.city && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.address.city)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="personalInfo.address.state"
                      placeholder="Enter state"
                      value={formik.values.personalInfo.address.state}
                      onChange={(e) => formik.setFieldValue('personalInfo.address.state', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.personalInfo?.address?.state && formik.errors.personalInfo?.address?.state
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.personalInfo?.address?.state && formik.errors.personalInfo?.address?.state && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.address.state)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="personalInfo.address.zipCode"
                      placeholder="Enter ZIP code"
                      value={formik.values.personalInfo.address.zipCode}
                      onChange={(e) => formik.setFieldValue('personalInfo.address.zipCode', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.personalInfo?.address?.zipCode && formik.errors.personalInfo?.address?.zipCode
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.personalInfo?.address?.zipCode && formik.errors.personalInfo?.address?.zipCode && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.address.zipCode)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="personalInfo.address.country"
                      placeholder="Enter country"
                      value={formik.values.personalInfo.address.country}
                      onChange={(e) => {
                        formik.setFieldValue('personalInfo.address.country', e.target.value);
                        formik.setFieldTouched('personalInfo.address.country', true);
                      }}
                      onBlur={(e) => formik.handleBlur(e)}
                      className={formik.touched.personalInfo?.address?.country && formik.errors.personalInfo?.address?.country
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.personalInfo?.address?.country && formik.errors.personalInfo?.address?.country && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.address.country)}</p>
                    )}
                  </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="personalInfo.emergencyContact.name"
                      placeholder="Enter contact name"
                      value={formik.values.personalInfo.emergencyContact.name}
                      onChange={(e) => formik.setFieldValue('personalInfo.emergencyContact.name', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.personalInfo?.emergencyContact?.name && formik.errors.personalInfo?.emergencyContact?.name
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.personalInfo?.emergencyContact?.name && formik.errors.personalInfo?.emergencyContact?.name && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.emergencyContact.name)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="personalInfo.emergencyContact.relationship"
                      placeholder="e.g., Spouse, Parent, Sibling"
                      value={formik.values.personalInfo.emergencyContact.relationship}
                      onChange={(e) => formik.setFieldValue('personalInfo.emergencyContact.relationship', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.personalInfo?.emergencyContact?.relationship && formik.errors.personalInfo?.emergencyContact?.relationship
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.personalInfo?.emergencyContact?.relationship && formik.errors.personalInfo?.emergencyContact?.relationship && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.emergencyContact.relationship)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      name="personalInfo.emergencyContact.phone"
                      placeholder="Enter contact phone"
                      value={formik.values.personalInfo.emergencyContact.phone}
                      onChange={(e) => formik.setFieldValue('personalInfo.emergencyContact.phone', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.personalInfo?.emergencyContact?.phone && formik.errors.personalInfo?.emergencyContact?.phone
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.personalInfo?.emergencyContact?.phone && formik.errors.personalInfo?.emergencyContact?.phone && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.personalInfo.emergencyContact.phone)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Job Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="jobInfo.department"
                      value={formik.values.jobInfo.department}
                      onChange={(e) => {
                        formik.setFieldValue('jobInfo.department', e.target.value);
                        formik.setFieldTouched('jobInfo.department', true);
                      }}
                      onBlur={(e) => formik.handleBlur(e)}
                      className={`w-full px-3 py-2 border-2 border-gray-400 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formik.touched.jobInfo?.department && formik.errors.jobInfo?.department
                          ? 'border-red-500'
                          : ''
                      }`}
                    >
                      <option value="">Select Department</option>
                      <option value="hr">Human Resources</option>
                      <option value="it">Information Technology</option>
                      <option value="finance">Finance</option>
                      <option value="marketing">Marketing</option>
                      <option value="sales">Sales</option>
                      <option value="operations">Operations</option>
                    </select>
                    {formik.touched.jobInfo?.department && formik.errors.jobInfo?.department && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.jobInfo.department)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="jobInfo.designation"
                      placeholder="e.g., Software Engineer, Manager"
                      value={formik.values.jobInfo.designation}
                      onChange={(e) => formik.setFieldValue('jobInfo.designation', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.jobInfo?.designation && formik.errors.jobInfo?.designation
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.jobInfo?.designation && formik.errors.jobInfo?.designation && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.jobInfo.designation)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="jobInfo.employmentType"
                      value={formik.values.jobInfo.employmentType}
                      onChange={(e) => {
                        formik.setFieldValue('jobInfo.employmentType', e.target.value);
                        formik.setFieldTouched('jobInfo.employmentType', true);
                      }}
                      onBlur={(e) => formik.handleBlur(e)}
                      className={`w-full px-3 py-2 border-2 border-gray-400 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formik.touched.jobInfo?.employmentType && formik.errors.jobInfo?.employmentType
                          ? 'border-red-500'
                          : ''
                      }`}
                    >
                      <option value="">Select Employment Type</option>
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="intern">Intern</option>
                    </select>
                    {formik.touched.jobInfo?.employmentType && formik.errors.jobInfo?.employmentType && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.jobInfo.employmentType)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Joining Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      name="jobInfo.joiningDate"
                      value={formik.values.jobInfo.joiningDate}
                      onChange={(e) => formik.setFieldValue('jobInfo.joiningDate', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.jobInfo?.joiningDate && formik.errors.jobInfo?.joiningDate
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.jobInfo?.joiningDate && formik.errors.jobInfo?.joiningDate && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.jobInfo.joiningDate)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      name="jobInfo.salary"
                      placeholder="Enter salary amount"
                      value={formik.values.jobInfo.salary}
                      onChange={(e) => formik.setFieldValue('jobInfo.salary', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.jobInfo?.salary && formik.errors.jobInfo?.salary
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.jobInfo?.salary && formik.errors.jobInfo?.salary && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.jobInfo.salary)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Location <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="jobInfo.workLocation"
                      placeholder="Enter work location"
                      value={formik.values.jobInfo.workLocation}
                      onChange={(e) => formik.setFieldValue('jobInfo.workLocation', e.target.value)}
                      onBlur={formik.handleBlur}
                      className={formik.touched.jobInfo?.workLocation && formik.errors.jobInfo?.workLocation
                        ? 'border-red-500'
                        : ''}
                    />
                    {formik.touched.jobInfo?.workLocation && formik.errors.jobInfo?.workLocation && (
                      <p className="mt-1 text-sm text-red-600">{String(formik.errors.jobInfo.workLocation)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || fetching}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading 
                    ? (isEditMode ? 'Updating...' : 'Creating...') 
                    : (isEditMode ? 'Update Employee' : 'Create Employee')}
                </Button>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default function AddEmployeePage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    }>
      <AddEmployeePageContent />
    </Suspense>
  );
}

