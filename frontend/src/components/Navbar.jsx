import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Briefcase, Gavel, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useState } from 'react';

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
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

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
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to={role === 'lawyer' ? '/lawyer/dashboard' : '/user/dashboard'} className="flex items-center gap-3">
          <div className={`rounded-2xl border border-white/70 p-2.5 shadow-lg shadow-slate-200/60 ${role === 'lawyer' ? 'bg-[linear-gradient(135deg,#ccfbf1,#99f6e4)] text-teal-800' : 'bg-[linear-gradient(135deg,#dbeafe,#bfdbfe)] text-blue-800'}`}>
            {role === 'lawyer' ? <Gavel className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">JusticiaAI</p>
            <p className="text-base font-semibold text-slate-900">{role === 'lawyer' ? 'Counsel Workspace' : 'Client Command Center'}</p>
          </div>
        </Link>

        <nav className="order-3 flex w-full items-center gap-2 overflow-x-auto rounded-full border border-white/70 bg-white/70 p-1.5 shadow-sm shadow-slate-200/50 md:order-none md:w-auto">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications((value) => !value);
                markAllAsRead();
              }}
              className="relative inline-flex items-center justify-center rounded-full border border-white/70 bg-white/80 p-2.5 text-slate-700 shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            {showNotifications ? (
              <div className="absolute right-0 top-14 z-20 w-[340px] overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-2xl shadow-slate-300/40">
                <div className="bg-[linear-gradient(135deg,#0f172a,#1e293b_58%,#0f766e)] px-5 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Notifications</p>
                      <p className="text-xs text-slate-300">Live case alerts</p>
                    </div>
                    <div className="rounded-full bg-white/10 p-2">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {notifications.length ? (
                    <div className="mb-3 flex justify-end">
                      <button type="button" onClick={markAllAsRead} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Mark all read
                      </button>
                    </div>
                  ) : null}

                  <div className="max-h-96 space-y-3 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">No notifications yet.</div>
                  ) : (
                    notifications.map((item) => (
                      <Link
                        key={item.id}
                        to={item.href}
                        onClick={() => {
                          markAsRead(item.id);
                          setShowNotifications(false);
                        }}
                        className={`block rounded-3xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${item.read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-[linear-gradient(135deg,rgba(219,234,254,0.55),rgba(255,255,255,0.95))]'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
                          </div>
                          {!item.read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" /> : null}
                        </div>
                        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                      </Link>
                    ))
                  )}
                </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{role === 'lawyer' ? 'Counsel' : 'Client'}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
