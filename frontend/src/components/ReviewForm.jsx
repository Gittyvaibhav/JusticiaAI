import React, { useState } from 'react';
import { Star } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

export default function ReviewForm({ caseId, lawyerId, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
    caseOutcome: 'won',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/reviews/add-review', {
        caseId,
        lawyerId,
        ...formData,
      });

      toast.success('Review submitted successfully!');
      onSubmit?.();
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error submitting review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-md">
      <h2 className="text-xl font-bold mb-4">Rate Your Lawyer</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block font-semibold mb-2">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleChange('rating', star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Case Outcome */}
        <div>
          <label className="block font-semibold mb-2">Case Outcome</label>
          <select
            value={formData.caseOutcome}
            onChange={(e) => handleChange('caseOutcome', e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="settled">Settled</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block font-semibold mb-2">Review Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., Excellent service and great results"
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block font-semibold mb-2">Your Review</label>
          <textarea
            value={formData.comment}
            onChange={(e) => handleChange('comment', e.target.value)}
            placeholder="Share your experience with this lawyer..."
            rows={4}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded font-semibold transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
