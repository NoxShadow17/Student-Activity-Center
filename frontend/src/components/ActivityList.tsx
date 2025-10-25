'use client';

import { useState } from 'react';
import QRCodeCanvas from 'react-qr-code';

interface Activity {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  status: 'pending' | 'verified' | 'rejected';
  proof?: string;
  verifiedBy?: number;
  verifiedAt?: string;
  qr_code_url?: string;
  qr_generated_at?: string;
}

interface ActivityListProps {
  activities: Activity[];
  onRefresh: () => void;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const statusIcons = {
  pending: '⏳',
  verified: '✅',
  rejected: '❌'
};

export default function ActivityList({ activities, onRefresh }: ActivityListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  // Certificate download function
  const downloadCertificate = async (activity: Activity) => {
    // For now, we'll implement a basic certificate download
    // In a full implementation, this would generate a PDF with institution branding
    alert(`Certificate download for "${activity.title}" will be implemented soon!\n\nCertificate ID: #${activity.id}\nVerification URL: http://localhost:3000/verify/activity/${activity.id}`);

    // You can add HTML5 Canvas or jsPDF implementation here
    // const canvas = await html2canvas(document.querySelector('.certificate-section'));
    // const imgData = canvas.toDataURL('image/png');
    // ... PDF generation
  };

  // Certificate sharing function
  const shareCertificate = (activity: Activity) => {
    const verificationUrl = `http://localhost:3000/verify/activity/${activity.id}`;

    if (navigator.share) {
      // Use Web Share API if available
      navigator.share({
        title: `Certificate: ${activity.title}`,
        text: `Check out this verified achievement: ${activity.title} in ${activity.category}`,
        url: verificationUrl
      }).catch(console.error);
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(
        `🎓 Certificate of Achievement\n\nTitle: ${activity.title}\nCategory: ${activity.category}\nDate: ${activity.date}\nVerification URL: ${verificationUrl}\n\nVerified by Student Activity Portal`
      ).then(() => {
        alert('Certificate details copied to clipboard!');
      }).catch(() => {
        // Final fallback - select text
        const textArea = document.createElement('textarea');
        textArea.value = verificationUrl;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          alert('Verification URL copied to clipboard!');
        } catch {
          alert(`Share this URL: ${verificationUrl}`);
        }
        document.body.removeChild(textArea);
      });
    }
  };

  const filteredActivities = activities.filter(activity =>
    filter === 'all' || activity.status === filter
  );

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'verified', label: 'Verified' },
          { key: 'rejected', label: 'Rejected' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} ({activities.filter(a => tab.key === 'all' || a.status === tab.key).length})
          </button>
        ))}
      </div>

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No activities found. Add your first activity to get started!
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredActivities.map(activity => (
            <div
              key={activity.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activity.title}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-500">
                      {activity.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[activity.status]}`}>
                    {statusIcons[activity.status]} {activity.status.toUpperCase()}
                  </span>
                  {activity.verifiedAt && (
                    <span className="text-xs text-gray-500">
                      Verified: {new Date(activity.verifiedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-700 mb-3">
                {activity.description}
              </p>

              {activity.proof && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
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

              {/* QR Code Certificate Section for Verified Activities */}
              {activity.status === 'verified' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                    🎓 Certificate of Achievement
                  </h4>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                    {/* QR Code */}
                    <div className="flex flex-col items-center">
                      {activity.qr_code_url ? (
                        <div className="p-2 bg-white rounded border">
                          <QRCodeCanvas
                            value={`http://localhost:3000/verify/activity/${activity.id}`}
                            size={120}
                            level="M"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">QR Code unavailable</span>
                        </div>
                      )}

                      <p className="text-xs text-gray-600 mt-2 text-center">
                        Scan to verify certificate
                      </p>
                    </div>

                    {/* Certificate Actions */}
                    <div className="flex-1 min-w-0">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-700">
                          <strong>Certificate ID:</strong> #{activity.id}
                        </div>
                        <div className="text-sm text-gray-700">
                          <strong>Verified:</strong> {activity.verifiedAt ? new Date(activity.verifiedAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-700">
                          <strong>URL:</strong> <a
                            href={`/verify/activity/${activity.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            localhost:3000/verify/activity/{activity.id}
                          </a>
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => downloadCertificate(activity)}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          📥 Download PDF
                        </button>
                        <button
                          onClick={() => shareCertificate(activity)}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-800 transition-colors"
                        >
                          🔗 Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
