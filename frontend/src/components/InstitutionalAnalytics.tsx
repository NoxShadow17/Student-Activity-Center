'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Register additional Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
  Filler
);

interface InstitutionalAnalyticsProps {
  analytics: {
    totalActivities: number;
    verifiedActivities: number;
    pendingActivities: number;
    rejectedActivities: number;
    totalStudents: number;
    categories: { [key: string]: number };
    monthlyGrowth: { month: string; activities: number }[];
    engagementScore: number;
    topStudents: { name: string; activities: number }[];
  } | null;
}

export default function InstitutionalAnalytics({ analytics }: InstitutionalAnalyticsProps) {
  // Show loading state if analytics is null
  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900">Loading Analytics...</h3>
          <p className="text-gray-600 mt-2">Fetching institutional data</p>
        </div>
      </div>
    );
  }
  // Participation Trends (Line Chart)
  const trendData = {
    labels: analytics.monthlyGrowth.map(item => item.month),
    datasets: [{
      label: 'Monthly Activities',
      data: analytics.monthlyGrowth.map(item => item.activities),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true,
    }],
  };

  // Category Distribution (Bar Chart)
  const categoryData = {
    labels: Object.keys(analytics.categories),
    datasets: [{
      label: 'Activities by Category',
      data: Object.values(analytics.categories),
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#F97316', '#06B6D4', '#EC4899', '#84CC16', '#6366F1'
      ],
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  // Engagement heatmap by category and monthly growth
  const categoriesList = Object.keys(analytics.categories);
  const months = analytics.monthlyGrowth.map(item => item.month.substring(0, 3)); // ['Jan', 'Feb', etc.]

  // Create heatmap data: for each category, assign engagement based on count and growth
  const engagementData = categoriesList.map((category, categoryIndex) => {
    const categoryCount = analytics.categories[category];
    const totalActivities = analytics.totalActivities;
    const categoryPercentage = totalActivities > 0 ? (categoryCount / totalActivities) * 100 : 0;

    // Calculate engagement for each month (mock based on actual data patterns)
    return months.map((month, monthIndex) => {
      const monthlyActivity = analytics.monthlyGrowth[monthIndex]?.activities || 0;
      // Combine category prominence with monthly growth to create realistic engagement scores
      return Math.max(10, Math.min(95, Math.round(categoryPercentage + (monthlyActivity * 5))));
    });
  });

  return (
    <div className="space-y-8">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-blue-600">{analytics.totalActivities}</p>
            </div>
            <div className="text-blue-600 text-2xl">📊</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verification Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.round((analytics.verifiedActivities / analytics.totalActivities) * 100)}%
              </p>
            </div>
            <div className="text-green-600 text-2xl">✅</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Engagement Score</p>
              <p className="text-2xl font-bold text-purple-600">{analytics.engagementScore}%</p>
            </div>
            <div className="text-purple-600 text-2xl">📈</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg per Student</p>
              <p className="text-2xl font-bold text-orange-600">
                {analytics.totalStudents > 0 ? Math.round(analytics.totalActivities / analytics.totalStudents) : 0}
              </p> {/* Calculates: Total Activities ÷ Total Students */}
            </div>
            <div className="text-orange-600 text-2xl">🎯</div>
          </div>
        </div>
      </div>

      {/* Participation Trends */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Participation Trends (Monthly Growth)
        </h3>
        <div className="h-80">
          <Line
            data={trendData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    display: true,
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Activity Categories Distribution */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Activity Distribution by Category
        </h3>
        <div className="h-80">
          <Bar
            data={categoryData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    display: true,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Engagement Heatmap */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔥 Department Engagement Heatmap
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className={`grid gap-1 text-sm`} style={{ gridTemplateColumns: `200px repeat(${months.length}, 1fr)` }}>
              <div className="font-medium text-gray-700 p-2">Category</div>
              {months.map(month => (
                <div key={month} className="font-medium text-gray-700 p-2 text-center">
                  {month}
                </div>
              ))}

              {categoriesList.map((category, categoryIndex) => (
                <React.Fragment key={category}>
                  <div className="font-medium text-gray-700 p-2 flex items-center">
                    {category}
                  </div>
                  {engagementData[categoryIndex].map((value, monthIndex) => (
                    <div
                      key={`${category}-${monthIndex}`}
                      className={`p-2 text-center text-sm font-medium rounded ${
                        value >= 80 ? 'bg-green-500 text-white' :
                        value >= 60 ? 'bg-green-400 text-white' :
                        value >= 40 ? 'bg-green-300 text-white' :
                        value >= 20 ? 'bg-yellow-400 text-black' :
                        'bg-red-400 text-white'
                      }`}
                      title={`${category} - ${months[monthIndex]}: ${value}% engagement`}
                    >
                      {value}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-400 rounded mr-2"></div>
            Low (0-20%)
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
            Medium (20-40%)
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-300 rounded mr-2"></div>
            High (40-60%)
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-400 rounded mr-2"></div>
            Very High (60-80%)
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            Excellent (80-100%)
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏆 Top Performing Students
        </h3>
        <div className="space-y-3">
          {analytics.topStudents.map((student, index) => (
            <div key={student.name} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-blue-500 text-white'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-600">Top Contributor</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">{student.activities}</p>
                <p className="text-sm text-gray-600">Activities</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
