import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock3, Mail, MapPin, Phone, Shield, Sparkles, Star } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import LawyerCard from '../components/LawyerCard';
import CaseChatPanel from '../components/CaseChatPanel';
import { CASE_TYPE_LABELS, STATUS_STYLES, STRENGTH_STYLES } from '../constants';
import { useAuth } from '../context/AuthContext';

function SectionCard({ title, content }) {
  return (
    <div className="rounded-[30px] border border-white/80 bg-white/85 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{content || 'Not available yet.'}</p>
    </div>
  );
}

export default function CaseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: 'assigned', outcome: '' });
  const [savingStatus, setSavingStatus] = useState(false);
  const [closingCase, setClosingCase] = useState(false);

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

  useEffect(() => {
    setStatusForm({
      status: caseData?.status === 'resolved' ? 'resolved' : caseData?.status === 'in-progress' ? 'in-progress' : 'assigned',
      outcome: caseData?.outcome && caseData.outcome !== 'pending' ? caseData.outcome : '',
    });
  }, [caseData]);

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

  const updateCaseStatus = async () => {
    if (user?.role !== 'lawyer') {
      return;
    }

    if (statusForm.status === 'resolved' && !statusForm.outcome) {
      toast.error('Please choose an outcome before resolving the case');
      return;
    }

    setSavingStatus(true);

    try {
      await api.post(`/cases/${id}/update-status`, statusForm);
      toast.success('Case status updated');
      await loadCase();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update case status');
    } finally {
      setSavingStatus(false);
    }
  };

  const closeCase = async () => {
    setClosingCase(true);

    try {
      await api.post(`/cases/${id}/close`);
      toast.success('Case closed successfully');
      await loadCase();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close case');
    } finally {
      setClosingCase(false);
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
  const counterpart = user?.role === 'lawyer' ? caseData.userId : caseData.assignedLawyer;
  const chatEnabled = Boolean(caseData.assignedLawyer);
  const canCloseCase = user?.role === 'user'
    ? ['open', 'resolved'].includes(caseData.status)
    : user?.role === 'lawyer' && caseData.assignedLawyer && ['resolved'].includes(caseData.status);
  const canLawyerManageStatus = user?.role === 'lawyer' && caseData.assignedLawyer && ['assigned', 'in-progress', 'resolved'].includes(caseData.status);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[38px] border border-white/80 bg-white/85 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="bg-[linear-gradient(135deg,#0f172a,#1e3a8a_54%,#0f766e)] px-8 py-10 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {CASE_TYPE_LABELS[caseData.caseType] || caseData.caseType}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[caseData.status] || 'bg-white/10 text-white'}`}>
                {caseData.status}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STRENGTH_STYLES[caseData.aiCaseStrength] || 'bg-white/10 text-white'}`}>
                {caseData.aiCaseStrength}
              </span>
            </div>
            <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-3xl">
                <p className="text-sm uppercase tracking-[0.28em] text-blue-100">Case Overview</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">{caseData.title}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">{caseData.description}</p>
              </div>
              <div className="grid min-w-[260px] gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Urgency</p>
                  <p className="mt-2 text-lg font-semibold text-white">{caseData.urgency}</p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Outcome</p>
                  <p className="mt-2 text-lg font-semibold text-white">{caseData.outcome && caseData.outcome !== 'pending' ? caseData.outcome : 'Pending'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] px-8 py-6 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <Clock3 className="h-4 w-4" />
                Created
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800">{new Date(caseData.createdAt).toLocaleString()}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <MapPin className="h-4 w-4" />
                Location
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800">{caseData.location || 'Not specified'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <Shield className="h-4 w-4" />
                Matter State
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800">{caseData.status}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <SectionCard title="Case Summary" content={caseData.aiCaseSummary} />
          <SectionCard title="Relevant Laws and Sections" content={caseData.aiRelevantLaws} />
          <SectionCard title="Immediate Next Steps" content={caseData.aiNextSteps} />
          <SectionCard title="Lawyer Type Needed" content={caseData.aiLawyerTypeNeeded} />
        </section>

        <section className="mt-8">
          <CaseChatPanel
            caseId={caseData._id}
            currentUser={user}
            counterpart={counterpart}
            chatEnabled={chatEnabled}
            onCaseUpdated={() => loadCase()}
          />
        </section>

        {canLawyerManageStatus || canCloseCase ? (
          <section className="mt-8 overflow-hidden rounded-[36px] border border-white/80 bg-white/90 shadow-xl shadow-slate-200/70 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4 bg-[linear-gradient(135deg,#fff7ed,#ffffff_45%,#eff6ff)] px-8 py-6">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  <Sparkles className="h-4 w-4" />
                  Workflow
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Case Actions</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {user?.role === 'lawyer'
                    ? 'Move the case through progress, resolve it, or close it after completion.'
                    : 'Close the case when your request is cancelled or the matter is fully completed.'}
                </p>
              </div>
              <span className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${STATUS_STYLES[caseData.status] || 'bg-slate-100 text-slate-700'}`}>
                {caseData.status}
              </span>
            </div>

            <div className="p-8">
            {canLawyerManageStatus ? (
              <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                    <select
                      value={statusForm.status}
                      onChange={(event) => setStatusForm((current) => ({ ...current, status: event.target.value }))}
                      className="w-full rounded-3xl border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <option value="assigned">Assigned</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Outcome</label>
                    <select
                      value={statusForm.outcome}
                      onChange={(event) => setStatusForm((current) => ({ ...current, outcome: event.target.value }))}
                      disabled={statusForm.status !== 'resolved'}
                      className="w-full rounded-3xl border-slate-200 bg-slate-50 px-4 py-3 disabled:bg-slate-100"
                    >
                      <option value="">Select outcome</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                      <option value="settled">Settled</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={updateCaseStatus}
                  disabled={savingStatus}
                  className="inline-flex h-fit rounded-full bg-[linear-gradient(135deg,#0f766e,#115e59)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-200/60 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingStatus ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            ) : null}

            {canCloseCase ? (
              <div className={`${canLawyerManageStatus ? 'mt-6 border-t border-slate-100 pt-6' : 'mt-6'}`}>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] bg-[linear-gradient(135deg,#fff7ed,#ffffff)] p-5 ring-1 ring-amber-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">End this case</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {caseData.status === 'open'
                        ? 'Close the request if you no longer need help on this matter.'
                        : 'Close the case to mark it fully completed and archived.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCase}
                    disabled={closingCase}
                    className="rounded-full bg-[linear-gradient(135deg,#1f2937,#0f172a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200/80 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {closingCase ? 'Closing...' : 'Close Case'}
                  </button>
                </div>
              </div>
            ) : null}
            </div>
          </section>
        ) : null}

        {caseData.assignedLawyer ? (
          <section className="mt-8">
            <h2 className="mb-5 text-2xl font-semibold text-slate-900">{user?.role === 'lawyer' ? 'Client Details' : 'Assigned Lawyer'}</h2>
            {user?.role === 'lawyer' ? (
              <div className="rounded-[36px] border border-white/80 bg-white/90 p-8 shadow-xl shadow-slate-200/70 backdrop-blur">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Client Name</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{caseData.userId?.name || 'Unavailable'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Location</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{caseData.userId?.location || 'Unavailable'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-700">
                    <p className="inline-flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {caseData.userId?.phone || 'Phone unavailable'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </section>
        ) : null}

        {canRate ? (
          <section className="mt-8 rounded-[36px] border border-white/80 bg-white/90 p-8 shadow-xl shadow-slate-200/70 backdrop-blur">
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
              <textarea rows="4" value={review} onChange={(event) => setReview(event.target.value)} className="w-full rounded-3xl border-slate-200 bg-slate-50 px-4 py-3" />
            </div>
            <button
              type="button"
              onClick={submitRating}
              disabled={submitting}
              className="mt-5 rounded-full bg-[linear-gradient(135deg,#1d4ed8,#1e3a8a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200/60 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </section>
        ) : null}
      </main>
    </div>
  );
}
