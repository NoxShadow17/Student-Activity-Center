'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface ProfileData {
  userId: number;
  fullName: string;
  department: string;
  program?: string;
  semester?: number;
  section?: string;
  studentId: string;
  enrollmentYear?: number;
  expectedGraduationYear?: number;
  dateOfBirth?: string;
  gender?: string;
  primaryPhone?: string;
  alternatePhone?: string;
  personalEmail?: string;
  permanentAddress?: string;
  currentAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  profilePhotoUrl?: string;
}

interface ProfileCompletionProps {
  profile: ProfileData;
  onComplete: (completed: boolean) => void;
  onCancel: () => void;
}

export default function ProfileCompletion({ profile, onComplete, onCancel }: ProfileCompletionProps) {
  const [formData, setFormData] = useState({
    primaryPhone: profile.primaryPhone || '',
    alternatePhone: profile.alternatePhone || '',
    personalEmail: profile.personalEmail || '',
    dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
    gender: profile.gender || '',
    permanentAddress: profile.permanentAddress || '',
    currentAddress: profile.currentAddress || '',
    emergencyContactName: profile.emergencyContactName || '',
    emergencyContactPhone: profile.emergencyContactPhone || ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields for profile completion
    if (!formData.primaryPhone.trim()) {
      newErrors.primaryPhone = 'Primary phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.primaryPhone.replace(/\s+/g, ''))) {
      newErrors.primaryPhone = 'Enter a valid 10-digit phone number';
    }

    if (!formData.emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'Emergency contact name is required';
    }

    if (!formData.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Emergency contact phone is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.emergencyContactPhone.replace(/\s+/g, ''))) {
      newErrors.emergencyContactPhone = 'Enter a valid 10-digit phone number';
    }

    if (formData.personalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalEmail)) {
      newErrors.personalEmail = 'Enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Make sure profile.userId is valid
    if (!profile.userId) {
      alert('Profile information is incomplete. Please contact your administrator.');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/profile/${profile.userId}`, {
        primaryPhone: formData.primaryPhone.trim(),
        alternatePhone: formData.alternatePhone.trim(),
        personalEmail: formData.personalEmail.trim(),
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        permanentAddress: formData.permanentAddress.trim() || undefined,
        currentAddress: formData.currentAddress.trim() || undefined,
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactPhone: formData.emergencyContactPhone.trim()
      });

      onComplete(true);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = 1;
  const totalSteps = 1;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Complete Your Profile</h2>
              <p className="text-blue-100 mt-1">
                Step {currentStep} of {totalSteps} - Add Personal Information
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:text-blue-200 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Academic Info Summary */}
        <div className="bg-green-50 border-b px-6 py-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Academic Information (Pre-filled by Admin)</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
            <div><strong>Full Name:</strong> {profile.fullName}</div>
            <div><strong>Student ID:</strong> {profile.studentId}</div>
            <div><strong>Department:</strong> {profile.department}</div>
            <div><strong>Semester:</strong> {profile.semester}</div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">📞 Contact Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Primary Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.primaryPhone}
                    onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                    placeholder="9876543210"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                      errors.primaryPhone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    maxLength={10}
                  />
                  {errors.primaryPhone && (
                    <p className="text-red-600 text-sm mt-1">{errors.primaryPhone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Alternate Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    placeholder="Optional alternate number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Personal Email
                  </label>
                  <input
                    type="email"
                    value={formData.personalEmail}
                    onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                    placeholder="your.email@example.com"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                      errors.personalEmail ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.personalEmail && (
                    <p className="text-red-600 text-sm mt-1">{errors.personalEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">🏠 Address Information (Optional)</h3>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Permanent Address
                </label>
                <textarea
                  value={formData.permanentAddress}
                  onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                  placeholder="Your permanent address"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Current Address (If different)
                </label>
                <textarea
                  value={formData.currentAddress}
                  onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                  placeholder="Your current address if different from permanent"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">🚨 Emergency Contact *</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Emergency Contact Name *
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="Name of your emergency contact"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                      errors.emergencyContactName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    maxLength={100}
                  />
                  {errors.emergencyContactName && (
                    <p className="text-red-600 text-sm mt-1">{errors.emergencyContactName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Emergency Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="Emergency contact phone number"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                      errors.emergencyContactPhone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    maxLength={10}
                  />
                  {errors.emergencyContactPhone && (
                    <p className="text-red-600 text-sm mt-1">{errors.emergencyContactPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Fields marked with * are required to complete your profile.
                You can update other information later through your profile settings.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Skip for Later
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
