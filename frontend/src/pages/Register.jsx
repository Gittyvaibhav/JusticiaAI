import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { CASE_TYPES, CASE_TYPE_LABELS } from '../constants';
import './Register.css';

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
    <div className="auth-page auth-page--register">
      <div className="auth-page__shell auth-page__shell--wide">
        <div className="auth-page__hero auth-page__hero--gradient">
          <div className="auth-page__hero-copy">
            <p className="auth-page__pill">New Account</p>
            <h1>Start with AI-assisted case guidance built for Indian legal workflows.</h1>
            <p>
              Clients begin by understanding their case, likely procedure, and next steps. Lawyers join to support those guided matters with trusted professional help inside one workflow.
            </p>
          </div>
        </div>

        <div className="auth-page__form-wrap">
          <div className="auth-page__form-shell auth-page__form-shell--wide">
            <div className="auth-page__toggle">
              {['user', 'lawyer'].map((item) => (
                <button key={item} type="button" onClick={() => setRole(item)} className={`auth-page__toggle-button ${role === item ? 'auth-page__toggle-button--active' : ''}`}>
                  {item}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="auth-page__form auth-page__form--grid">
              <div className="auth-page__field auth-page__field--full">
                <label>Full Name</label>
                <input name="name" value={activeForm.name} onChange={handleChange} required />
              </div>
              <div className="auth-page__field">
                <label>Email</label>
                <input type="email" name="email" value={activeForm.email} onChange={handleChange} required />
              </div>
              <div className="auth-page__field">
                <label>Password</label>
                <input type="password" name="password" value={activeForm.password} onChange={handleChange} required />
              </div>
              <div className="auth-page__field">
                <label>Phone Number</label>
                <input name="phone" value={activeForm.phone} onChange={handleChange} />
              </div>
              <div className="auth-page__field">
                <label>City / Location</label>
                <input name="location" value={activeForm.location} onChange={handleChange} />
              </div>

              {role === 'lawyer' ? (
                <>
                  <div className="auth-page__field">
                    <label>Bar Council ID</label>
                    <input name="barCouncilId" value={lawyerForm.barCouncilId} onChange={handleChange} required />
                  </div>
                  <div className="auth-page__field">
                    <label>Years of Experience</label>
                    <input type="number" min="0" name="experience" value={lawyerForm.experience} onChange={handleChange} />
                  </div>
                  <div className="auth-page__field auth-page__field--full">
                    <label>Specializations</label>
                    <div className="auth-page__choice-grid">
                      {CASE_TYPES.map((type) => (
                        <label key={type} className="auth-page__choice">
                          <input type="checkbox" checked={lawyerForm.specializations.includes(type)} onChange={() => toggleSpecialization(type)} />
                          {CASE_TYPE_LABELS[type]}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="auth-page__field auth-page__field--full">
                    <label>Bio / About</label>
                    <textarea rows="4" name="bio" value={lawyerForm.bio} onChange={handleChange} />
                  </div>
                </>
              ) : null}

              <div className="auth-page__field auth-page__field--full">
                <button type="submit" disabled={loading} className={`auth-page__submit ${role === 'lawyer' ? 'auth-page__submit--lawyer' : 'auth-page__submit--user'}`}>
                  {loading ? 'Creating account...' : `Create ${role} account`}
                </button>
              </div>
            </form>

            <p className="auth-page__footer-copy">
              Already registered? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
