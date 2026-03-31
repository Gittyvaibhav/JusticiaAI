import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import Navbar from '../components/Navbar';
import CaseCard from '../components/CaseCard';
import './ActiveCases.css';

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

  useEffect(() => { loadCases(); }, []);

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
    <div className="listing-page">
      <Navbar />
      <main className="listing-page__main">
        <section className="listing-page__panel">
          <h1>My Active Cases</h1>
          <p>Update progress, resolve matters, and keep your client work moving.</p>
        </section>

        <section className="listing-page__stack">
          {loading ? <div className="listing-page__empty">Loading active cases...</div> : null}
          {!loading && cases.length === 0 ? <div className="listing-page__empty">You do not have any active cases right now.</div> : null}
          {!loading && cases.length > 0 ? cases.map((caseItem) => {
            const currentUpdate = updates[caseItem._id] || {};
            const selectedStatus = currentUpdate.status || 'in-progress';

            return (
              <CaseCard key={caseItem._id} caseItem={caseItem} showSummary detailPath={`/lawyer/case/${caseItem._id}`}>
                <div className="listing-page__active-grid">
                  <div className="listing-page__detail-card">
                    <p><strong>Client:</strong> {caseItem.userId?.name}</p>
                    <p><strong>Phone:</strong> {caseItem.userId?.phone || 'Unavailable'}</p>
                    <p><strong>Accepted:</strong> {new Date(caseItem.updatedAt).toLocaleDateString()}</p>
                    <p><strong>Description:</strong> {caseItem.description}</p>
                  </div>
                  <div className="listing-page__detail-card listing-page__detail-card--form">
                    <div className="listing-page__field">
                      <label>Update Status</label>
                      <select value={selectedStatus} onChange={(event) => setUpdates((current) => ({ ...current, [caseItem._id]: { ...current[caseItem._id], status: event.target.value } }))}>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                    {selectedStatus === 'resolved' ? (
                      <div className="listing-page__field">
                        <label>Outcome</label>
                        <select value={currentUpdate.outcome || ''} onChange={(event) => setUpdates((current) => ({ ...current, [caseItem._id]: { ...current[caseItem._id], outcome: event.target.value } }))}>
                          <option value="">Select outcome</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                          <option value="settled">Settled</option>
                        </select>
                      </div>
                    ) : null}
                    <button type="button" onClick={() => handleUpdate(caseItem._id)} className="listing-page__primary-button">Submit Update</button>
                  </div>
                </div>
              </CaseCard>
            );
          }) : null}
        </section>
      </main>
    </div>
  );
}
