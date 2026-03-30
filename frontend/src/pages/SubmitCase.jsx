import { useState } from 'react';
import toast from 'react-hot-toast';
import { Crosshair, Loader2, MapPinned, ShieldAlert, Sparkles } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import LawyerCard from '../components/LawyerCard';
import { CASE_TYPES, CASE_TYPE_LABELS, STRENGTH_STYLES, URGENCY_LEVELS } from '../constants';

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
    <div className="rounded-3xl bg-white p-6 shadow-md shadow-slate-200/60">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{children}</div>
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
  const [findingLawyers, setFindingLawyers] = useState(false);
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

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
        setLocationCoords({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
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

      if (!data.registeredLawyers?.length && !data.publicLawyers?.length) {
        toast('No lawyer matches found yet.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load lawyer discovery');
    } finally {
      setFindingLawyers(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,#eff6ff,#ffffff_45%,#ecfeff)] p-8 shadow-lg shadow-slate-200/60">
          <div className="flex flex-wrap items-center gap-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  step === item ? 'bg-blue-600 text-white' : step > item ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                Step {item}
              </div>
            ))}
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-slate-900">Submit a New Legal Case</h1>
        </section>

        {step === 1 ? (
          <section className="mt-8 rounded-[32px] bg-white p-8 shadow-md shadow-slate-200/60">
            <h2 className="text-2xl font-semibold text-slate-900">Step 1: Case Details</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Case Title</label>
                <input name="title" value={formData.title} onChange={handleChange} className="w-full rounded-2xl border-slate-200" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Case Type</label>
                <select name="caseType" value={formData.caseType} onChange={handleChange} className="w-full rounded-2xl border-slate-200">
                  {CASE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CASE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Location</label>
                <input name="location" value={formData.location} onChange={handleChange} className="w-full rounded-2xl border-slate-200" required />
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locationLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Crosshair className="h-4 w-4" />
                  {locationLoading ? 'Detecting location...' : 'Use My Current Location'}
                </button>
                {locationCoords ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    <MapPinned className="h-4 w-4" />
                    Precise coordinates captured for nearby public lawyer search
                  </div>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-3 block text-sm font-medium text-slate-700">Urgency Level</label>
                <div className="flex flex-wrap gap-3">
                  {URGENCY_LEVELS.map((value) => (
                    <label key={value} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium capitalize text-slate-700">
                      <input type="radio" name="urgency" value={value} checked={formData.urgency === value} onChange={handleChange} className="border-slate-300 text-blue-600 focus:ring-blue-500" />
                      {value}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!formData.title || !formData.location) {
                    toast.error('Please complete the required fields');
                    return;
                  }
                  setStep(2);
                }}
                className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="mt-8 rounded-[32px] bg-white p-8 shadow-md shadow-slate-200/60">
            <h2 className="text-2xl font-semibold text-slate-900">Step 2: Describe Your Problem</h2>
            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Describe your problem in detail</label>
                <textarea rows="10" name="description" value={formData.description} onChange={handleChange} className="w-full rounded-3xl border-slate-200" required />
                <p className={`mt-2 text-sm ${formData.description.length < 100 ? 'text-red-500' : 'text-emerald-600'}`}>{formData.description.length}/100 minimum characters</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Document Upload (optional)</label>
                <input type="file" multiple accept=".pdf,image/*" onChange={handleFileChange} className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4" />
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Back
              </button>
              <button type="button" onClick={submitCase} className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                Submit and Analyze
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="mt-8 space-y-6">
            {submitting ? (
              <div className="rounded-[32px] bg-white px-8 py-16 text-center shadow-md shadow-slate-200/60">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
                <h2 className="mt-6 text-2xl font-semibold text-slate-900">AI is analyzing your case...</h2>
              </div>
            ) : (
              <>
                <div className="grid gap-6 lg:grid-cols-2">
                  <AdviceCard title="Case Summary">{advice?.caseSummary}</AdviceCard>
                  <AdviceCard title="Relevant Laws and Sections">{advice?.relevantLaws}</AdviceCard>
                  <AdviceCard title="Immediate Next Steps">{advice?.nextSteps}</AdviceCard>
                  <AdviceCard title="Lawyer Type Needed">{advice?.lawyerTypeNeeded}</AdviceCard>
                </div>

                <div className="rounded-[32px] bg-white p-8 shadow-md shadow-slate-200/60">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Case Strength</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className={`rounded-full px-4 py-2 text-sm font-semibold ${STRENGTH_STYLES[advice?.caseStrength] || 'bg-slate-100 text-slate-700'}`}>
                          {advice?.caseStrength}
                        </span>
                        <span className="text-sm text-slate-600">{advice?.caseStrengthExplanation}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                  <p className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 flex-none" />
                    This is AI-generated legal information for guidance only. Consult a qualified lawyer before taking any legal action.
                  </p>
                </div>

                <button type="button" onClick={findMatchingLawyers} disabled={findingLawyers} className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
                  {findingLawyers ? 'Finding Lawyers...' : 'Find Matching Lawyers Nearby'}
                </button>

                {discoveryMeta?.publicSearchMessage ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm shadow-slate-200/50">
                    {discoveryMeta.publicSearchMessage}
                  </div>
                ) : null}

                {registeredLawyers.length > 0 ? (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">Verified Platform Lawyers</h2>
                      <p className="text-sm text-slate-500">Registered lawyers inside your AI Lawyer platform, ranked by platform performance.</p>
                    </div>
                    {registeredLawyers.map((lawyer) => (
                      <LawyerCard
                        key={lawyer._id}
                        lawyer={lawyer}
                        action={<div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Contact details become visible after a lawyer accepts your case.</div>}
                      />
                    ))}
                  </div>
                ) : null}

                {publicLawyers.length > 0 ? (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">Nearby Public Lawyer Listings</h2>
                      <p className="text-sm text-slate-500">These results come from Google Maps near your typed or detected location and are not verified by your platform.</p>
                    </div>
                    {publicLawyers.map((lawyer) => (
                      <LawyerCard
                        key={lawyer.id}
                        lawyer={lawyer}
                        showContact
                        action={
                          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                            Review public details carefully before contacting. Platform verification does not apply here.
                          </div>
                        }
                      />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
