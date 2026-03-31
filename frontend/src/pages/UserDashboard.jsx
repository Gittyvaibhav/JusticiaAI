import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, FolderOpen, Gavel, TimerReset } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import CaseCard from '../components/CaseCard';
import { getSocket } from '../socket';
import './UserDashboard.css';

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

export default function UserDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCases = async () => {
      try {
        const { data } = await api.get('/cases/my-cases');
        setCases(data.cases);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load cases');
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      return undefined;
    }

    const handleCaseUpdated = () => {
      api.get('/cases/my-cases')
        .then(({ data }) => setCases(data.cases))
        .catch((error) => toast.error(error.response?.data?.message || 'Failed to refresh cases'));
    };

    socket.on('case:updated', handleCaseUpdated);
    return () => socket.off('case:updated', handleCaseUpdated);
  }, []);

  const stats = useMemo(() => {
    const resolved = cases.filter((item) => item.status === 'resolved').length;
    const inProgress = cases.filter((item) => ['assigned', 'in-progress'].includes(item.status)).length;
    const open = cases.filter((item) => item.status === 'open').length;
    return { total: cases.length, resolved, inProgress, open };
  }, [cases]);

  return (
    <div className="dashboard-page dashboard-page--user">
      <Navbar />
      <main className="dashboard-page__main">
        <section className="dashboard-page__hero dashboard-page__hero--user">
          <p className="dashboard-page__eyebrow">User Dashboard</p>
          <h1>Track your case guidance, lawyer coordination, and legal progress in one place.</h1>
          <Link to="/user/submit-case" className="dashboard-page__hero-link">Start New Case Analysis</Link>
        </section>

        <section className="dashboard-page__stats dashboard-page__stats--four">
          <StatCard label="Total Cases Submitted" value={stats.total} icon={FileText} tone="bg-blue-100 text-blue-700" iconHint="File icon: total legal matters you have submitted" />
          <StatCard label="Cases Resolved" value={stats.resolved} icon={Gavel} tone="bg-green-100 text-green-700" iconHint="Gavel icon: cases that have reached a final resolution" />
          <StatCard label="Cases In Progress" value={stats.inProgress} icon={TimerReset} tone="bg-orange-100 text-orange-700" iconHint="Progress timer icon: cases currently assigned or actively moving" />
          <StatCard label="Cases Open" value={stats.open} icon={FolderOpen} tone="bg-sky-100 text-sky-700" iconHint="Open folder icon: cases still waiting to be taken up" />
        </section>

        <section className="dashboard-page__section">
          <div className="dashboard-page__section-head">
            <h2>Recent Cases</h2>
            <p>Your recent case analyses, lawyer recommendations, and active matters.</p>
          </div>
          <div className="dashboard-page__stack">
            {loading ? <div className="dashboard-page__empty">Loading your cases...</div> : null}
            {!loading && cases.length === 0 ? <div className="dashboard-page__empty">No cases submitted yet.</div> : null}
            {!loading && cases.length > 0 ? cases.slice(0, 5).map((caseItem) => <CaseCard key={caseItem._id} caseItem={caseItem} detailPath={`/user/case/${caseItem._id}`} />) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
