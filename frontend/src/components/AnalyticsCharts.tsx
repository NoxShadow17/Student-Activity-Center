'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement
);

interface AnalyticsChartsProps {
  activities: any[];
}

export default function AnalyticsCharts({ activities }: AnalyticsChartsProps) {
  // Calculate category distribution
  const categoryCounts = activities.reduce((acc, activity) => {
    acc[activity.category] = (acc[activity.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = {
    labels: Object.keys(categoryCounts),
    datasets: [{
      data: Object.values(categoryCounts),
      backgroundColor: [
        '#3B82F6', // blue
        '#10B981', // green
        '#F59E0B', // yellow
        '#EF4444', // red
        '#8B5CF6', // purple
        '#F97316'  // orange
      ],
      borderWidth: 1,
    }],
  };

  // Calculate status distribution
  const statusCounts = activities.reduce((acc, activity) => {
    acc[activity.status] = (acc[activity.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = {
    labels: ['Pending', 'Verified', 'Rejected'],
    datasets: [{
      data: [statusCounts.pending || 0, statusCounts.verified || 0, statusCounts.rejected || 0],
      backgroundColor: ['#F59E0B', '#10B981', '#EF4444'],
      borderWidth: 1,
    }],
  };

  return (
    <div className="space-y-8">
      {/* Activity Category Distribution */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Activity Distribution by Category
        </h3>
        {Object.keys(categoryCounts).length > 0 ? (
          <div className="h-64">
            <Doughnut
              data={categoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }}
            />
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No activities to display
          </p>
        )}
      </div>

      {/* Verification Status */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Verification Status
        </h3>
        <div className="h-64">
          <Bar
            data={statusData}
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
                  ticks: {
                    precision: 0,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Activity Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-blue-600">{activities.length}</p>
            </div>
            <div className="text-blue-600 text-2xl">📊</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-green-600">
                {activities.filter(a => a.status === 'verified').length}
              </p>
            </div>
            <div className="text-green-600 text-2xl">✅</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">
                {activities.filter(a => a.status === 'pending').length}
              </p>
            </div>
            <div className="text-yellow-600 text-2xl">⏳</div>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity Summary
        </h3>
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity, index) => (
            <div key={activity.id} className="flex items-center justify-between py-2">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-500">
                  {activity.category} • {new Date(activity.date).toLocaleDateString()}
                </p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                activity.status === 'verified' ? 'bg-green-100 text-green-800' :
                activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {activity.status}
              </span>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No activities yet. Start by adding your first activity!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
