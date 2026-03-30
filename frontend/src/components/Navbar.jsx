import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, Gavel, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const links =
    role === 'lawyer'
      ? [
          { to: '/lawyer/dashboard', label: 'Dashboard' },
          { to: '/lawyer/available-cases', label: 'Available Cases' },
          { to: '/lawyer/active-cases', label: 'Active Cases' },
        ]
      : [
          { to: '/user/dashboard', label: 'Dashboard' },
          { to: '/user/submit-case', label: 'Submit Case' },
        ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to={role === 'lawyer' ? '/lawyer/dashboard' : '/user/dashboard'} className="flex items-center gap-3">
          <div className={`rounded-2xl p-2 ${role === 'lawyer' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
            {role === 'lawyer' ? <Gavel className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">AI Lawyer</p>
            <p className="text-xs text-slate-500">{role === 'lawyer' ? 'Legal Practice Hub' : 'Client Support Portal'}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
