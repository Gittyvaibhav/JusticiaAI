import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock3, Mail, MapPin, Phone, Shield, ShieldAlert, Sparkles, Star } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import LawyerCard from '../components/LawyerCard';
import CaseChatPanel from '../components/CaseChatPanel';
import PaymentCheckout from '../components/PaymentCheckout';
import { CASE_TYPE_LABELS, STATUS_STYLES, STRENGTH_STYLES } from '../constants';
import { useAuth } from '../context/AuthContext';
import './CaseDetail.css';

function SectionCard({ title, content }) {
  return (
    <div className="case-detail__info-card">
      <h3>{title}</h3>
      <p>{content || 'Not available yet.'}</p>
    </div>
  );
}

function RecommendationAction({ lawyer, onHire }) {
  return (
    <div className="case-detail__recommendation-action">
      <p>{lawyer.recommendationSummary || 'Recommended from the verified platform network.'}</p>
      {lawyer.recommendationReasons?.length ? (
        <ul className="case-detail__reason-list">
          {lawyer.recommendationReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      <button type="button" onClick={onHire} className="case-detail__primary-button case-detail__primary-button--dark">Hire And Pay</button>
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
  const [recommendedLawyers, setRecommendedLawyers] = useState([]);
  const [recommendationMeta, setRecommendationMeta] = useState(null);
  const [loadingLawyers, setLoadingLawyers] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState(null);

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

  useEffect(() => { loadCase(); }, [id]);

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

  const loadRecommendedLawyers = async () => {
    setLoadingLawyers(true);
    try {
      const { data } = await api.get(`/lawyers/discover/${id}`);
      setRecommendedLawyers(data.registeredLawyers || []);
      setRecommendationMeta(data.meta || null);
      if (!data.registeredLawyers?.length) {
        toast('No verified lawyers are available for this case yet.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load matching lawyers');
    } finally {
      setLoadingLawyers(false);
    }
  };

  const handlePaymentSuccess = async ({ case: assignedCase }) => {
    setSelectedLawyer(null);
    if (assignedCase) {
      setCaseData(assignedCase);
      return;
    }
    await loadCase();
  };

  if (loading) {
    return <div className="case-detail"><Navbar /><div className="case-detail__loading">Loading case details...</div></div>;
  }

  if (!caseData) {
    return null;
  }

  const canRate = caseData.status === 'resolved' && caseData.assignedLawyer && !caseData.lawyerRating;
  const counterpart = user?.role === 'lawyer' ? caseData.userId : caseData.assignedLawyer;
  const chatEnabled = Boolean(caseData.assignedLawyer);
  const canHireLawyer = user?.role === 'user' && caseData.status === 'open' && !caseData.assignedLawyer;
  const canCloseCase = user?.role === 'user'
    ? ['open', 'resolved'].includes(caseData.status)
    : user?.role === 'lawyer' && caseData.assignedLawyer && ['resolved'].includes(caseData.status);
  const canLawyerManageStatus = user?.role === 'lawyer' && caseData.assignedLawyer && ['assigned', 'in-progress', 'resolved'].includes(caseData.status);

  return (
    <div className="case-detail">
      <Navbar />
      <main className="case-detail__main">
        <section className="case-detail__hero-shell">
          <div className="case-detail__hero">
            <div className="case-detail__badge-row">
              <span className="case-detail__badge">{CASE_TYPE_LABELS[caseData.caseType] || caseData.caseType}</span>
              <span className={`case-detail__badge ${STATUS_STYLES[caseData.status] || 'bg-white/10 text-white'}`}>{caseData.status}</span>
              <span className={`case-detail__badge ${STRENGTH_STYLES[caseData.aiCaseStrength] || 'bg-white/10 text-white'}`}>{caseData.aiCaseStrength}</span>
            </div>
            <div className="case-detail__hero-row">
              <div className="case-detail__hero-copy">
                <p className="case-detail__eyebrow">Case Overview</p>
                <h1>{caseData.title}</h1>
                <p>{caseData.description}</p>
              </div>
              <div className="case-detail__hero-stats">
                <div><p>Urgency</p><strong>{caseData.urgency}</strong></div>
                <div><p>Outcome</p><strong>{caseData.outcome && caseData.outcome !== 'pending' ? caseData.outcome : 'Pending'}</strong></div>
              </div>
            </div>
          </div>

          <div className="case-detail__meta-grid">
            <div className="case-detail__meta-card"><p><Clock3 className="case-detail__inline-icon" />Created</p><span>{new Date(caseData.createdAt).toLocaleString()}</span></div>
            <div className="case-detail__meta-card"><p><MapPin className="case-detail__inline-icon" />Location</p><span>{caseData.location || 'Not specified'}</span></div>
            <div className="case-detail__meta-card"><p><Shield className="case-detail__inline-icon" />Matter State</p><span>{caseData.status}</span></div>
          </div>
        </section>

        <section className="case-detail__grid">
          <SectionCard title="Case Summary" content={caseData.aiCaseSummary} />
          <SectionCard title="Relevant Laws and Sections" content={caseData.aiRelevantLaws} />
          <SectionCard title="Immediate Next Steps" content={caseData.aiNextSteps} />
          <SectionCard title="Procedural Checklist" content={caseData.aiProceduralChecklist} />
          <SectionCard title="Documents and Evidence to Gather" content={caseData.aiDocumentsNeeded} />
          <SectionCard title="Likely Forum or Authority" content={caseData.aiLikelyForum} />
          <SectionCard title="Expected Timeline" content={caseData.aiExpectedTimeline} />
          <SectionCard title="Key Risks or Weaknesses" content={caseData.aiKeyRisks} />
          <SectionCard title="Lawyer Type Needed" content={caseData.aiLawyerTypeNeeded} />
          <SectionCard title="Why these lawyers should fit" content={caseData.aiLawyerFitRationale} />
        </section>

        <div className="case-detail__disclaimer">
          <ShieldAlert className="case-detail__inline-icon case-detail__inline-icon--top" />
          <span>This AI guidance is informational support for understanding the likely legal path. It is not a substitute for formal legal advice or a guaranteed case outcome.</span>
        </div>

        <section className="case-detail__chat-wrap">
          <CaseChatPanel caseId={caseData._id} currentUser={user} counterpart={counterpart} chatEnabled={chatEnabled} onCaseUpdated={() => loadCase()} />
        </section>

        {canHireLawyer ? (
          <section className="case-detail__panel">
            <div className="case-detail__panel-head">
              <div>
                <p className="case-detail__eyebrow case-detail__eyebrow--teal"><Sparkles className="case-detail__inline-icon" />Hire Counsel</p>
                <h2>Choose a verified lawyer after reviewing your case guidance</h2>
                <p>This case is still open. Use the AI checklist, likely forum, risks, and evidence guidance above before selecting counsel.</p>
              </div>
              <button type="button" onClick={loadRecommendedLawyers} disabled={loadingLawyers} className="case-detail__primary-button case-detail__primary-button--dark">
                {loadingLawyers ? 'Finding Lawyers...' : recommendedLawyers.length ? 'Refresh Lawyers' : 'Find Verified Lawyers'}
              </button>
            </div>

            {recommendationMeta?.recommendationContext ? (
              <div className="case-detail__context-box">
                <div>
                  <p className="case-detail__context-label">Lawyer Type</p>
                  <p>{recommendationMeta.recommendationContext.lawyerTypeNeeded || 'Not available yet.'}</p>
                </div>
                <div>
                  <p className="case-detail__context-label">Likely Forum</p>
                  <p>{recommendationMeta.recommendationContext.forum || 'Not available yet.'}</p>
                </div>
              </div>
            ) : null}

            {recommendedLawyers.length ? (
              <div className="case-detail__stack">
                {recommendedLawyers.map((lawyer) => (
                  <LawyerCard key={lawyer._id} lawyer={lawyer} action={<RecommendationAction lawyer={lawyer} onHire={() => setSelectedLawyer(lawyer)} />} />
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {canLawyerManageStatus || canCloseCase ? (
          <section className="case-detail__panel">
            <div className="case-detail__panel-head">
              <div>
                <p className="case-detail__eyebrow case-detail__eyebrow--amber"><Sparkles className="case-detail__inline-icon" />Workflow</p>
                <h2>Case Actions</h2>
                <p>{user?.role === 'lawyer' ? 'Move the case through progress, resolve it, or close it after completion.' : 'Close the case when your request is cancelled or the matter is fully completed.'}</p>
              </div>
              <span className={`case-detail__status-pill ${STATUS_STYLES[caseData.status] || 'bg-slate-100 text-slate-700'}`}>{caseData.status}</span>
            </div>

            <div className="case-detail__workflow-body">
              {canLawyerManageStatus ? (
                <div className="case-detail__workflow-grid">
                  <div className="case-detail__workflow-form">
                    <div className="case-detail__field">
                      <label>Status</label>
                      <select value={statusForm.status} onChange={(event) => setStatusForm((current) => ({ ...current, status: event.target.value }))}>
                        <option value="assigned">Assigned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                    <div className="case-detail__field">
                      <label>Outcome</label>
                      <select value={statusForm.outcome} onChange={(event) => setStatusForm((current) => ({ ...current, outcome: event.target.value }))} disabled={statusForm.status !== 'resolved'}>
                        <option value="">Select outcome</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                        <option value="settled">Settled</option>
                      </select>
                    </div>
                  </div>
                  <button type="button" onClick={updateCaseStatus} disabled={savingStatus} className="case-detail__primary-button case-detail__primary-button--dark">
                    {savingStatus ? 'Saving...' : 'Update Status'}
                  </button>
                </div>
              ) : null}

              {canCloseCase ? (
                <div className={`case-detail__close-box ${canLawyerManageStatus ? 'case-detail__close-box--spaced' : ''}`}>
                  <div>
                    <p className="case-detail__close-title">End this case</p>
                    <p className="case-detail__close-copy">{caseData.status === 'open' ? 'Close the request if you no longer need help on this matter.' : 'Close the case to mark it fully completed and archived.'}</p>
                  </div>
                  <button type="button" onClick={closeCase} disabled={closingCase} className="case-detail__primary-button case-detail__primary-button--neutral">
                    {closingCase ? 'Closing...' : 'Close Case'}
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {caseData.assignedLawyer ? (
          <section className="case-detail__assigned">
            <h2>{user?.role === 'lawyer' ? 'Client Details' : 'Assigned Lawyer'}</h2>
            {user?.role === 'lawyer' ? (
              <div className="case-detail__client-card">
                <div className="case-detail__client-grid">
                  <div><p>Client Name</p><strong>{caseData.userId?.name || 'Unavailable'}</strong></div>
                  <div><p>Location</p><strong>{caseData.userId?.location || 'Unavailable'}</strong></div>
                  <div className="case-detail__contact-tile"><Phone className="case-detail__inline-icon" />{caseData.userId?.phone || 'Phone unavailable'}</div>
                </div>
              </div>
            ) : (
              <LawyerCard lawyer={caseData.assignedLawyer} showContact action={<div className="case-detail__assigned-action"><p><Mail className="case-detail__inline-icon" />{caseData.assignedLawyer.email || 'Email unavailable'}</p><p><Phone className="case-detail__inline-icon" />{caseData.assignedLawyer.phone || 'Phone unavailable'}</p></div>} />
            )}
          </section>
        ) : null}

        {canRate ? (
          <section className="case-detail__panel">
            <h2>Rate Your Lawyer</h2>
            <div className="case-detail__rating-row">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                return <button key={value} type="button" onClick={() => setRating(value)} className="case-detail__star-button"><Star className={`h-8 w-8 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>;
              })}
            </div>
            <div className="case-detail__field case-detail__field--spaced">
              <label>Review</label>
              <textarea rows="4" value={review} onChange={(event) => setReview(event.target.value)} />
            </div>
            <button type="button" onClick={submitRating} disabled={submitting} className="case-detail__primary-button">
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </section>
        ) : null}
      </main>

      {selectedLawyer ? (
        <PaymentCheckout
          caseId={caseData._id}
          lawyerId={selectedLawyer._id}
          lawyerName={selectedLawyer.name}
          lawyerFee={selectedLawyer.averageFixedFee || 0}
          onSuccess={handlePaymentSuccess}
          onClose={() => setSelectedLawyer(null)}
        />
      ) : null}
    </div>
  );
}
