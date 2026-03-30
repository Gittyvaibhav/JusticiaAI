import React, { useState } from 'react';
import { X, Filter } from 'lucide-react';

export default function LawyerFilter({ onFilter, specializations, onClose }) {
  const [filters, setFilters] = useState({
    specialization: '',
    location: '',
    maxBudget: '',
    minRating: '',
    verified: false,
  });

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Filter size={20} />
            Filter Lawyers
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Specialization */}
          <div>
            <label className="block text-sm font-semibold mb-2">Practice Area</label>
            <select
              value={filters.specialization}
              onChange={(e) => handleChange('specialization', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">All Specializations</option>
              {specializations?.map((spec) => (
                <option key={spec} value={spec}>
                  {spec.charAt(0).toUpperCase() + spec.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold mb-2">Location</label>
            <input
              type="text"
              placeholder="Enter city or area"
              value={filters.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-semibold mb-2">Max Budget (₹)</label>
            <input
              type="number"
              placeholder="e.g., 50000"
              value={filters.maxBudget}
              onChange={(e) => handleChange('maxBudget', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold mb-2">Minimum Rating</label>
            <select
              value={filters.minRating}
              onChange={(e) => handleChange('minRating', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Any Rating</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>

          {/* Verified Only */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="verified"
              checked={filters.verified}
              onChange={(e) => handleChange('verified', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="verified" className="ml-2 text-sm font-semibold cursor-pointer">
              Verified Lawyers Only
            </label>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setFilters({
                specialization: '',
                location: '',
                maxBudget: '',
                minRating: '',
                verified: false,
              });
              onFilter({});
            }}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded font-semibold transition-colors mt-6"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
