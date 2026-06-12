'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setError('');
      setLoading(true);

      try {
        await login(values.email, values.password);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile welcome strip */}
      <div className="lg:hidden bg-blue-600 px-6 py-8 text-center text-white">
        <p className="text-sm text-blue-200 mb-1">HRMS</p>
        <h2 className="text-xl font-bold">Welcome to HRMS</h2>
        <p className="text-blue-100 text-sm mt-2">
          Sign in to manage your human resources workspace.
        </p>
      </div>

      {/* Left — Sign in form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <p className="text-2xl font-bold text-blue-600 tracking-tight">HRMS</p>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Sign in</h1>

          <form onSubmit={formik.handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Johndoe@gmail.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full h-12 rounded-xl border bg-white pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    formik.touched.email && formik.errors.email
                      ? 'border-red-500'
                      : 'border-gray-200'
                  }`}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-xs text-red-600">{formik.errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full h-12 rounded-xl border bg-white pl-11 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    formik.touched.password && formik.errors.password
                      ? 'border-red-500'
                      : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-xs text-red-600">{formik.errors.password}</p>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Forgot Password
            </button>
          </div>
        </div>
      </div>

      {/* Right — Welcome panel */}
      <div className="hidden lg:flex flex-1 relative bg-blue-600 overflow-hidden items-center justify-center p-12">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(255,255,255,0.08) 40px, rgba(255,255,255,0.08) 41px)',
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] font-bold text-white/10 select-none pointer-events-none">
          H
        </div>

        <div className="relative z-10 max-w-lg text-center text-white">
          <p className="text-sm font-medium text-blue-200 mb-2">HRMS</p>
          <h2 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
            Welcome to HRMS
          </h2>
          <p className="text-blue-100 text-base leading-relaxed mb-6">
            Manage employees, attendance, payroll, and more — all in one place.
            Sign in to access your workspace.
          </p>
          <p className="text-sm text-blue-200">
            Trusted by teams to streamline human resource operations.
          </p>
        </div>

        <div className="absolute bottom-10 left-10 right-10 z-10">
          <div className="bg-blue-700/80 backdrop-blur-sm border border-blue-500/30 rounded-2xl px-6 py-5 flex items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-white font-semibold text-sm sm:text-base">
                Get started with your HR dashboard
              </p>
              <p className="text-blue-200 text-xs sm:text-sm mt-1">
                Track attendance, timesheets, and employee records effortlessly.
              </p>
            </div>
            <div className="flex -space-x-2 flex-shrink-0">
              {['A', 'B', 'C', 'D'].map((letter, i) => (
                <div
                  key={letter}
                  className="w-9 h-9 rounded-full bg-blue-500 border-2 border-blue-700 flex items-center justify-center text-xs font-semibold text-white"
                  style={{ zIndex: 4 - i }}
                >
                  {letter}
                </div>
              ))}
              <div className="w-9 h-9 rounded-full bg-blue-800 border-2 border-blue-700 flex items-center justify-center text-xs font-semibold text-blue-200">
                +2
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
