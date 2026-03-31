import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, Medal, Scale, Star, TrendingUp } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import { CASE_TYPES, CASE_TYPE_LABELS } from '../constants';
import { useAuth } from '../context/AuthContext';
import './LawyerDashboard.css';

function StatCard({ label, value, icon: Icon, tone, iconHint }) {
  return (
    <div className="dashboard-page__stat-card">
      <div className="dashboard-page__stat-row">
        <div>
          <p className="dashboard-page__stat-label">{label}</p>
          <p className="dashboard-page__stat-value">{value}</p>
        </div>
        <div className={`dashboard-page__stat-icon ${tone}`} title={iconHint} aria-label={iconHint}>
          <Icon className="dashboard-page__icon" />
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
    <div className="dashboard-page dashboard-page--lawyer">
      <Navbar />
      <main className="dashboard-page__main">
        <section className="dashboard-page__hero dashboard-page__hero--lawyer">
          <p className="dashboard-page__eyebrow">Lawyer Dashboard</p>
          <h1>Manage AI-qualified matters, guide clients through procedure, and keep active work moving.</h1>
        </section>

        <section className="dashboard-page__stats dashboard-page__stats--five">
          <StatCard label="Active Cases" value={lawyer?.activeCases?.length || 0} icon={Briefcase} tone="bg-teal-100 text-teal-700" iconHint="Briefcase icon: matters currently assigned to you" />
          <StatCard label="Total Cases Handled" value={lawyer?.casesTotal || 0} icon={Scale} tone="bg-slate-100 text-slate-700" iconHint="Scale icon: total cases you have worked on" />
          <StatCard label="Cases Won" value={lawyer?.casesWon || 0} icon={Medal} tone="bg-emerald-100 text-emerald-700" iconHint="Medal icon: matters you completed with a winning outcome" />
          <StatCard label="Win Rate" value={`${Number(lawyer?.winRate || 0).toFixed(1)}%`} icon={TrendingUp} tone="bg-blue-100 text-blue-700" iconHint="Trending icon: your success percentage across handled cases" />
          <StatCard label="Average Rating" value={Number(lawyer?.rating || 0).toFixed(1)} icon={Star} tone="bg-amber-100 text-amber-700" iconHint="Star icon: average client rating for your work" />
        </section>

        <section className="dashboard-page__split">
          <div className="dashboard-page__panel">
            <div className="dashboard-page__panel-head">
              <div>
                <h2>Profile Summary</h2>
                <p>Keep your professional details current so the recommendation engine can match you to the right guided matters.</p>
              </div>
              <button type="button" onClick={() => setEditing((value) => !value)} className="dashboard-page__secondary-button">{editing ? 'Cancel' : 'Edit Profile'}</button>
            </div>

            {editing ? (
              <div className="dashboard-page__stack">
                <div className="dashboard-page__field">
                  <label>Bio</label>
                  <textarea rows="4" value={formData.bio} onChange={(event) => setFormData((current) => ({ ...current, bio: event.target.value }))} />
                </div>
                <div className="dashboard-page__form-grid">
                  <div className="dashboard-page__field">
                    <label>Experience</label>
                    <input type="number" min="0" value={formData.experience} onChange={(event) => setFormData((current) => ({ ...current, experience: event.target.value }))} />
                  </div>
                  <div className="dashboard-page__field">
                    <label>Location</label>
                    <input value={formData.location} onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))} />
                  </div>
                </div>
                <div className="dashboard-page__field">
                  <label>Specializations</label>
                  <div className="dashboard-page__choice-grid">
                    {CASE_TYPES.map((type) => (
                      <label key={type} className="dashboard-page__choice">
                        <input type="checkbox" checked={formData.specializations.includes(type)} onChange={() => toggleSpecialization(type)} />
                        {CASE_TYPE_LABELS[type]}
                      </label>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={updateProfile} className="dashboard-page__primary-button">Save Profile</button>
              </div>
            ) : (
              <div className="dashboard-page__stack">
                <div>
                  <h3 className="dashboard-page__subhead">{lawyer?.name}</h3>
                  <p className="dashboard-page__copy">{lawyer?.location || 'Location not provided'}</p>
                </div>
                <div className="dashboard-page__tag-row">
                  {(lawyer?.specializations || []).map((item) => <span key={item} className="dashboard-page__tag">{CASE_TYPE_LABELS[item] || item}</span>)}
                </div>
                <div className="dashboard-page__form-grid">
                  <div className="dashboard-page__tile"><p>Experience</p><strong>{lawyer?.experience || 0} years</strong></div>
                  <div className="dashboard-page__tile"><p>Bar Council ID</p><strong>{lawyer?.barCouncilId}</strong></div>
                </div>
                <p className="dashboard-page__copy">{lawyer?.bio || 'No bio added yet.'}</p>
              </div>
            )}
          </div>

          <div className="dashboard-page__panel">
            <h2>Recent Activity</h2>
            <div className="dashboard-page__stack dashboard-page__stack--compact">
              {(dashboard?.recentActivity || []).length === 0 ? <p className="dashboard-page__copy">No case activity yet.</p> : dashboard.recentActivity.map((item) => (
                <div key={item._id} className="dashboard-page__activity-item">
                  <div className="dashboard-page__activity-dot" />
                  <div>
                    <p className="dashboard-page__activity-title">{item.title}</p>
                    <p className="dashboard-page__copy">{item.caseType} case moved to {item.status}{item.outcome && item.outcome !== 'pending' ? ` (${item.outcome})` : ''}</p>
                    <p className="dashboard-page__activity-time">{new Date(item.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="dashboard-page__link-grid">
              <Link to="/lawyer/available-cases" className="dashboard-page__primary-button dashboard-page__primary-button--link">View Available Cases</Link>
              <Link to="/lawyer/active-cases" className="dashboard-page__secondary-button dashboard-page__secondary-button--link">My Active Cases</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
