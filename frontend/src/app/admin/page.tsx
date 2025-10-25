'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import InstitutionalAnalytics from '@/components/InstitutionalAnalytics';
import AdminProfileManagement from '@/components/AdminProfileManagement';

interface User {
  id: number;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [profilesData, setProfilesData] = useState<any>(null);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'student'
  });
  const router = useRouter();

  const deleteUser = async (userId: number, userEmail: string, userRole: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail} (${userRole})? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/auth/users/${userId}`);
      await loadUsers(); // Refresh the user list
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

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
    if (parsedUser.role !== 'admin') {
      router.push('/login'); // Not admin, redirect
      return;
    }

    setUser(parsedUser);
    await loadUsers();
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalytics(null); // Reset analytics data
      const response = await api.get('/analytics/institution');
      setAnalytics(response.data);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      setAnalytics(null);
      alert(error.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newUser);
      setNewUser({ email: '', password: '', role: 'student' });
      setIsCreatingUser(false);
      await loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  if (!user) {
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
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Admin: {user?.email}
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
              <h3 className="font-medium text-gray-900 mb-2">System Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 font-medium">Total Users</span>
                  <span className="font-bold text-gray-900">{users.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 font-medium">Students</span>
                  <span className="font-bold text-gray-900">{users.filter(u => u.role === 'student').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 font-medium">Educators</span>
                  <span className="font-bold text-gray-900">{users.filter(u => u.role === 'educator').length}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <nav className="space-y-2">
                {[
                  { id: 'users', label: 'User Management', icon: '👥' },
                  { id: 'profiles', label: 'Profile Management', icon: '👨‍🎓' },
                  { id: 'analytics', label: 'Analytics', icon: '📊' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'analytics' && !analytics) {
                        loadAnalytics();
                      }
                    }}
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
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Create User Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
                    <button
                      onClick={() => setIsCreatingUser(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Add New User
                    </button>
                  </div>

                  {isCreatingUser && (
                    <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium mb-4 text-gray-900">Create User</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="email"
                          placeholder="Email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          required
                        />
                        <input
                          type="password"
                          placeholder="Password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          required
                        />
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                          <option value="admin">Admin</option>
                          <option value="educator">Educator</option>
                          <option value="student">Student</option>
                        </select>
                      </div>
                      <div className="flex space-x-3 mt-4">
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          Create User
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCreatingUser(false)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Users List */}
                  <div className="mt-6">
                    <h3 className="font-medium mb-4 text-gray-900">All Users</h3>
                    <div className="space-y-2">
                      {users.map(user => (
                        <div key={user.id} className="flex items-center justify-between py-2 px-4 border border-gray-200 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">{user.email}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'educator' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-sm text-gray-700 font-medium">
                              ID: {user.id}
                            </div>
                            <button
                              onClick={() => deleteUser(user.id, user.email, user.role)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium"
                              title="Delete User"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Management Tab */}
            {activeTab === 'profiles' && (
              <AdminProfileManagement />
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Institutional Analytics Dashboard
                </h2>
                <InstitutionalAnalytics analytics={analytics} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
