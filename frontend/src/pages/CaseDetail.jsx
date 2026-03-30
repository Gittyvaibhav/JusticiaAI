import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Phone, Star } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import LawyerCard from '../components/LawyerCard';
import { CASE_TYPE_LABELS, STATUS_STYLES, STRENGTH_STYLES } from '../constants';

function SectionCard({ title, content }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-md shadow-slate-200/60">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{content || 'Not available yet.'}</p>
    </div>
  );
}

export default function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCase = async () => {
    try {
      const { data } = await api.get(`/cases/${id}`);
      setCaseData(data.case);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [id]);

  const submitRating = async () => {
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      await api.post(`/cases/${id}/rate-lawyer`, { rating, review });
      toast.success('Lawyer rated successfully');
      await loadCase();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500 sm:px-6 lg:px-8">Loading case details...</div>
      </div>
    );
  }

  if (!caseData) {
    return null;
  }

  const canRate = caseData.status === 'resolved' && caseData.assignedLawyer && !caseData.lawyerRating;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] bg-white p-8 shadow-md shadow-slate-200/60">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              {CASE_TYPE_LABELS[caseData.caseType] || caseData.caseType}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[caseData.status] || 'bg-slate-100 text-slate-700'}`}>
              {caseData.status}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STRENGTH_STYLES[caseData.aiCaseStrength] || 'bg-slate-100 text-slate-700'}`}>
              {caseData.aiCaseStrength}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">{caseData.title}</h1>
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-500">
            <span>Urgency: {caseData.urgency}</span>
            <span>Created: {new Date(caseData.createdAt).toLocaleString()}</span>
            <span>Location: {caseData.location || 'Not specified'}</span>
          </div>
          <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-sm leading-7 text-slate-700">{caseData.description}</div>
          {caseData.outcome && caseData.outcome !== 'pending' ? <p className="mt-4 text-sm font-medium text-slate-700">Outcome: {caseData.outcome}</p> : null}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <SectionCard title="Case Summary" content={caseData.aiCaseSummary} />
          <SectionCard title="Relevant Laws and Sections" content={caseData.aiRelevantLaws} />
          <SectionCard title="Immediate Next Steps" content={caseData.aiNextSteps} />
          <SectionCard title="Lawyer Type Needed" content={caseData.aiLawyerTypeNeeded} />
        </section>

        {caseData.assignedLawyer ? (
          <section className="mt-8">
            <h2 className="mb-5 text-2xl font-semibold text-slate-900">Assigned Lawyer</h2>
            <LawyerCard
              lawyer={caseData.assignedLawyer}
              showContact
              action={
                <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {caseData.assignedLawyer.email || 'Email unavailable'}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {caseData.assignedLawyer.phone || 'Phone unavailable'}
                  </p>
                </div>
              }
            />
          </section>
        ) : null}

        {canRate ? (
          <section className="mt-8 rounded-[32px] bg-white p-8 shadow-md shadow-slate-200/60">
            <h2 className="text-2xl font-semibold text-slate-900">Rate Your Lawyer</h2>
            <div className="mt-5 flex gap-2">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                return (
                  <button key={value} type="button" onClick={() => setRating(value)}>
                    <Star className={`h-8 w-8 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">Review</label>
              <textarea rows="4" value={review} onChange={(event) => setReview(event.target.value)} className="w-full rounded-2xl border-slate-200" />
            </div>
            <button
              type="button"
              onClick={submitRating}
              disabled={submitting}
              className="mt-5 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </section>
        ) : null}
      </main>
    </div>
  );
}
