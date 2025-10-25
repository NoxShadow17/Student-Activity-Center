'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface ActivityFormProps {
  onSuccess: () => void;
}

const categories = [
  'Academics',
  'Sports',
  'Volunteering',
  'Internships',
  'Skills',
  'Co-curricular'
];

export default function ActivityForm({ onSuccess }: ActivityFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    proof: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/activities', formData);
      setFormData({
        title: '',
        description: '',
        category: '',
        date: '',
        proof: ''
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Activity Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-outset text-gray-900"
            placeholder="e.g., Volunteer at Local Shelter"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-outset text-gray-900"
            placeholder="Provide details about the activity, your involvement, and impact..."
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-outset text-gray-900"
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-outset text-gray-900"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="proof" className="block text-sm font-medium text-gray-700 mb-1">
            Proof/Supporting Document (Optional)
          </label>
          <input
            type="text"
            id="proof"
            name="proof"
            value={formData.proof}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-outset text-gray-900"
            placeholder="e.g., URL to certificate, photo, etc."
          />
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-medium"
      >
        {loading ? 'Submitting...' : 'Add Activity'}
      </button>
    </form>
  );
}
