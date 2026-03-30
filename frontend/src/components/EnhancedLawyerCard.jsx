import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Award, DollarSign, Clock } from 'lucide-react';
import api from '../api';

export default function LawyerCard({ lawyer, onSelect, showMatchScore = false, matchScore = 0 }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get(`/reviews/stats/${lawyer._id}`);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [lawyer._id]);

  const renderBadges = () => {
    return lawyer.badges?.map((badge) => (
      <div key={badge} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
        {badge === 'verified' && <CheckCircle size={12} />}
        {badge === 'top-rated' && <Award size={12} />}
        {badge === 'affordable' && <DollarSign size={12} />}
        {badge === 'responsive' && <Clock size={12} />}
        <span className="capitalize">{badge}</span>
      </div>
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      {showMatchScore && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-600">Match Score</span>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  matchScore >= 70
                    ? 'bg-green-500'
                    : matchScore >= 40
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${matchScore}%` }}
              />
            </div>
            <span className="text-sm font-bold">{matchScore}%</span>
          </div>
        </div>
      )}

      <h3 className="font-bold text-lg mb-2">{lawyer.name}</h3>

      {loading ? (
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            {stats && stats.averageRating > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.round(stats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="font-semibold text-sm">{stats.averageRating.toFixed(1)}</span>
                <span className="text-xs text-gray-600">({stats.totalReviews} reviews)</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">No ratings yet</span>
            )}
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-600 text-xs">Success Rate</div>
                <div className="font-bold text-green-600">{stats.successRate?.toFixed(0) || 0}%</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-600 text-xs">Experience</div>
                <div className="font-bold text-blue-600">{stats.experience} years</div>
              </div>
            </div>
          )}
        </>
      )}

      {lawyer.specializations && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">Specializations</div>
          <div className="flex flex-wrap gap-1">
            {lawyer.specializations.map((spec) => (
              <span key={spec} className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}

      {lawyer.badges && lawyer.badges.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {renderBadges()}
        </div>
      )}

      <div className="border-t pt-3">
        {lawyer.averageFixedFee || lawyer.hourlyRate ? (
          <div className="mb-2 text-sm">
            {lawyer.averageFixedFee && (
              <p className="text-gray-700">
                <span className="font-semibold">₹{lawyer.averageFixedFee.toLocaleString()}</span> average fee
              </p>
            )}
            {lawyer.hourlyRate && (
              <p className="text-gray-700">
                <span className="font-semibold">₹{lawyer.hourlyRate}</span>/hour
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-2">Contact for pricing</p>
        )}

        <div className="text-xs text-gray-600 mb-3">
          📍 {lawyer.location || 'Location not specified'}
        </div>

        <button
          onClick={() => onSelect?.(lawyer._id)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold transition-colors"
        >
          View Profile
        </button>
      </div>
    </div>
  );
}
