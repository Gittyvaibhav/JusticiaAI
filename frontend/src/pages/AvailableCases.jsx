import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import Navbar from '../components/Navbar';
import CaseCard from '../components/CaseCard';
import { CASE_TYPES, CASE_TYPE_LABELS } from '../constants';
import { useAuth } from '../context/AuthContext';

export default function AvailableCases() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [expandedCaseId, setExpandedCaseId] = useState(null);
  const [filters, setFilters] = useState({ caseType: 'all', urgency: 'all', sortBy: 'highest-urgency' });
  const [loading, setLoading] = useState(true);
  const specializations = user?.specializations || [];
  const hasSpecializations = specializations.length > 0;

  useEffect(() => {
    const loadCases = async () => {
      try {
        const responses = hasSpecializations
          ? await Promise.all(specializations.map((specialization) => api.get(`/cases/available/${specialization}`)))
          : [await api.get('/cases/available')];

        const mergedCases = responses.flatMap((response) => response.data.cases || []);
        const uniqueCases = Array.from(new Map(mergedCases.map((item) => [item._id, item])).values());
        setCases(uniqueCases);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load available cases');
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, [hasSpecializations, specializations]);

  const filteredCases = useMemo(() => {
    const urgencyRank = { high: 0, medium: 1, low: 2 };
    const lawyerLocation = user?.location?.toLowerCase() || '';

    return cases
      .filter((item) => (filters.caseType === 'all' ? true : item.caseType === filters.caseType))
      .filter((item) => (filters.urgency === 'all' ? true : item.urgency === filters.urgency))
      .sort((a, b) => {
        if (filters.sortBy === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }

        if (filters.sortBy === 'closest-location') {
          const aMatch = lawyerLocation && a.location?.toLowerCase().includes(lawyerLocation) ? 0 : 1;
          const bMatch = lawyerLocation && b.location?.toLowerCase().includes(lawyerLocation) ? 0 : 1;
          return aMatch - bMatch || new Date(b.createdAt) - new Date(a.createdAt);
        }

        return urgencyRank[a.urgency] - urgencyRank[b.urgency] || new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [cases, filters, user?.location]);

  const acceptCase = async (caseId) => {
    try {
      await api.post(`/cases/${caseId}/accept`);
      setCases((current) => current.filter((item) => item._id !== caseId));
      toast.success('Case accepted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept case');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] bg-white p-8 shadow-md shadow-slate-200/60">
          <h1 className="text-3xl font-semibold text-slate-900">Available Cases</h1>
          <p className="mt-3 text-sm text-slate-500">
            {hasSpecializations
              ? 'Browse open matters that match your specializations and choose cases you want to handle.'
              : 'Your profile has no saved specializations yet, so all open cases are shown for now. Add specializations from the lawyer dashboard for tighter matching.'}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <select value={filters.caseType} onChange={(event) => setFilters((current) => ({ ...current, caseType: event.target.value }))} className="rounded-2xl border-slate-200">
              <option value="all">All case types</option>
              {CASE_TYPES.map((type) => (
                <option key={type} value={type}>{CASE_TYPE_LABELS[type]}</option>
              ))}
            </select>
            <select value={filters.urgency} onChange={(event) => setFilters((current) => ({ ...current, urgency: event.target.value }))} className="rounded-2xl border-slate-200">
              <option value="all">All urgency levels</option>
              <option value="high">High urgency</option>
              <option value="medium">Medium urgency</option>
              <option value="low">Low urgency</option>
            </select>
            <select value={filters.sortBy} onChange={(event) => setFilters((current) => ({ ...current, sortBy: event.target.value }))} className="rounded-2xl border-slate-200">
              <option value="newest">Newest</option>
              <option value="highest-urgency">Highest urgency</option>
              <option value="closest-location">Closest location</option>
            </select>
          </div>
        </section>

        <section className="mt-8 space-y-5">
          {loading ? (
            <div className="rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-md shadow-slate-200/60">Loading available cases...</div>
          ) : filteredCases.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-md shadow-slate-200/60">
              {hasSpecializations
                ? 'No open cases match your current filters.'
                : 'No open cases are available right now. You can still add specializations in your lawyer profile to improve future matching.'}
            </div>
          ) : (
            filteredCases.map((caseItem) => (
              <CaseCard
                key={caseItem._id}
                caseItem={caseItem}
                showSummary
                expanded={expandedCaseId === caseItem._id}
                onToggle={() => setExpandedCaseId((current) => (current === caseItem._id ? null : caseItem._id))}
                action={
                  <button type="button" onClick={() => acceptCase(caseItem._id)} className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                    Accept Case
                  </button>
                }
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">AI Summary</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{caseItem.aiCaseSummary || 'No summary available.'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Relevant Laws</p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{caseItem.aiRelevantLaws || 'No laws available.'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Next Steps</p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{caseItem.aiNextSteps || 'No next steps available.'}</p>
                  </div>
                </div>
              </CaseCard>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
