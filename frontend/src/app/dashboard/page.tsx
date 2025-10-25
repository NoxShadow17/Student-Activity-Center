'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ActivityForm from '@/components/ActivityForm';
import ActivityList from '@/components/ActivityList';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import ProfileCard from '@/components/ProfileCard';
import ProfileCompletion from '@/components/ProfileCompletion';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('activities');
  const [loading, setLoading] = useState(true);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'student') {
      router.push('/login'); // Only students can access this dashboard
      return;
    }

    setUser(parsedUser);
    loadActivities();
    loadStudentProfile();
  }, [router]);

  const loadStudentProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      setStudentProfile(response.data);

      // Show profile completion modal if profile is incomplete or missing required fields
      if (!response.data || !isProfileComplete(response.data)) {
        setShowProfileCompletion(true);
      }
    } catch (error: any) {
      // Profile not found - expected for new students, show completion modal
      if (error.response?.status === 404) {
        setStudentProfile(null);
        setShowProfileCompletion(true);
      } else {
        // Only log actual errors, not expected 404s
        console.error('Unexpected error loading student profile:', error);
      }
    }
  };

  const isProfileComplete = (profile: any): boolean => {
    // Required fields for profile completion
    const requiredFields = [
      'primaryPhone',
      'emergencyContactName',
      'emergencyContactPhone'
    ];

    return profile.profileCompleted && requiredFields.every(field =>
      profile[field] && profile[field].trim() !== ''
    );
  };

  const handleProfileCompletion = async (completed: boolean) => {
    if (completed) {
      // Profile completed successfully, reload profile data
      setShowProfileCompletion(false);
      await loadStudentProfile();
    } else {
      // User chose to skip for later - still hide modal
      setShowProfileCompletion(false);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await api.get('/activities/student');
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Student Activity Portal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3">
            <ProfileCard user={user} activities={activities} studentProfile={studentProfile} />

            {/* Navigation Tabs */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <nav className="space-y-2">
                {[
                  { id: 'activities', label: 'Activities', icon: '📝' },
                  { id: 'add-activity', label: 'Add Activity', icon: '➕' },
                  { id: 'analytics', label: 'Analytics', icon: '📊' },
                  { id: 'portfolio', label: 'Portfolio', icon: '🎯' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-3 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-9">
            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  My Activities
                </h2>
                <ActivityList activities={activities} onRefresh={loadActivities} />
              </div>
            )}

            {/* Add Activity Tab */}
            {activeTab === 'add-activity' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Add New Activity
                </h2>
                <ActivityForm onSuccess={loadActivities} />
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Analytics Dashboard
                </h2>
                <AnalyticsCharts activities={activities} />
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Portfolio & Resume
                </h2>
                <PortfolioView activities={activities} user={user} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Completion Modal */}
      {showProfileCompletion && user?.id && (
        <ProfileCompletion
          profile={studentProfile || {
            userId: user.id,
            fullName: '',
            department: '',
            program: '',
            semester: undefined,
            section: '',
            studentId: '',
            enrollmentYear: undefined,
            expectedGraduationYear: undefined
          }}
          onComplete={handleProfileCompletion}
          onCancel={() => handleProfileCompletion(false)}
        />
      )}
    </div>
  );
}

// Portfolio View Component (placeholder)
function PortfolioView({ activities, user }: { activities: any[], user: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Portfolio Summary</h3>
        <p className="text-gray-600">
          Total Activities: {activities.length} |
          Verified: {activities.filter(a => a.status === 'verified').length} |
          Pending: {activities.filter(a => a.status === 'pending').length}
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Activities by Category</h3>
        {/* Category breakdown would go here */}
      </div>

      <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
        Export Portfolio (PDF/PDF)
      </button>
    </div>
  );
}
