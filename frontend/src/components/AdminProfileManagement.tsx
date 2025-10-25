'use client';

import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';

interface StudentProfile {
  id: number;
  userId: number;
  fullName: string;
  department: string;
  program?: string;
  semester?: number;
  section?: string;
  studentId: string;
  enrollmentYear?: number;
  expectedGraduationYear?: number;
  primaryPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  profileCompleted?: boolean;
  cgpa?: number;
  backlogsCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface ProfileStats {
  totalProfiles: number;
  completedProfiles: number;
  departmentStats: { department: string; count: number }[];
  semesterStats: { semester: number; count: number }[];
}

export default function AdminProfileManagement() {
  const [activeTab, setActiveTab] = useState<'overview' | 'list' | 'create' | 'excel-import'>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [profiles, setProfiles] = useState<{
    profiles: StudentProfile[];
    pagination: { page: number; limit: number; hasMore: boolean };
  }>({ profiles: [], pagination: { page: 1, limit: 20, hasMore: false } });
  const [filters, setFilters] = useState({
    department: '',
    semester: '',
    section: '',
    page: 1
  });

  // New profile creation
  const [newProfile, setNewProfile] = useState({
    userId: '',
    fullName: '',
    department: 'Computer Science',
    program: 'B.Tech CSE',
    semester: '1',
    section: 'A',
    studentId: '',
    enrollmentYear: new Date().getFullYear().toString(),
    expectedGraduationYear: (new Date().getFullYear() + 4).toString()
  });

  // Bulk import
  const [importData, setImportData] = useState('userId,fullName,department,program,semester,section,studentId,enrollmentYear,expectedGraduationYear\n');
  const [importResults, setImportResults] = useState<{
    successful: any[];
    failed: { userId?: number; error: string }[];
  } | null>(null);

  // Excel file import
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelImportResults, setExcelImportResults] = useState<{
    successful: any[];
    failed: { row?: number; email?: string; error: string }[];
    summary?: { totalProcessed: number; successful: number; failed: number };
  } | null>(null);

