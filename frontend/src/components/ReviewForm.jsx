import React, { useState } from 'react';
import { Star } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';
import './ReviewForm.css';

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

  const handleSubmit = async (event) => {
    event.preventDefault();
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
    <div className="review-form">
      <h2 className="review-form__heading">Rate Your Lawyer</h2>

      <form onSubmit={handleSubmit} className="review-form__body">
        <div>
          <label className="review-form__label">Rating</label>
          <div className="review-form__stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleChange('rating', star)}
                className="review-form__star-button"
              >
                <Star
                  size={32}
                  className={star <= formData.rating ? 'review-form__star review-form__star--filled' : 'review-form__star review-form__star--empty'}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="review-form__label">Case Outcome</label>
          <select
            value={formData.caseOutcome}
            onChange={(event) => handleChange('caseOutcome', event.target.value)}
            className="review-form__input"
          >
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="settled">Settled</option>
          </select>
        </div>

        <div>
          <label className="review-form__label">Review Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(event) => handleChange('title', event.target.value)}
            placeholder="e.g., Excellent service and great results"
            className="review-form__input"
            required
          />
        </div>

        <div>
          <label className="review-form__label">Your Review</label>
          <textarea
            value={formData.comment}
            onChange={(event) => handleChange('comment', event.target.value)}
            placeholder="Share your experience with this lawyer..."
            rows={4}
            className="review-form__input review-form__input--textarea"
            required
          />
        </div>

        <div className="review-form__actions">
          <button type="button" onClick={onClose} className="review-form__button review-form__button--secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="review-form__button review-form__button--primary">
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
