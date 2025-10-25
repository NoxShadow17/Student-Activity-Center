'use client';

interface ProfileCardProps {
  user: any;
  activities: any[];
  studentProfile?: any;
}

export default function ProfileCard({ user, activities, studentProfile }: ProfileCardProps) {
  const totalActivities = activities.length;
  const verifiedActivities = activities.filter(a => a.status === 'verified').length;
  const engagementScore = totalActivities > 0 ? Math.round((verifiedActivities / totalActivities) * 100) : 0;

  // Display name logic: Use profile name if available, otherwise fallback to email
  const displayName = studentProfile?.fullName || user?.email;
  const displayInitial = studentProfile?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase();

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center space-x-3 mb-4">
        <div className={`text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-semibold ${
          studentProfile?.profileCompleted
            ? 'bg-green-500' // Profile completed
            : 'bg-yellow-500' // Profile incomplete
        }`}>
          {displayInitial}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 truncate" title={displayName}>{displayName}</h3>
          <p className="text-sm text-gray-500 capitalize flex items-center">
            {user?.role}
            {studentProfile && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                studentProfile.profileCompleted
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {studentProfile.profileCompleted ? 'Profile Complete' : 'Profile Incomplete'}
              </span>
            )}
          </p>
          {studentProfile && (
            <p className="text-xs text-gray-500 mt-1">
              {studentProfile.department} • Sem {studentProfile.semester} • Sec {studentProfile.section}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 font-medium">Total Activities</span>
          <span className="font-bold text-gray-900">{totalActivities}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 font-medium">Verified</span>
          <span className="font-bold text-green-600">{verifiedActivities}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 font-medium">Engagement Score</span>
          <div className="flex items-center space-x-1">
            <div className="w-16 h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-500 rounded-full"
                style={{ width: `${engagementScore}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-gray-900">{engagementScore}%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">Achievements</h4>
        <div className="space-y-1">
          {verifiedActivities >= 1 && (
            <div className="flex items-center space-x-2 text-sm text-gray-800">
              <span className="text-yellow-500">🏆</span>
              <span className="font-medium">First Activity Verified</span>
            </div>
          )}
          {verifiedActivities >= 3 && (
            <div className="flex items-center space-x-2 text-sm text-gray-800">
              <span className="text-purple-500">⭐</span>
              <span className="font-medium">Activity Champion</span>
            </div>
          )}
          {engagementScore >= 80 && (
            <div className="flex items-center space-x-2 text-sm text-gray-800">
              <span className="text-green-500">🌟</span>
              <span className="font-medium">Engagement Master</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
