import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import { CASE_TYPE_LABELS } from '../constants';
import './CaseCard.css';

function getStatusClass(status) {
  return `case-card__badge case-card__badge--status case-card__badge--status-${status || 'default'}`;
}

function getStrengthClass(strength) {
  const normalizedStrength = String(strength || 'default').toLowerCase();
  return `case-card__badge case-card__badge--strength case-card__badge--strength-${normalizedStrength}`;
}

export default function CaseCard({
  caseItem,
  action,
  detailPath,
  showSummary = false,
  expanded = false,
  onToggle,
  children,
}) {
  return (
    <div className="case-card">
      <div className="case-card__header">
        <div className="case-card__content">
          <div className="case-card__badges">
            <h3 className="case-card__title">{caseItem.title}</h3>
            <span className="case-card__badge case-card__badge--type">
              {CASE_TYPE_LABELS[caseItem.caseType] || caseItem.caseType}
            </span>
            <span className={getStatusClass(caseItem.status)}>
              {caseItem.status}
            </span>
            {caseItem.aiCaseStrength && (
              <span className={getStrengthClass(caseItem.aiCaseStrength)}>
                {caseItem.aiCaseStrength}
              </span>
            )}
          </div>

          <div className="case-card__meta">
            <span className="case-card__meta-item">
              <MapPin className="case-card__meta-icon" />
              {caseItem.location || 'Location pending'}
            </span>
            <span className="case-card__meta-item">
              <CalendarDays className="case-card__meta-icon" />
              {new Date(caseItem.createdAt).toLocaleDateString()}
            </span>
          </div>

          {showSummary ? (
            <p className="case-card__summary">
              {caseItem.aiCaseSummary || caseItem.description}
            </p>
          ) : null}
        </div>

        <div className="case-card__actions">
          {detailPath ? (
            <Link
              to={detailPath}
              className="case-card__button case-card__button--primary"
            >
              View Details
            </Link>
          ) : null}
          {onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              className="case-card__button case-card__button--secondary"
            >
              {expanded ? 'Hide Full Case' : 'View Full Case'}
            </button>
          ) : null}
          {action}
        </div>
      </div>

      {expanded && children ? <div className="case-card__expanded">{children}</div> : null}
    </div>
  );
}
