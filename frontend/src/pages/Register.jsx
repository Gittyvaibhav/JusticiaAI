import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { CASE_TYPES, CASE_TYPE_LABELS } from '../constants';

const emptyUser = {
  name: '',
  email: '',
  password: '',
  phone: '',
  location: '',
};

const emptyLawyer = {
  ...emptyUser,
  barCouncilId: '',
  specializations: [],
  experience: '',
  bio: '',
};

export default function Register() {
  const [role, setRole] = useState('user');
  const [userForm, setUserForm] = useState(emptyUser);
  const [lawyerForm, setLawyerForm] = useState(emptyLawyer);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const activeForm = useMemo(() => (role === 'user' ? userForm : lawyerForm), [role, userForm, lawyerForm]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const setter = role === 'user' ? setUserForm : setLawyerForm;
    setter((current) => ({ ...current, [name]: value }));
  };

  const toggleSpecialization = (value) => {
    setLawyerForm((current) => ({
      ...current,
      specializations: current.specializations.includes(value)
        ? current.specializations.filter((item) => item !== value)
        : [...current.specializations, value],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const endpoint = role === 'user' ? '/auth/register/user' : '/auth/register/lawyer';
      const payload = role === 'user' ? userForm : lawyerForm;
      const { data } = await api.post(endpoint, payload);
      login(data.user || data.lawyer, data.token);
      toast.success('Account created successfully');
      navigate(role === 'lawyer' ? '/lawyer/dashboard' : '/user/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#f8fafc_0%,#e0f2fe_38%,#ecfeff_100%)] px-4 py-10">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-slate-300/40">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-gradient-to-br from-teal-700 via-slate-900 to-slate-950 p-8 text-white sm:p-10">
            <p className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]">New Account</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">Start with AI-assisted case management built for India.</h1>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mx-auto max-w-2xl">
              <div className="inline-flex rounded-full bg-slate-100 p-1">
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

              <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
                  <input name="name" value={activeForm.name} onChange={handleChange} className="w-full rounded-2xl border-slate-200" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <input type="email" name="email" value={activeForm.email} onChange={handleChange} className="w-full rounded-2xl border-slate-200" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                  <input type="password" name="password" value={activeForm.password} onChange={handleChange} className="w-full rounded-2xl border-slate-200" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Phone Number</label>
                  <input name="phone" value={activeForm.phone} onChange={handleChange} className="w-full rounded-2xl border-slate-200" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">City / Location</label>
                  <input name="location" value={activeForm.location} onChange={handleChange} className="w-full rounded-2xl border-slate-200" />
                </div>

                {role === 'lawyer' ? (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Bar Council ID</label>
                      <input name="barCouncilId" value={lawyerForm.barCouncilId} onChange={handleChange} className="w-full rounded-2xl border-slate-200" required />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Years of Experience</label>
                      <input type="number" min="0" name="experience" value={lawyerForm.experience} onChange={handleChange} className="w-full rounded-2xl border-slate-200" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-3 block text-sm font-medium text-slate-700">Specializations</label>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {CASE_TYPES.map((type) => (
                          <label key={type} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={lawyerForm.specializations.includes(type)}
                              onChange={() => toggleSpecialization(type)}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            {CASE_TYPE_LABELS[type]}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">Bio / About</label>
                      <textarea rows="4" name="bio" value={lawyerForm.bio} onChange={handleChange} className="w-full rounded-2xl border-slate-200" />
                    </div>
                  </>
                ) : null}

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                      role === 'lawyer' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-blue-600 hover:bg-blue-700'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {loading ? 'Creating account...' : `Create ${role} account`}
                  </button>
                </div>
              </form>

              <p className="mt-6 text-sm text-slate-500">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
