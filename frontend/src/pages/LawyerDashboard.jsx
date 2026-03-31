import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, Medal, Scale, Star, TrendingUp } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import { CASE_TYPES, CASE_TYPE_LABELS } from '../constants';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, icon: Icon, tone, iconHint }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-md shadow-slate-200/60">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tone}`} title={iconHint} aria-label={iconHint}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function LawyerDashboard() {
  const { login, user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ bio: '', specializations: [], experience: '', location: '' });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data } = await api.get('/lawyers/dashboard');
        setDashboard(data);
        setFormData({
          bio: data.lawyer.bio || '',
          specializations: data.lawyer.specializations || [],
          experience: data.lawyer.experience || '',
          location: data.lawyer.location || '',
        });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load dashboard');
      }
    };

    loadDashboard();
  }, []);

  const updateProfile = async () => {
    try {
      const { data } = await api.put('/lawyers/profile', formData);
      setDashboard((current) => ({ ...current, lawyer: data.lawyer }));
      login({ ...user, ...data.lawyer }, localStorage.getItem('token'));
      setEditing(false);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const toggleSpecialization = (value) => {
    setFormData((current) => ({
      ...current,
      specializations: current.specializations.includes(value)
        ? current.specializations.filter((item) => item !== value)
        : [...current.specializations, value],
    }));
  };

  const lawyer = dashboard?.lawyer;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,#0f766e,#0f172a_65%,#134e4a)] px-8 py-10 text-white shadow-xl shadow-teal-300/30">
          <p className="text-sm uppercase tracking-[0.25em] text-teal-100">Lawyer Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold">Manage active matters and grow your practice pipeline.</h1>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Active Cases" value={lawyer?.activeCases?.length || 0} icon={Briefcase} tone="bg-teal-100 text-teal-700" iconHint="Briefcase icon: matters currently assigned to you" />
          <StatCard label="Total Cases Handled" value={lawyer?.casesTotal || 0} icon={Scale} tone="bg-slate-100 text-slate-700" iconHint="Scale icon: total cases you have worked on" />
          <StatCard label="Cases Won" value={lawyer?.casesWon || 0} icon={Medal} tone="bg-emerald-100 text-emerald-700" iconHint="Medal icon: matters you completed with a winning outcome" />
          <StatCard label="Win Rate" value={`${Number(lawyer?.winRate || 0).toFixed(1)}%`} icon={TrendingUp} tone="bg-blue-100 text-blue-700" iconHint="Trending icon: your success percentage across handled cases" />
          <StatCard label="Average Rating" value={Number(lawyer?.rating || 0).toFixed(1)} icon={Star} tone="bg-amber-100 text-amber-700" iconHint="Star icon: average client rating for your work" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="rounded-[32px] bg-white p-8 shadow-md shadow-slate-200/60">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Profile Summary</h2>
                <p className="text-sm text-slate-500">Keep your professional details current for better case matching.</p>
              </div>
              <button type="button" onClick={() => setEditing((value) => !value)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {editing ? (
              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Bio</label>
                  <textarea rows="4" value={formData.bio} onChange={(event) => setFormData((current) => ({ ...current, bio: event.target.value }))} className="w-full rounded-2xl border-slate-200" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Experience</label>
                    <input type="number" min="0" value={formData.experience} onChange={(event) => setFormData((current) => ({ ...current, experience: event.target.value }))} className="w-full rounded-2xl border-slate-200" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Location</label>
                    <input value={formData.location} onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))} className="w-full rounded-2xl border-slate-200" />
                  </div>
                </div>
                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">Specializations</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {CASE_TYPES.map((type) => (
                      <label key={type} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(type)}
                          onChange={() => toggleSpecialization(type)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        {CASE_TYPE_LABELS[type]}
                      </label>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={updateProfile} className="rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700">
                  Save Profile
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{lawyer?.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{lawyer?.location || 'Location not provided'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(lawyer?.specializations || []).map((item) => (
                    <span key={item} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700">
                      {CASE_TYPE_LABELS[item] || item}
                    </span>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Experience</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{lawyer?.experience || 0} years</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Bar Council ID</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{lawyer?.barCouncilId}</p>
                  </div>
                </div>
                <p className="text-sm leading-7 text-slate-600">{lawyer?.bio || 'No bio added yet.'}</p>
              </div>
            )}
          </div>

          <div className="rounded-[32px] bg-white p-8 shadow-md shadow-slate-200/60">
            <h2 className="text-2xl font-semibold text-slate-900">Recent Activity</h2>
            <div className="mt-6 space-y-5">
              {(dashboard?.recentActivity || []).length === 0 ? (
                <p className="text-sm text-slate-500">No case activity yet.</p>
              ) : (
                dashboard.recentActivity.map((item) => (
                  <div key={item._id} className="relative pl-6">
                    <div className="absolute left-0 top-2 h-3 w-3 rounded-full bg-teal-500" />
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">
                      {item.caseType} case moved to {item.status}
                      {item.outcome && item.outcome !== 'pending' ? ` (${item.outcome})` : ''}
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{new Date(item.updatedAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link to="/lawyer/available-cases" className="rounded-2xl bg-teal-600 px-5 py-4 text-center text-sm font-semibold text-white hover:bg-teal-700">View Available Cases</Link>
              <Link to="/lawyer/active-cases" className="rounded-2xl border border-slate-200 px-5 py-4 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">My Active Cases</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
