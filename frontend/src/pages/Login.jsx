import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [role, setRole] = useState('user');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { ...formData, role });
      login(data.user || data.lawyer, data.token);
      toast.success('Logged in successfully');
      navigate(role === 'lawyer' ? '/lawyer/dashboard' : '/user/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#dbeafe,transparent_35%),linear-gradient(135deg,#f8fafc,#eef2ff_50%,#ecfeff)] px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-slate-300/40 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-4">
            <p className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]">AI Lawyer</p>
            <h1 className="text-4xl font-semibold leading-tight">Legal guidance, case intake, and lawyer coordination in one place.</h1>
            <p className="max-w-md text-sm leading-7 text-slate-300">
              Sign in as a client to submit a case with AI-generated analysis, or as a lawyer to manage active matters and discover new work aligned with your specialization.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <h2 className="text-3xl font-semibold text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Choose your portal and continue where you left off.</p>

            <div className="mt-8 inline-flex rounded-full bg-slate-100 p-1">
              {['user', 'lawyer'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRole(item)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${
                    role === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-2xl border-slate-200" required />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full rounded-2xl border-slate-200" required />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                  role === 'lawyer' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-blue-600 hover:bg-blue-700'
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {loading ? 'Signing in...' : `Sign in as ${role}`}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500">
              Need an account?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
