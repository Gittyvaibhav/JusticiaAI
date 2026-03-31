import { ExternalLink, Mail, MapPin, Phone, ShieldCheck, Star } from 'lucide-react';
import './LawyerCard.css';

function StarRating({ rating }) {
  return (
    <div className="lawyer-card__stars">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`lawyer-card__star ${index < Math.round(rating || 0) ? 'lawyer-card__star--filled' : 'lawyer-card__star--empty'}`}
        />
      ))}
    </div>
  );
}

export default function LawyerCard({ lawyer, action, showContact = false }) {
  const parsedWinRate = Number(lawyer.winRate);
  const numericWinRate = Number.isFinite(parsedWinRate) ? Math.max(0, Math.min(100, parsedWinRate)) : 0;
  const isPublicListing = lawyer.source === 'google-maps';

  return (
    <div className="lawyer-card">
      <div className="lawyer-card__layout">
        <div className="lawyer-card__content">
          <div>
            <div className="lawyer-card__title-row">
              <h3 className="lawyer-card__title">{lawyer.name}</h3>
              {lawyer.verified ? (
                <span className="lawyer-card__tag lawyer-card__tag--verified">
                  <ShieldCheck className="lawyer-card__tag-icon lawyer-card__tag-icon--small" />
                  Verified
                </span>
              ) : null}
              {isPublicListing ? (
                <span className="lawyer-card__tag lawyer-card__tag--public">
                  Public Listing
                </span>
              ) : null}
            </div>
            <p className="lawyer-card__location">
              <MapPin className="lawyer-card__tag-icon" />
              {lawyer.location || 'Location not listed'}
            </p>
          </div>

          <div className="lawyer-card__specializations">
            {(lawyer.specializations || []).map((item) => (
              <span key={item} className="lawyer-card__specialization">
                {item}
              </span>
            ))}
          </div>

          {lawyer.bio ? <p className="lawyer-card__bio">{lawyer.bio}</p> : null}

          <div className="lawyer-card__stats">
            <div>
              <p className="lawyer-card__stat-label">{isPublicListing ? 'Discovery' : 'Win Rate'}</p>
              {isPublicListing ? (
                <p className="lawyer-card__stat-copy">Found through Google Maps near the provided location.</p>
              ) : (
                <>
                  <p className="lawyer-card__stat-value">{numericWinRate.toFixed(1)}%</p>
                  <div className="lawyer-card__progress">
                    <div className="lawyer-card__progress-fill" style={{ width: `${numericWinRate}%` }} />
                  </div>
                </>
              )}
            </div>
            <div>
              <p className="lawyer-card__stat-label">{isPublicListing ? 'Google Rating' : 'Rating'}</p>
              <div className="lawyer-card__rating-row">
                <StarRating rating={lawyer.rating} />
                <span className="lawyer-card__rating-value">{Number(lawyer.rating || 0).toFixed(1)}</span>
              </div>
            </div>
            <div>
              <p className="lawyer-card__stat-label">{isPublicListing ? 'Reviews' : 'Record'}</p>
              {isPublicListing ? (
                <>
                  <p className="lawyer-card__stat-value">{lawyer.totalRatings || 0}</p>
                  <p className="lawyer-card__stat-copy">Public Google reviews</p>
                </>
              ) : (
                <>
                  <p className="lawyer-card__stat-value">
                    {lawyer.casesWon || 0} / {lawyer.casesTotal || 0}
                  </p>
                  <p className="lawyer-card__stat-copy">Cases won / handled</p>
                </>
              )}
            </div>
          </div>

          {showContact ? (
            <div className="lawyer-card__contact">
              <p className="lawyer-card__contact-item">
                <Phone className="lawyer-card__contact-icon" />
                {lawyer.phone || 'Phone unavailable'}
              </p>
              <p className="lawyer-card__contact-item">
                <Mail className="lawyer-card__contact-icon" />
                {lawyer.email || lawyer.website || 'Email / website unavailable'}
              </p>
              {lawyer.mapsUrl ? (
                <a href={lawyer.mapsUrl} target="_blank" rel="noreferrer" className="lawyer-card__maps-link">
                  <ExternalLink className="lawyer-card__contact-icon" />
                  Open in Google Maps
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="lawyer-card__action">{action}</div>
      </div>
    </div>
  );
}
