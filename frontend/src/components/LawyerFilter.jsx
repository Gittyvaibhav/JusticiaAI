import React, { useState } from 'react';
import { X, Filter } from 'lucide-react';
import './LawyerFilter.css';

export default function LawyerFilter({ onFilter, specializations, onClose }) {
  const [filters, setFilters] = useState({
    specialization: '',
    location: '',
    maxBudget: '',
    minRating: '',
    verified: false,
  });

  const handleChange = (field, value) => {
    const nextFilters = { ...filters, [field]: value };
    setFilters(nextFilters);
    onFilter(nextFilters);
  };

  const resetFilters = () => {
    const nextFilters = {
      specialization: '',
      location: '',
      maxBudget: '',
      minRating: '',
      verified: false,
    };

    setFilters(nextFilters);
    onFilter({});
  };

  return (
    <div className="lawyer-filter">
      <div className="lawyer-filter__panel">
        <div className="lawyer-filter__header">
          <h2 className="lawyer-filter__title">
            <Filter size={20} />
            Filter Lawyers
          </h2>
          <button type="button" onClick={onClose} className="lawyer-filter__close">
            <X size={24} />
          </button>
        </div>

        <div className="lawyer-filter__fields">
          <div>
            <label className="lawyer-filter__label">Practice Area</label>
            <select
              value={filters.specialization}
              onChange={(event) => handleChange('specialization', event.target.value)}
              className="lawyer-filter__input"
            >
              <option value="">All Specializations</option>
              {specializations?.map((spec) => (
                <option key={spec} value={spec}>
                  {spec.charAt(0).toUpperCase() + spec.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="lawyer-filter__label">Location</label>
            <input
              type="text"
              placeholder="Enter city or area"
              value={filters.location}
              onChange={(event) => handleChange('location', event.target.value)}
              className="lawyer-filter__input"
            />
          </div>

          <div>
            <label className="lawyer-filter__label">Max Budget (INR)</label>
            <input
              type="number"
              placeholder="e.g., 50000"
              value={filters.maxBudget}
              onChange={(event) => handleChange('maxBudget', event.target.value)}
              className="lawyer-filter__input"
            />
          </div>

          <div>
            <label className="lawyer-filter__label">Minimum Rating</label>
            <select
              value={filters.minRating}
              onChange={(event) => handleChange('minRating', event.target.value)}
              className="lawyer-filter__input"
            >
              <option value="">Any Rating</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>

          <div className="lawyer-filter__checkbox-row">
            <input
              type="checkbox"
              id="verified"
              checked={filters.verified}
              onChange={(event) => handleChange('verified', event.target.checked)}
              className="lawyer-filter__checkbox"
            />
            <label htmlFor="verified" className="lawyer-filter__checkbox-label">
              Verified Lawyers Only
            </label>
          </div>

          <button type="button" onClick={resetFilters} className="lawyer-filter__reset">
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
