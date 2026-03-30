import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import Navbar from '../components/Navbar';
import CaseCard from '../components/CaseCard';

export default function ActiveCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState({});

  const loadCases = async () => {
    try {
      const { data } = await api.get('/lawyers/active-cases');
      setCases(data.cases);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load active cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleUpdate = async (caseId) => {
    const current = updates[caseId] || {};

    try {
      await api.post(`/cases/${caseId}/update-status`, {
        status: current.status || 'in-progress',
        outcome: current.outcome,
      });
      toast.success('Case updated successfully');
      await loadCases();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update case');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] bg-white p-8 shadow-md shadow-slate-200/60">
          <h1 className="text-3xl font-semibold text-slate-900">My Active Cases</h1>
          <p className="mt-3 text-sm text-slate-500">Update progress, resolve matters, and keep your client work moving.</p>
        </section>

        <section className="mt-8 space-y-5">
          {loading ? (
            <div className="rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-md shadow-slate-200/60">Loading active cases...</div>
          ) : cases.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-md shadow-slate-200/60">You do not have any active cases right now.</div>
          ) : (
            cases.map((caseItem) => {
              const currentUpdate = updates[caseItem._id] || {};
              const selectedStatus = currentUpdate.status || 'in-progress';

              return (
                <CaseCard key={caseItem._id} caseItem={caseItem} showSummary>
                  <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-700">
                      <p><span className="font-semibold text-slate-900">Client:</span> {caseItem.userId?.name}</p>
                      <p><span className="font-semibold text-slate-900">Phone:</span> {caseItem.userId?.phone || 'Unavailable'}</p>
                      <p><span className="font-semibold text-slate-900">Accepted:</span> {new Date(caseItem.updatedAt).toLocaleDateString()}</p>
                      <p><span className="font-semibold text-slate-900">Description:</span> {caseItem.description}</p>
                    </div>
                    <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Update Status</label>
                        <select
                          value={selectedStatus}
                          onChange={(event) => setUpdates((current) => ({ ...current, [caseItem._id]: { ...current[caseItem._id], status: event.target.value } }))}
                          className="w-full rounded-2xl border-slate-200"
                        >
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                      {selectedStatus === 'resolved' ? (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Outcome</label>
                          <select
                            value={currentUpdate.outcome || ''}
                            onChange={(event) => setUpdates((current) => ({ ...current, [caseItem._id]: { ...current[caseItem._id], outcome: event.target.value } }))}
                            className="w-full rounded-2xl border-slate-200"
                          >
                            <option value="">Select outcome</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                            <option value="settled">Settled</option>
                          </select>
                        </div>
                      ) : null}
                      <button type="button" onClick={() => handleUpdate(caseItem._id)} className="w-full rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700">
                        Submit Update
                      </button>
                    </div>
                  </div>
                </CaseCard>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
