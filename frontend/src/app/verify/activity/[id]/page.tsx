'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Certificate {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  status: string;
  verifiedAt: string;
  studentEmail: string;
  verifiedBy: string;
  proof?: string;
  qrGeneratedAt: string;
}

interface VerificationResponse {
  certificate: Certificate;
  institution: string;
  verificationUrl: string;
  validUntil: string | null;
}

export default function VerificationPage() {
  const { id } = useParams();
  const [certificate, setCertificate] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificate();
  }, [id]);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/activities/verify/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Certificate not found');
      }

      const data: VerificationResponse = await response.json();
      setCertificate(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load certificate');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Verifying Certificate...</h2>
          <p className="text-gray-600 mt-2">Please wait while we retrieve the certificate details.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Certificate Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Institution Branding */}
      <div className="bg-blue-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-4xl mb-4">🏛️</div>
          <h1 className="text-3xl font-bold mb-2">{certificate.institution}</h1>
          <p className="text-blue-100">Official Certificate Verification</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Activity Information */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
          <div className="bg-green-50 border-b-4 border-green-500 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-600 text-2xl mb-2">✅</div>
                <h2 className="text-2xl font-bold text-gray-900">Verified Activity</h2>
                <p className="text-green-700 font-medium">Official Verification</p>
              </div>
              <div className="text-right">
                <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold">
                  VERIFIED
                </div>
                <p className="text-sm text-gray-600 mt-2">Activity #{certificate.certificate.id}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Activity Details</h3>
                  <div className="space-y-3 text-gray-700">
                    <div>
                      <span className="font-semibold">Title:</span> {certificate.certificate.title}
                    </div>
                    <div>
                      <span className="font-semibold">Category:</span> {certificate.certificate.category}
                    </div>
                    <div>
                      <span className="font-semibold">Date:</span> {new Date(certificate.certificate.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
                  <p className="text-gray-700">{certificate.certificate.description}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Info</h3>
                  <div className="space-y-3 text-gray-700">
                    <div>
                      <span className="font-semibold">Student:</span> {certificate.certificate.studentEmail}
                    </div>
                    <div>
                      <span className="font-semibold">Verified By:</span> {certificate.certificate.verifiedBy}
                    </div>
                    <div>
                      <span className="font-semibold">Verified On:</span> {new Date(certificate.certificate.verifiedAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-semibold">QR Generated:</span> {new Date(certificate.certificate.qrGeneratedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-green-600 text-2xl">🔐</div>
                    <div>
                      <h4 className="font-bold text-gray-900">Authenticity Verified</h4>
                      <p className="text-sm text-gray-600">
                        This activity has been officially verified.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Student's Original Certificate/Document */}
        {certificate.certificate.proof && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
            <div className="bg-blue-50 border-b-4 border-blue-500 px-8 py-6">
              <div className="flex items-center">
                <div className="text-blue-600 text-2xl mr-4">📄</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Student's Certificate/Document</h2>
                  <p className="text-blue-700 font-medium">Official Student-Provided Proof</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-8">
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-8 mb-6 max-w-2xl mx-auto">
                  {certificate.certificate.proof.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                    // Display as image for image files
                    <img
                      src={certificate.certificate.proof}
                      alt="Student Certificate"
                      className="max-w-full max-h-96 rounded shadow-md"
                      onError={() => {
                        // Handle image load error by showing fallback
                        console.log('Image failed to load');
                      }}
                    />
                  ) : certificate.certificate.proof.toLowerCase().includes('.pdf') ? (
                    // Display as embed for PDFs
                    <embed
                      src={certificate.certificate.proof}
                      type="application/pdf"
                      width="100%"
                      height="400px"
                      className="border rounded shadow-md"
                    />
                  ) : (
                    // Fallback for other formats - show document icon
                    <div className="flex flex-col items-center py-12">
                      <div className="text-6xl mb-4">📄</div>
                      <p className="text-gray-600 mb-4">Document Preview Not Available</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center space-x-4">
                  <a
                    href={certificate.certificate.proof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    🔗 View Full Certificate/Document
                  </a>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = certificate.certificate.proof;
                      link.download = `Certificate-${certificate.certificate.id}-${Date.now()}`;
                      link.click();
                    }}
                    className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    💾 Download Certificate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!certificate.certificate.proof && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-yellow-600 text-2xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Certificate Provided</h3>
            <p className="text-yellow-700">
              This activity was verified but no original certificate or proof document was uploaded by the student.
            </p>
          </div>
        )}

        {/* Verification Footer */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Official Verification</h3>
          <p className="text-green-700 mb-4">
            This activity has been officially verified by {certificate.institution}.
            The student's certificate/document is authentic and corresponds to the verified activity.
          </p>
          <div className="text-sm text-green-600">
            <strong>Verification URL:</strong>
            <div className="mt-1 break-all text-blue-600">
              {certificate.verificationUrl}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🖨️ Print Verification
            </button>
            <button
              onClick={() => navigator.share?.({
                title: 'Verified Activity',
                text: `Verified: ${certificate.certificate.title}`,
                url: certificate.verificationUrl
              })}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              🔗 Share Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
