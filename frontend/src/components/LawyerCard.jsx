import { ExternalLink, Mail, MapPin, Phone, ShieldCheck, Star } from 'lucide-react';

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < Math.round(rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
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
    <div className="rounded-3xl bg-white p-6 shadow-md shadow-slate-200/60">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold text-slate-900">{lawyer.name}</h3>
              {lawyer.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : null}
              {isPublicListing ? (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Public Listing
                </span>
              ) : null}
            </div>
            <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              {lawyer.location || 'Location not listed'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(lawyer.specializations || []).map((item) => (
              <span key={item} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700">
                {item}
              </span>
            ))}
          </div>

          {lawyer.bio ? <p className="max-w-2xl text-sm leading-6 text-slate-600">{lawyer.bio}</p> : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{isPublicListing ? 'Discovery' : 'Win Rate'}</p>
              {isPublicListing ? (
                <p className="mt-1 text-sm leading-6 text-slate-600">Found through Google Maps near the provided location.</p>
              ) : (
                <>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{numericWinRate.toFixed(1)}%</p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${numericWinRate}%` }} />
                  </div>
                </>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{isPublicListing ? 'Google Rating' : 'Rating'}</p>
              <div className="mt-1 flex items-center gap-2">
                <StarRating rating={lawyer.rating} />
                <span className="text-sm font-medium text-slate-700">{Number(lawyer.rating || 0).toFixed(1)}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{isPublicListing ? 'Reviews' : 'Record'}</p>
              {isPublicListing ? (
                <>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{lawyer.totalRatings || 0}</p>
                  <p className="text-sm text-slate-500">Public Google reviews</p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {lawyer.casesWon || 0} / {lawyer.casesTotal || 0}
                  </p>
                  <p className="text-sm text-slate-500">Cases won / handled</p>
                </>
              )}
            </div>
          </div>

          {showContact ? (
            <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
              <p className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                {lawyer.phone || 'Phone unavailable'}
              </p>
              <p className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                {lawyer.email || lawyer.website || 'Email / website unavailable'}
              </p>
              {lawyer.mapsUrl ? (
                <a href={lawyer.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
                  <ExternalLink className="h-4 w-4" />
                  Open in Google Maps
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>{action}</div>
      </div>
    </div>
  );
}
