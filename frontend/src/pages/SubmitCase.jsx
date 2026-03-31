import { useState } from 'react';
import toast from 'react-hot-toast';
import { Crosshair, Loader2, MapPinned, ShieldAlert, Sparkles } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import LawyerCard from '../components/LawyerCard';
import PaymentCheckout from '../components/PaymentCheckout';
import { CASE_TYPES, CASE_TYPE_LABELS, STRENGTH_STYLES, URGENCY_LEVELS } from '../constants';
import './SubmitCase.css';

const initialForm = {
  title: '',
  caseType: 'criminal',
  urgency: 'medium',
  location: '',
  description: '',
  documents: [],
};

function AdviceCard({ title, children }) {
  return (
    <div className="submit-case__card submit-case__card--guidance">
      <h3 className="submit-case__card-title">{title}</h3>
      <div className="submit-case__card-copy">{children || 'Not available yet.'}</div>
    </div>
  );
}

function RecommendationAction({ lawyer, onHire }) {
  return (
    <div className="submit-case__recommendation-action">
      {lawyer.recommendationSummary ? <p>{lawyer.recommendationSummary}</p> : null}
      {lawyer.recommendationReasons?.length ? (
        <ul className="submit-case__reason-list">
          {lawyer.recommendationReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      <button type="button" onClick={onHire} className="submit-case__primary-button submit-case__primary-button--dark">
        Hire And Pay
      </button>
    </div>
  );
}

export default function SubmitCase() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submittedCase, setSubmittedCase] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [registeredLawyers, setRegisteredLawyers] = useState([]);
  const [publicLawyers, setPublicLawyers] = useState([]);
  const [discoveryMeta, setDiscoveryMeta] = useState(null);
  const [verifiedSection, setVerifiedSection] = useState(null);
  const [publicSection, setPublicSection] = useState(null);
  const [findingLawyers, setFindingLawyers] = useState(false);
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    setFormData((current) => ({ ...current, documents: Array.from(event.target.files || []) }));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationCoords({ latitude: coords.latitude, longitude: coords.longitude });
        setFormData((current) => ({
          ...current,
          location: current.location || `Lat ${coords.latitude.toFixed(4)}, Lng ${coords.longitude.toFixed(4)}`,
        }));
        setLocationLoading(false);
        toast.success('Current location captured');
      },
      () => {
        setLocationLoading(false);
        toast.error('Could not access your current location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitCase = async () => {
    if (formData.description.trim().length < 100) {
      toast.error('Please describe your problem in at least 100 characters');
      return;
    }

    setStep(3);
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('caseType', formData.caseType);
      payload.append('urgency', formData.urgency);
      payload.append('location', formData.location);
      payload.append('description', formData.description);
      formData.documents.forEach((file) => payload.append('documents', file));

      const { data } = await api.post('/cases/submit', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmittedCase(data.case);
      setAdvice(data.advice);
      toast.success('Case submitted and analyzed successfully');
    } catch (error) {
      const backendMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to submit case';
      console.error('Case submission failed:', error.response?.data || error);
      toast.error(backendMessage);
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  const findMatchingLawyers = async () => {
    if (!submittedCase?._id) {
      return;
    }

    setFindingLawyers(true);

    try {
      const query = new URLSearchParams();
      if (locationCoords?.latitude && locationCoords?.longitude) {
        query.set('latitude', locationCoords.latitude);
        query.set('longitude', locationCoords.longitude);
      }

      const suffix = query.toString() ? `?${query.toString()}` : '';
      const { data } = await api.get(`/lawyers/discover/${submittedCase._id}${suffix}`);

      setRegisteredLawyers(data.registeredLawyers || []);
      setPublicLawyers(data.publicLawyers || []);
      setDiscoveryMeta(data.meta || null);
      setVerifiedSection(data.verifiedSection || null);
      setPublicSection(data.publicSection || null);

      if (!data.registeredLawyers?.length && !data.publicLawyers?.length) {
        toast('No lawyer matches found yet.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load lawyer discovery');
    } finally {
      setFindingLawyers(false);
    }
  };

  const handlePaymentSuccess = ({ case: assignedCase }) => {
    if (assignedCase) {
      setSubmittedCase(assignedCase);
    }

    setSelectedLawyer(null);
  };

  return (
    <div className="submit-case">
      <Navbar />
      <main className="submit-case__main">
        <section className="submit-case__hero">
          <div className="submit-case__steps">
            {[1, 2, 3].map((item) => (
              <div key={item} className={`submit-case__step ${step === item ? 'submit-case__step--active' : step > item ? 'submit-case__step--done' : ''}`}>
                Step {item}
              </div>
            ))}
          </div>
          <h1 className="submit-case__hero-title">Submit your case for AI legal guidance</h1>
          <p className="submit-case__hero-copy">Get a clearer summary of what your issue means, what procedure likely comes next, what evidence to prepare, and which verified lawyers fit the matter best.</p>
        </section>

        {step === 1 ? (
          <section className="submit-case__panel">
            <h2 className="submit-case__section-title">Step 1: Share your case details</h2>
            <div className="submit-case__form-grid">
              <div className="submit-case__field submit-case__field--full">
                <label>Case Title</label>
                <input name="title" value={formData.title} onChange={handleChange} required />
              </div>
              <div className="submit-case__field">
                <label>Case Type</label>
                <select name="caseType" value={formData.caseType} onChange={handleChange}>
                  {CASE_TYPES.map((type) => <option key={type} value={type}>{CASE_TYPE_LABELS[type]}</option>)}
                </select>
              </div>
              <div className="submit-case__field">
                <label>Location</label>
                <input name="location" value={formData.location} onChange={handleChange} required />
              </div>
              <div className="submit-case__location-row submit-case__field--full">
                <button type="button" onClick={useCurrentLocation} disabled={locationLoading} className="submit-case__secondary-button">
                  <Crosshair className="submit-case__inline-icon" />
                  {locationLoading ? 'Detecting location...' : 'Use My Current Location'}
                </button>
                {locationCoords ? (
                  <div className="submit-case__status-pill">
                    <MapPinned className="submit-case__inline-icon" />
                    Precise coordinates captured for nearby lawyer discovery
                  </div>
                ) : null}
              </div>
              <div className="submit-case__field submit-case__field--full">
                <label>Urgency Level</label>
                <div className="submit-case__radio-row">
                  {URGENCY_LEVELS.map((value) => (
                    <label key={value} className="submit-case__radio-option">
                      <input type="radio" name="urgency" value={value} checked={formData.urgency === value} onChange={handleChange} />
                      {value}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="submit-case__actions">
              <button
                type="button"
                onClick={() => {
                  if (!formData.title || !formData.location) {
                    toast.error('Please complete the required fields');
                    return;
                  }
                  setStep(2);
                }}
                className="submit-case__primary-button"
              >
                Continue
              </button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="submit-case__panel">
            <h2 className="submit-case__section-title">Step 2: Describe what happened</h2>
            <div className="submit-case__stack">
              <div className="submit-case__field">
                <label>Describe your case in detail</label>
                <textarea rows="10" name="description" value={formData.description} onChange={handleChange} required />
                <p className={`submit-case__helper ${formData.description.length < 100 ? 'submit-case__helper--error' : 'submit-case__helper--success'}`}>
                  {formData.description.length}/100 minimum characters
                </p>
              </div>
              <div className="submit-case__field">
                <label>Document Upload (optional)</label>
                <input type="file" multiple accept=".pdf,image/*" onChange={handleFileChange} className="submit-case__file-input" />
              </div>
            </div>
            <div className="submit-case__actions submit-case__actions--split">
              <button type="button" onClick={() => setStep(1)} className="submit-case__secondary-button">Back</button>
              <button type="button" onClick={submitCase} className="submit-case__primary-button">Submit and Analyze</button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="submit-case__results">
            {submitting ? (
              <div className="submit-case__loading-card">
                <Loader2 className="submit-case__loading-icon" />
                <h2>AI is analyzing your case and preparing next steps...</h2>
              </div>
            ) : (
              <>
                <div className="submit-case__guidance-grid">
                  <AdviceCard title="Case Summary">{advice?.caseSummary}</AdviceCard>
                  <AdviceCard title="Relevant Laws and Sections">{advice?.relevantLaws}</AdviceCard>
                  <AdviceCard title="Immediate Next Steps">{advice?.nextSteps}</AdviceCard>
                  <AdviceCard title="Procedural Checklist">{advice?.proceduralChecklist}</AdviceCard>
                  <AdviceCard title="Documents and Evidence to Gather">{advice?.documentsNeeded}</AdviceCard>
                  <AdviceCard title="Likely Forum or Authority">{advice?.likelyForum}</AdviceCard>
                  <AdviceCard title="Expected Timeline">{advice?.expectedTimeline}</AdviceCard>
                  <AdviceCard title="Key Risks or Weaknesses">{advice?.keyRisks}</AdviceCard>
                  <AdviceCard title="Lawyer Type Needed">{advice?.lawyerTypeNeeded}</AdviceCard>
                  <AdviceCard title="How to Choose the Right Lawyer">{advice?.lawyerFitRationale}</AdviceCard>
                </div>

                <div className="submit-case__card submit-case__card--strength">
                  <div className="submit-case__strength-row">
                    <div className="submit-case__strength-icon-wrap">
                      <Sparkles className="submit-case__strength-icon" />
                    </div>
                    <div>
                      <p className="submit-case__strength-label">Case Strength</p>
                      <div className="submit-case__strength-content">
                        <span className={`submit-case__strength-pill ${STRENGTH_STYLES[advice?.caseStrength] || 'bg-slate-100 text-slate-700'}`}>
                          {advice?.caseStrength}
                        </span>
                        <span className="submit-case__strength-copy">{advice?.caseStrengthExplanation}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="submit-case__disclaimer">
                  <p>
                    <ShieldAlert className="submit-case__inline-icon submit-case__inline-icon--top" />
                    This is AI-generated legal information to help you understand likely procedure, evidence needs, and lawyer fit. It is not a substitute for professional legal advice or a guaranteed legal outcome.
                  </p>
                </div>

                <button type="button" onClick={findMatchingLawyers} disabled={findingLawyers} className="submit-case__primary-button">
                  {findingLawyers ? 'Finding Lawyers...' : 'Find Recommended Lawyers'}
                </button>

                {discoveryMeta?.recommendationContext ? (
                  <div className="submit-case__card submit-case__card--context">
                    <h2 className="submit-case__section-title">How recommendations are being ranked</h2>
                    <div className="submit-case__context-grid">
                      <div>
                        <p className="submit-case__context-label">Lawyer Type</p>
                        <p>{discoveryMeta.recommendationContext.lawyerTypeNeeded || 'Not available yet.'}</p>
                      </div>
                      <div>
                        <p className="submit-case__context-label">Likely Forum</p>
                        <p>{discoveryMeta.recommendationContext.forum || 'Not available yet.'}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {verifiedSection ? (
                  <div className="submit-case__section-copy-block">
                    <h2 className="submit-case__section-title">{verifiedSection.title}</h2>
                    <p className="submit-case__section-copy">{verifiedSection.description}</p>
                  </div>
                ) : null}

                {registeredLawyers.length > 0 ? (
                  <div className="submit-case__stack submit-case__stack--large">
                    {registeredLawyers.map((lawyer) => (
                      <LawyerCard
                        key={lawyer._id}
                        lawyer={lawyer}
                        action={<RecommendationAction lawyer={lawyer} onHire={() => setSelectedLawyer(lawyer)} />}
                      />
                    ))}
                  </div>
                ) : null}

                {discoveryMeta?.publicSearchMessage ? (
                  <div className="submit-case__public-note">{discoveryMeta.publicSearchMessage}</div>
                ) : null}

                {publicSection ? (
                  <div className="submit-case__section-copy-block">
                    <h2 className="submit-case__section-title">{publicSection.title}</h2>
                    <p className="submit-case__section-copy">{publicSection.description}</p>
                  </div>
                ) : null}

                {publicLawyers.length > 0 ? (
                  <div className="submit-case__stack submit-case__stack--large">
                    {publicLawyers.map((lawyer) => (
                      <LawyerCard
                        key={lawyer.id}
                        lawyer={lawyer}
                        showContact
                        action={<div className="submit-case__public-action">Review public details carefully before contacting. Platform verification and in-app support do not apply here.</div>}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : null}
      </main>

      {selectedLawyer && submittedCase?._id ? (
        <PaymentCheckout
          caseId={submittedCase._id}
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
