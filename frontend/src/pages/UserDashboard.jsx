import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, FolderOpen, Gavel, TimerReset } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import CaseCard from '../components/CaseCard';
import { getSocket } from '../socket';

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
        .catch((error) => {
          toast.error(error.response?.data?.message || 'Failed to refresh cases');
        });
    };

    socket.on('case:updated', handleCaseUpdated);

    return () => {
      socket.off('case:updated', handleCaseUpdated);
    };
  }, []);

  const stats = useMemo(() => {
    const resolved = cases.filter((item) => item.status === 'resolved').length;
    const inProgress = cases.filter((item) => ['assigned', 'in-progress'].includes(item.status)).length;
    const open = cases.filter((item) => item.status === 'open').length;

    return { total: cases.length, resolved, inProgress, open };
  }, [cases]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,#1d4ed8,#0f172a_65%,#0f766e)] px-8 py-10 text-white shadow-xl shadow-blue-300/30">
          <p className="text-sm uppercase tracking-[0.25em] text-blue-100">User Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold">Track your legal matters in one place.</h1>
          <Link to="/user/submit-case" className="mt-8 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
            Submit New Case
          </Link>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Cases Submitted" value={stats.total} icon={FileText} tone="bg-blue-100 text-blue-700" iconHint="File icon: total legal matters you have submitted" />
          <StatCard label="Cases Resolved" value={stats.resolved} icon={Gavel} tone="bg-green-100 text-green-700" iconHint="Gavel icon: cases that have reached a final resolution" />
          <StatCard label="Cases In Progress" value={stats.inProgress} icon={TimerReset} tone="bg-orange-100 text-orange-700" iconHint="Progress timer icon: cases currently assigned or actively moving" />
          <StatCard label="Cases Open" value={stats.open} icon={FolderOpen} tone="bg-sky-100 text-sky-700" iconHint="Open folder icon: cases still waiting to be taken up" />
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-slate-900">Recent Cases</h2>
            <p className="text-sm text-slate-500">Your five most recent submissions.</p>
          </div>

          <div className="space-y-5">
            {loading ? (
              <div className="rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-md shadow-slate-200/60">Loading your cases...</div>
            ) : cases.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-md shadow-slate-200/60">No cases submitted yet.</div>
            ) : (
              cases.slice(0, 5).map((caseItem) => (
                <CaseCard key={caseItem._id} caseItem={caseItem} detailPath={`/user/case/${caseItem._id}`} />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
