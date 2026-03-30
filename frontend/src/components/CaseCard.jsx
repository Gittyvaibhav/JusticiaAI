import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import { CASE_TYPE_LABELS, STATUS_STYLES, STRENGTH_STYLES } from '../constants';

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
    <div className="rounded-3xl bg-white p-6 shadow-md shadow-slate-200/60">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-slate-900">{caseItem.title}</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              {CASE_TYPE_LABELS[caseItem.caseType] || caseItem.caseType}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[caseItem.status] || 'bg-slate-100 text-slate-700'}`}>
              {caseItem.status}
            </span>
            {caseItem.aiCaseStrength && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STRENGTH_STYLES[caseItem.aiCaseStrength] || 'bg-slate-100 text-slate-700'}`}>
                {caseItem.aiCaseStrength}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {caseItem.location || 'Location pending'}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {new Date(caseItem.createdAt).toLocaleDateString()}
            </span>
          </div>

          {showSummary ? (
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              {caseItem.aiCaseSummary || caseItem.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          {detailPath ? (
            <Link
              to={detailPath}
              className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              View Details
            </Link>
          ) : null}
          {onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {expanded ? 'Hide Full Case' : 'View Full Case'}
            </button>
          ) : null}
          {action}
        </div>
      </div>

      {expanded && children ? <div className="mt-6 border-t border-slate-100 pt-6">{children}</div> : null}
    </div>
  );
}