  // Edit profile
  const [editingProfile, setEditingProfile] = useState<StudentProfile | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    department: 'Computer Science',
    program: 'B.Tech CSE',
    semester: '1',
    section: 'A',
    studentId: '',
    enrollmentYear: new Date().getFullYear().toString(),
    expectedGraduationYear: (new Date().getFullYear() + 4).toString()
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/profile/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load profile stats:', error);
    }
  };

  const loadProfiles = async (newFilters = filters) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (newFilters.department) queryParams.append('department', newFilters.department);
      if (newFilters.semester) queryParams.append('semester', newFilters.semester);
      if (newFilters.section) queryParams.append('section', newFilters.section);
      queryParams.append('page', newFilters.page.toString());
      queryParams.append('limit', '20');

      const response = await api.get(`/profile?${queryParams.toString()}`);
      console.log('Loaded profiles:', response.data.profiles); // Debug log
      setProfiles(response.data);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfile.userId || !newProfile.fullName || !newProfile.studentId) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        ...newProfile,
        userId: parseInt(newProfile.userId),
        semester: parseInt(newProfile.semester),
        enrollmentYear: parseInt(newProfile.enrollmentYear),
        expectedGraduationYear: parseInt(newProfile.expectedGraduationYear)
      };

      await api.post('/profile', profileData);
      alert('Student profile created successfully!');
      setNewProfile({
        userId: '',
        fullName: '',
        department: 'Computer Science',
        program: 'B.Tech CSE',
        semester: '1',
        section: 'A',
        studentId: '',
        enrollmentYear: new Date().getFullYear().toString(),
        expectedGraduationYear: (new Date().getFullYear() + 4).toString()
      });
      loadStats();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    const lines = importData.trim().split('\n');
    if (lines.length < 2) {
      alert('Please include at least header row and one data row');
      return;
    }

    const headers = lines[0].split(',');
    const dataRows = lines.slice(1).filter(line => line.trim());

    const profiles = dataRows.map(line => {
      const values = line.split(',');
      const profile: any = {};
      headers.forEach((header, index) => {
        if (values[index]) {
          const value = values[index].trim();
          if (['userId', 'semester', 'enrollmentYear', 'expectedGraduationYear'].includes(header)) {
            profile[header] = parseInt(value);
          } else {
            profile[header] = value;
          }
        }
      });
      return profile;
    });

    setLoading(true);
    try {
      const response = await api.post('/profile/bulk-import', { profiles });
      setImportResults(response.data.results);
      loadStats();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelImport = async () => {
    if (!excelFile) {
      alert('Please select an Excel file to upload');
      return;
    }

    setLoading(true);
    setExcelImportResults(null);

    try {
      const formData = new FormData();
      formData.append('excelFile', excelFile);

      const response = await api.post('/auth/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setExcelImportResults(response.data.results);
      setExcelImportResults(prev => ({
        ...prev!,
        summary: response.data.summary
      }));

      // Reload stats to reflect new users/profiles
      loadStats();

      // Reset file input
      setExcelFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Excel import error:', error);
      alert(error.response?.data?.message || 'Excel import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.macroEnabled.12',
        'text/csv',
        'application/csv',
        'text/comma-separated-values'
      ];

      const isAllowedType = allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.csv');
      if (!isAllowedType) {
        alert('Please select a valid Excel file (.xlsx, .xls) or CSV file (.csv)');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert('File size must be less than 10MB');
        return;
      }

      setExcelFile(file);
    }
  };

  const downloadExcelTemplate = () => {
    // Create a sample data array
    const sampleData = [
      {
        email: 'student1@university.edu',
        password: 'password123',
        role: 'student',
        fullName: 'John Smith',
        department: 'Computer Science',
        program: 'B.Tech CSE',
        semester: '6',
        section: 'A',
        studentId: 'U2024001',
        enrollmentYear: '2024',
        expectedGraduationYear: '2028'
      },
      {
        email: 'educator1@university.edu',
        password: 'password123',
        role: 'educator',
        fullName: 'Dr. Jane Doe',
        department: 'Electronics and Communication',
        program: 'PhD',
        semester: '',
        section: '',
        studentId: '',
        enrollmentYear: '',
        expectedGraduationYear: ''
      },
      {
        email: 'admin2@university.edu',
        password: 'password123',
        role: 'admin',
        fullName: 'Bob Johnson',
        department: '',
        program: '',
        semester: '',
        section: '',
        studentId: '',
        enrollmentYear: '',
        expectedGraduationYear: ''
      }
    ];

    // Convert to worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');

    // Generate Excel file and download
    XLSX.writeFile(wb, 'user_import_template.xlsx');
  };

  const downloadCSVTemplate = () => {
    // Create CSV content
    const csvContent = `email,password,role,fullName,department,program,semester,section,studentId,enrollmentYear,expectedGraduationYear
student1@university.edu,password123,student,John Smith,Computer Science,B.Tech CSE,6,A,U2024001,2024,2028
educator1@university.edu,password123,educator,Dr. Jane Doe,Electronics and Communication,PhD,,,,
admin2@university.edu,password123,admin,Bob Johnson,,,,,,`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditProfile = (profile: StudentProfile) => {
    // Validate that profile has userId before allowing edit
    if (!profile.userId || profile.userId <= 0) {
      alert(`This profile (${profile.fullName}) has missing user information and cannot be edited. Please contact your system administrator.`);
      return;
    }

    setEditingProfile(profile);
    const currentYear = new Date().getFullYear();
    setEditFormData({
      fullName: profile.fullName,
      department: profile.department,
      program: profile.program || 'B.Tech CSE',
      semester: profile.semester?.toString() || '1',
      section: profile.section || 'A',
      studentId: profile.studentId,
      enrollmentYear: profile.enrollmentYear?.toString() || currentYear.toString(),
      expectedGraduationYear: profile.expectedGraduationYear?.toString() || (currentYear + 4).toString()
    });
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile) return;

    setLoading(true);
    try {
      const updateData = {
        fullName: editFormData.fullName,
        department: editFormData.department,
        program: editFormData.program,
        semester: parseInt(editFormData.semester),
        section: editFormData.section,
        studentId: editFormData.studentId,
        enrollmentYear: editFormData.enrollmentYear ? parseInt(editFormData.enrollmentYear) : undefined,
        expectedGraduationYear: editFormData.expectedGraduationYear ? parseInt(editFormData.expectedGraduationYear) : undefined
      };

      await api.put(`/profile/${editingProfile.userId}`, updateData);
      alert('Profile updated successfully!');
      setEditingProfile(null);
      loadProfiles(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profile: StudentProfile) => {
    if (!confirm(`Are you sure you want to delete the profile for ${profile.fullName}?`)) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/profile/${profile.userId}`);
      alert('Profile deleted successfully!');
      loadProfiles(); // Refresh the list
      loadStats(); // Update stats
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      alert(error.response?.data?.message || 'Failed to delete profile');
    } finally {
      setLoading(false);
    }
  };

  const copySampleData = () => {
    const sampleData = `userId,fullName,department,program,semester,section,studentId,enrollmentYear,expectedGraduationYear
1,John Smith,Computer Science,B.Tech CSE,6,A,U2024001,2024,2028
2,Jane Doe,Electronics and Communication,B.Tech ECE,5,B,U2024002,2024,2028
3,Bob Johnson,Mechanical Engineering,B.Tech ME,4,C,U2024003,2024,2028`;

    setImportData(sampleData);
  };

  const departments = [
    'Computer Science', 'Electronics and Communication', 'Mechanical Engineering',
    'Electrical Engineering', 'Civil Engineering', 'Information Technology',
    'Chemical Engineering', 'Biotechnology', 'Mathematics', 'Physics'
  ];

  const programs = [
    'B.Tech CSE', 'B.Tech ECE', 'B.Tech ME', 'B.Tech EE', 'B.Tech CE',
    'B.Tech IT', 'M.Tech', 'MBA', 'MCA', 'PhD'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">👨‍🎓 Student Profile Management</h2>
            <p className="text-gray-600 mt-1">Manage student academic and personal information</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            {[
              { key: 'overview', label: '📊 Overview', icon: '📊' },
              { key: 'list', label: '📋 All Profiles', icon: '📋' },
              { key: 'create', label: '➕ Create Profile', icon: '➕' },
              { key: 'excel-import', label: '📊 File Import', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === tab.key
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">📈 Profile Statistics</h3>

              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalProfiles}</div>
                    <div className="text-sm text-blue-800">Total Profiles</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.completedProfiles}</div>
                    <div className="text-sm text-green-800">Completed Profiles</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{stats.totalProfiles - stats.completedProfiles}</div>
                    <div className="text-sm text-yellow-800">Incomplete Profiles</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.totalProfiles > 0 ? Math.round((stats.completedProfiles / stats.totalProfiles) * 100) : 0}%
                    </div>
                    <div className="text-sm text-purple-800">Completion Rate</div>
                  </div>
                </div>
              )}

              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Department Distribution</h4>
                    <div className="space-y-2">
                      {stats.departmentStats.map((dept) => (
                        <div key={dept.department} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">{dept.department}</span>
                          <span className="font-medium">{dept.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Semester Distribution</h4>
                    <div className="space-y-2">
                      {stats.semesterStats
                        .sort((a, b) => a.semester - b.semester)
                        .map((sem) => (
                        <div key={sem.semester} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Semester {sem.semester}</span>
                          <span className="font-medium">{sem.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* All Profiles Tab */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value, page: 1 })}
                  className="border rounded px-3 py-2 text-gray-900"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <select
                  value={filters.semester}
                  onChange={(e) => setFilters({ ...filters, semester: e.target.value, page: 1 })}
                  className="border rounded px-3 py-2 text-gray-900"
                >
                  <option value="">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>

                <select
                  value={filters.section}
                  onChange={(e) => setFilters({ ...filters, section: e.target.value, page: 1 })}
                  className="border rounded px-3 py-2 text-gray-900"
                >
                  <option value="">All Sections</option>
                  {['A', 'B', 'C', 'D'].map((sec) => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>

                <button
                  onClick={() => loadProfiles()}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Apply Filters'}
                </button>
              </div>

              {/* Profiles Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Info</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profiles.profiles.map((profile) => (
                      <tr key={profile.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{profile.fullName}</div>
                          <div className="text-sm text-gray-500">{profile.studentId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{profile.department}</div>
                          <div className="text-sm text-gray-500">
                            Sem {profile.semester} • Sec {profile.section}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{profile.primaryPhone || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{profile.primaryPhone && 'Phone' || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            profile.profileCompleted
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {profile.profileCompleted ? 'Complete' : 'Incomplete'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleEditProfile(profile)}
                            className="mr-2 text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            disabled={loading}
                            title="Edit profile"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProfile(profile)}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            disabled={loading}
                            title="Delete profile"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {profiles.pagination.hasMore && (
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      const newPage = filters.page + 1;
                      setFilters({ ...filters, page: newPage });
                      loadProfiles({ ...filters, page: newPage });
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Create Profile Tab */}
          {activeTab === 'create' && (
            <div className="max-w-2xl space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">➕ Create New Student Profile</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-1">User ID *</label>
                  <input
                    type="number"
                    value={newProfile.userId}
                    onChange={(e) => setNewProfile({ ...newProfile, userId: e.target.value })}
                    placeholder="User ID from authentication system"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newProfile.fullName}
                    onChange={(e) => setNewProfile({ ...newProfile, fullName: e.target.value })}
                    placeholder="Student's full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Student ID *</label>
                  <input
                    type="text"
                    value={newProfile.studentId}
                    onChange={(e) => setNewProfile({ ...newProfile, studentId: e.target.value })}
                    placeholder="U2024001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Department *</label>
                  <select
                    value={newProfile.department}
                    onChange={(e) => setNewProfile({ ...newProfile, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Program</label>
                  <select
                    value={newProfile.program}
                    onChange={(e) => setNewProfile({ ...newProfile, program: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    {programs.map((prog) => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Semester</label>
                  <select
                    value={newProfile.semester}
                    onChange={(e) => setNewProfile({ ...newProfile, semester: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    {[1,2,3,4,5,6,7,8].map((sem) => (
                      <option key={sem} value={sem.toString()}>{sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Section</label>
                  <select
                    value={newProfile.section}
                    onChange={(e) => setNewProfile({ ...newProfile, section: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    {['A', 'B', 'C', 'D'].map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Enrollment Year</label>
                  <input
                    type="number"
                    value={newProfile.enrollmentYear}
                    onChange={(e) => setNewProfile({ ...newProfile, enrollmentYear: e.target.value })}
                    placeholder="2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Expected Graduation Year</label>
                  <input
                    type="number"
                    value={newProfile.expectedGraduationYear}
                    onChange={(e) => setNewProfile({ ...newProfile, expectedGraduationYear: e.target.value })}
                    placeholder="2028"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCreateProfile}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </div>
          )}



          {/* Excel Import Tab */}
          {activeTab === 'excel-import' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">📊 File Bulk User Import</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload Excel or CSV files to create user accounts and profiles in bulk
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadExcelTemplate}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    📊 Download Excel Template
                  </button>
                  <button
                    onClick={downloadCSVTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    📄 Download CSV Template
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">📋 Excel Format Requirements</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li><strong>Required Columns:</strong> email, password, role</li>
                  <li><strong>Optional Columns:</strong> fullName, department, program, semester, section, studentId, enrollmentYear, expectedGraduationYear</li>
                  <li><strong>Valid Roles:</strong> admin, educator, student</li>
                  <li><strong>Format:</strong> .xlsx or .xls files only</li>
                  <li><strong>Limit:</strong> 10MB max, 1000 rows per file</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">📤 Upload Excel File</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Select File (.xlsx, .xls, or .csv)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/csv"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {excelFile && (
                      <p className="mt-2 text-sm text-green-600">
                        ✓ Selected: {excelFile.name} ({Math.round(excelFile.size / 1024)} KB)
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleExcelImport}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      disabled={loading || !excelFile}
                    >
                      {loading ? 'Importing Users...' : 'Start Excel Import'}
                    </button>
                  </div>
                </div>
              </div>

              {excelImportResults && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">📊 Import Results Summary</h4>

                  {/* Summary Stats */}
                  {excelImportResults.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-gray-900">{excelImportResults.summary.totalProcessed}</div>
                        <div className="text-sm text-gray-600">Total Processed</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{excelImportResults.summary.successful}</div>
                        <div className="text-sm text-green-800">Successful</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">{excelImportResults.summary.failed}</div>
                        <div className="text-sm text-red-800">Failed</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {excelImportResults.summary.totalProcessed > 0
                            ? Math.round((excelImportResults.summary.successful / excelImportResults.summary.totalProcessed) * 100)
                            : 0}%
                        </div>
                        <div className="text-sm text-blue-800">Success Rate</div>
                      </div>
                    </div>
                  )}

                  {/* Successful Imports */}
                  {excelImportResults.successful.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                      <h5 className="font-semibold text-green-900 mb-2">
                        ✅ Successful Imports ({excelImportResults.successful.length})
                      </h5>
                      <div className="max-h-40 overflow-y-auto">
                        {excelImportResults.successful.slice(0, 10).map((user, index) => (
                          <div key={index} className="text-sm text-green-800">
                            Row {user.row}: {user.email} ({user.role})
                          </div>
                        ))}
                        {excelImportResults.successful.length > 10 && (
                          <div className="text-sm text-green-700 italic">
                            ... and {excelImportResults.successful.length - 10} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Failed Imports */}
                  {excelImportResults.failed.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-red-900 mb-2">
                        ❌ Failed Imports ({excelImportResults.failed.length})
                      </h5>
                      <div className="max-h-40 overflow-y-auto">
                        {excelImportResults.failed.slice(0, 10).map((fail, index) => (
                          <div key={index} className="text-sm text-red-800">
                            {fail.row ? `Row ${fail.row}:` : ''} {fail.email ? `${fail.email} - ` : ''}{fail.error}
                          </div>
                        ))}
                        {excelImportResults.failed.length > 10 && (
                          <div className="text-sm text-red-700 italic">
                            ... and {excelImportResults.failed.length - 10} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Edit Profile Modal */}
          {editingProfile && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 text-white px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">✏️ Edit Student Profile</h2>
                      <p className="text-blue-100 mt-1">Update profile information for {editingProfile.fullName}</p>
                    </div>
                    <button
                      onClick={() => setEditingProfile(null)}
                      className="text-white hover:text-blue-200 text-xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Edit Form */}
                <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="px-6 py-6 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-6">
                    {/* Academic Info Summary */}
                    <div className="bg-green-50 border-b px-4 py-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-green-800 mb-2">Current Academic Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                        <div><strong>Student ID:</strong> {editFormData.studentId}</div>
                        <div><strong>Department:</strong> {editFormData.department}</div>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-900 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={editFormData.fullName}
                          onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Department *</label>
                        <select
                          value={editFormData.department}
                          onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                          required
                        >
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Program</label>
                        <select
                          value={editFormData.program}
                          onChange={(e) => setEditFormData({ ...editFormData, program: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                          {programs.map((prog) => (
                            <option key={prog} value={prog}>{prog}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Semester</label>
                        <select
                          value={editFormData.semester}
                          onChange={(e) => setEditFormData({ ...editFormData, semester: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                          {[1,2,3,4,5,6,7,8].map((sem) => (
                            <option key={sem} value={sem.toString()}>{sem}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Section</label>
                        <select
                          value={editFormData.section}
                          onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                          {['A', 'B', 'C', 'D'].map((sec) => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Enrollment Year</label>
                        <input
                          type="number"
                          value={editFormData.enrollmentYear}
                          onChange={(e) => setEditFormData({ ...editFormData, enrollmentYear: e.target.value })}
                          placeholder="2024"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Expected Graduation Year</label>
                        <input
                          type="number"
                          value={editFormData.expectedGraduationYear}
                          onChange={(e) => setEditFormData({ ...editFormData, expectedGraduationYear: e.target.value })}
                          placeholder="2028"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>⚠️ Note:</strong> Changing academic information may affect reporting and analytics.
                        Personal information (phone, emergency contacts) can be updated by the student themselves.
                      </p>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingProfile(null)}
                      className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
