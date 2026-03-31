import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Briefcase, Gavel, LogOut, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useState } from 'react';
import './Navbar.css';

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      className={`navbar__nav-link ${active ? 'navbar__nav-link--active' : 'navbar__nav-link--inactive'}`}
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
          { to: '/lawyer/messages', label: 'Messages' },
        ]
      : [
          { to: '/user/dashboard', label: 'Dashboard' },
          { to: '/user/submit-case', label: 'Submit Case' },
          { to: '/user/messages', label: 'Messages' },
        ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar__container">
        <Link to={role === 'lawyer' ? '/lawyer/dashboard' : '/user/dashboard'} className="navbar__brand">
          <div className={`navbar__brand-icon ${role === 'lawyer' ? 'navbar__brand-icon--lawyer' : 'navbar__brand-icon--user'}`}>
            {role === 'lawyer' ? <Gavel className="navbar__brand-svg" /> : <Briefcase className="navbar__brand-svg" />}
          </div>
          <div className="navbar__brand-copy">
            <p className="navbar__brand-label">JusticiaAI</p>
            <p className="navbar__brand-title">{role === 'lawyer' ? 'Counsel Workspace' : 'Client Command Center'}</p>
          </div>
        </Link>

        <nav className="navbar__nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          <Link
            to={`/${role}/messages`}
            className="navbar__icon-button"
          >
            <MessageSquare className="navbar__icon" />
          </Link>

          <div className="navbar__notifications">
            <button
              type="button"
              onClick={() => {
                setShowNotifications((value) => !value);
                markAllAsRead();
              }}
              className="navbar__icon-button navbar__icon-button--relative"
            >
              <Bell className="navbar__icon" />
              {unreadCount > 0 ? (
                <span className="navbar__badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            {showNotifications ? (
              <div className="navbar__notifications-panel">
                <div className="navbar__notifications-header">
                  <div className="navbar__notifications-header-row">
                    <div>
                      <p className="navbar__notifications-title">Notifications</p>
                      <p className="navbar__notifications-subtitle">Live case alerts</p>
                    </div>
                    <div className="navbar__sparkle-wrap">
                      <Sparkles className="navbar__icon" />
                    </div>
                  </div>
                </div>

                <div className="navbar__notifications-body">
                  {notifications.length ? (
                    <div className="navbar__notifications-toolbar">
                      <button type="button" onClick={markAllAsRead} className="navbar__mark-read">
                        Mark all read
                      </button>
                    </div>
                  ) : null}

                  <div className="navbar__notifications-list">
                  {notifications.length === 0 ? (
                    <div className="navbar__notifications-empty">No notifications yet.</div>
                  ) : (
                    notifications.map((item) => (
                      <Link
                        key={item.id}
                        to={item.href}
                        onClick={() => {
                          markAsRead(item.id);
                          setShowNotifications(false);
                        }}
                        className={`navbar__notification-item ${item.read ? 'navbar__notification-item--read' : 'navbar__notification-item--unread'}`}
                      >
                        <div className="navbar__notification-content">
                          <div>
                            <p className="navbar__notification-title">{item.title}</p>
                            <p className="navbar__notification-message">{item.message}</p>
                          </div>
                          {!item.read ? <span className="navbar__notification-dot" /> : null}
                        </div>
                        <p className="navbar__notification-time">{new Date(item.createdAt).toLocaleString()}</p>
                      </Link>
                    ))
                  )}
                </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="navbar__user">
            <p className="navbar__user-name">{user?.name}</p>
            <p className="navbar__user-role">{role === 'lawyer' ? 'Counsel' : 'Client'}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="navbar__logout"
          >
            <LogOut className="navbar__icon" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
