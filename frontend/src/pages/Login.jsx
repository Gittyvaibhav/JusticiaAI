import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

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
    <div className="auth-page auth-page--login">
      <div className="auth-page__shell auth-page__shell--wide">
        <div className="auth-page__hero auth-page__hero--dark">
          <div className="auth-page__hero-copy">
            <p className="auth-page__pill">JusticiaAI</p>
            <h1>Understand your case, learn the right steps, and connect with the right lawyer.</h1>
            <p>
              Sign in as a client to review AI-generated case guidance, legal procedure insights, and lawyer recommendations, or sign in as counsel to respond to AI-qualified matters and manage active work.
            </p>
          </div>
        </div>

        <div className="auth-page__form-wrap">
          <div className="auth-page__form-shell">
            <h2>Welcome back</h2>
            <p className="auth-page__copy">Choose your portal and continue with your case guidance or legal work.</p>

            <div className="auth-page__toggle">
              {['user', 'lawyer'].map((item) => (
                <button key={item} type="button" onClick={() => setRole(item)} className={`auth-page__toggle-button ${role === item ? 'auth-page__toggle-button--active' : ''}`}>
                  {item}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="auth-page__form">
              <div className="auth-page__field">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="auth-page__field">
                <label>Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required />
              </div>
              <button type="submit" disabled={loading} className={`auth-page__submit ${role === 'lawyer' ? 'auth-page__submit--lawyer' : 'auth-page__submit--user'}`}>
                {loading ? 'Signing in...' : `Sign in as ${role}`}
              </button>
            </form>

            <p className="auth-page__footer-copy">
              Need an account? <Link to="/register">Create one here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
