import React, { useEffect, useState } from 'react';
import { Star, CheckCircle, Award, DollarSign, Clock, MapPin } from 'lucide-react';
import api from '../api';
import './EnhancedLawyerCard.css';

function getMatchScoreClass(matchScore) {
  if (matchScore >= 70) {
    return 'enhanced-lawyer-card__match-fill enhanced-lawyer-card__match-fill--high';
  }

  if (matchScore >= 40) {
    return 'enhanced-lawyer-card__match-fill enhanced-lawyer-card__match-fill--mid';
  }

  return 'enhanced-lawyer-card__match-fill enhanced-lawyer-card__match-fill--low';
}

export default function EnhancedLawyerCard({ lawyer, onSelect, showMatchScore = false, matchScore = 0 }) {
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

  return (
    <div className="enhanced-lawyer-card">
      {showMatchScore ? (
        <div className="enhanced-lawyer-card__match">
          <span className="enhanced-lawyer-card__match-label">Match Score</span>
          <div className="enhanced-lawyer-card__match-row">
            <div className="enhanced-lawyer-card__match-track">
              <div className={getMatchScoreClass(matchScore)} style={{ width: `${matchScore}%` }} />
            </div>
            <span className="enhanced-lawyer-card__match-value">{matchScore}%</span>
          </div>
        </div>
      ) : null}

      <h3 className="enhanced-lawyer-card__title">{lawyer.name}</h3>

      {loading ? (
        <div className="enhanced-lawyer-card__loading">
          <div className="enhanced-lawyer-card__loading-bar" />
        </div>
      ) : (
        <>
          <div className="enhanced-lawyer-card__rating">
            {stats && stats.averageRating > 0 ? (
              <>
                <div className="enhanced-lawyer-card__stars">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      size={16}
                      className={index < Math.round(stats.averageRating)
                        ? 'enhanced-lawyer-card__star enhanced-lawyer-card__star--filled'
                        : 'enhanced-lawyer-card__star enhanced-lawyer-card__star--empty'}
                    />
                  ))}
                </div>
                <span className="enhanced-lawyer-card__rating-value">{stats.averageRating.toFixed(1)}</span>
                <span className="enhanced-lawyer-card__rating-copy">({stats.totalReviews} reviews)</span>
              </>
            ) : (
              <span className="enhanced-lawyer-card__empty-copy">No ratings yet</span>
            )}
          </div>

          {stats ? (
            <div className="enhanced-lawyer-card__stats">
              <div className="enhanced-lawyer-card__stat-box">
                <div className="enhanced-lawyer-card__stat-label">Success Rate</div>
                <div className="enhanced-lawyer-card__stat-value enhanced-lawyer-card__stat-value--green">{stats.successRate?.toFixed(0) || 0}%</div>
              </div>
              <div className="enhanced-lawyer-card__stat-box">
                <div className="enhanced-lawyer-card__stat-label">Experience</div>
                <div className="enhanced-lawyer-card__stat-value enhanced-lawyer-card__stat-value--blue">{stats.experience} years</div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {lawyer.specializations ? (
        <div className="enhanced-lawyer-card__section">
          <div className="enhanced-lawyer-card__section-label">Specializations</div>
          <div className="enhanced-lawyer-card__chips">
            {lawyer.specializations.map((spec) => (
              <span key={spec} className="enhanced-lawyer-card__chip">
                {spec}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {lawyer.badges && lawyer.badges.length > 0 ? (
        <div className="enhanced-lawyer-card__badges">
          {lawyer.badges.map((badge) => (
            <div key={badge} className="enhanced-lawyer-card__badge">
              {badge === 'verified' ? <CheckCircle size={12} /> : null}
              {badge === 'top-rated' ? <Award size={12} /> : null}
              {badge === 'affordable' ? <DollarSign size={12} /> : null}
              {badge === 'responsive' ? <Clock size={12} /> : null}
              <span className="enhanced-lawyer-card__badge-text">{badge}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="enhanced-lawyer-card__footer">
        {lawyer.averageFixedFee || lawyer.hourlyRate ? (
          <div className="enhanced-lawyer-card__pricing">
            {lawyer.averageFixedFee ? (
              <p className="enhanced-lawyer-card__pricing-line">
                <span className="enhanced-lawyer-card__pricing-strong">INR {lawyer.averageFixedFee.toLocaleString()}</span> average fee
              </p>
            ) : null}
            {lawyer.hourlyRate ? (
              <p className="enhanced-lawyer-card__pricing-line">
                <span className="enhanced-lawyer-card__pricing-strong">INR {lawyer.hourlyRate}</span>/hour
              </p>
            ) : null}
          </div>
        ) : (
          <p className="enhanced-lawyer-card__empty-copy enhanced-lawyer-card__empty-copy--spaced">Contact for pricing</p>
        )}

        <div className="enhanced-lawyer-card__location">
          <MapPin size={14} />
          {lawyer.location || 'Location not specified'}
        </div>

        <button type="button" onClick={() => onSelect?.(lawyer._id)} className="enhanced-lawyer-card__button">
          View Profile
        </button>
      </div>
    </div>
  );
}
