'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Activity {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  status: 'pending' | 'verified' | 'rejected';
  studentId: number;
  proof?: string;
}

export default function EducatorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'educator') {
      router.push('/login'); // Not educator, redirect
      return;
    }

    setUser(parsedUser);
    await loadActivities();
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/activities');
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateActivityStatus = async (activityId: number, status: 'verified' | 'rejected', comments?: string) => {
    try {
      await api.patch(`/activities/${activityId}/status`, { status, comments });
      await loadActivities(); // Reload activities
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update activity');
    }
  };

  const getPendingActivities = () => activities.filter(a => a.status === 'pending');
  const getVerifiedActivities = () => activities.filter(a => a.status === 'verified');
  const getRejectedActivities = () => activities.filter(a => a.status === 'rejected');

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
                Educator Dashboard - Activity Verification
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Educator: {user?.email}
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
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
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-gray-900 mb-2">Activity Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 font-medium">Total Activities</span>
                  <span className="font-bold text-gray-900">{activities.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 font-medium">Pending Review</span>
                  <span className="font-bold text-yellow-600">{getPendingActivities().length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 font-medium">Verified</span>
                  <span className="font-bold text-green-600">{getVerifiedActivities().length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 font-medium">Rejected</span>
                  <span className="font-bold text-red-600">{getRejectedActivities().length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-9 space-y-6">
            {/* Pending Activities */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Activities Pending Review ({getPendingActivities().length})
              </h2>

              {getPendingActivities().length === 0 ? (
                <p className="text-gray-500">No activities pending review.</p>
              ) : (
                <div className="space-y-4">
                  {getPendingActivities().map(activity => (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{activity.title}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-700 font-medium">{activity.category}</span>
                            <span className="text-sm text-gray-700 font-medium">Student ID: {activity.studentId}</span>
                            <span className="text-sm text-gray-700 font-medium">Date: {new Date(activity.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                          PENDING
                        </span>
                      </div>

                      <p className="text-gray-700 mb-3">{activity.description}</p>

                      {activity.proof && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-md">
                          <span className="text-sm font-medium text-gray-700">Proof:</span>
                          <a
                            href={activity.proof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 ml-2 text-sm underline"
                          >
                            View Supporting Document
                          </a>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <button
                          onClick={() => updateActivityStatus(activity.id, 'verified')}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => updateActivityStatus(activity.id, 'rejected')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activities */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Recent Verified Activities
              </h2>

              {getVerifiedActivities().slice(0, 10).length === 0 ? (
                <p className="text-gray-500">No verified activities yet.</p>
              ) : (
                <div className="space-y-3">
                  {getVerifiedActivities().slice(0, 10).map(activity => (
                    <div key={activity.id} className="flex items-center justify-between py-2 px-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{activity.title}</div>
                        <div className="text-sm text-gray-700 font-medium">
                          {activity.category} • Student {activity.studentId} • {new Date(activity.date).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        VERIFIED
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
