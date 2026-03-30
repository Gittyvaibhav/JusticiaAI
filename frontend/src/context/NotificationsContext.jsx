import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getSocket } from '../socket';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext(null);
const STORAGE_KEY = 'notifications';

function loadStoredNotifications(userId) {
  if (!userId) {
    return [];
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotifications(userId, notifications) {
  if (!userId) {
    return;
  }

  localStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(notifications.slice(0, 20)));
}

function buildNotification(role, type, payload) {
  const createdAt = new Date().toISOString();

  if (type === 'case:available') {
    return {
      id: `${type}:${payload.caseId}:${payload.createdAt || createdAt}`,
      type,
      title: 'New case available',
      message: `${payload.title} was submitted${payload.location ? ` in ${payload.location}` : ''}.`,
      href: '/lawyer/available-cases',
      createdAt,
      read: false,
    };
  }

  if (type === 'case:updated' && role === 'user' && payload.action === 'accepted') {
    return {
      id: `${type}:${payload.caseId}:${payload.updatedAt || createdAt}`,
      type,
      title: 'Lawyer accepted your case',
      message: `${payload.title} has been accepted and chat is now available.`,
      href: `/user/case/${payload.caseId}`,
      createdAt,
      read: false,
    };
  }

  if (type === 'case:updated' && role === 'lawyer' && payload.action === 'accepted') {
    return {
      id: `${type}:${payload.caseId}:${payload.updatedAt || createdAt}`,
      type,
      title: 'Case added to your active matters',
      message: `${payload.title} is now assigned to you.`,
      href: `/lawyer/case/${payload.caseId}`,
      createdAt,
      read: false,
    };
  }

  if (type === 'case:updated' && payload.action === 'status-changed') {
    return {
      id: `${type}:${payload.caseId}:${payload.updatedAt || createdAt}`,
      type,
      title: 'Case status updated',
      message: `${payload.title} moved to ${payload.status}.`,
      href: `/${role}/case/${payload.caseId}`,
      createdAt,
      read: false,
    };
  }

  if (type === 'case:updated' && payload.action === 'closed') {
    return {
      id: `${type}:${payload.caseId}:${payload.updatedAt || createdAt}`,
      type,
      title: 'Case closed',
      message: `${payload.title} has been closed.`,
      href: `/${role}/case/${payload.caseId}`,
      createdAt,
      read: false,
    };
  }

  return null;
}

export function NotificationsProvider({ children }) {
  const { user, role, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setNotifications(loadStoredNotifications(user?.id));
  }, [user?.id]);

  useEffect(() => {
    saveNotifications(user?.id, notifications);
  }, [notifications, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !role) {
      return undefined;
    }

    const socket = getSocket();

    if (!socket) {
      return undefined;
    }

    const pushNotification = (type, payload) => {
      const nextNotification = buildNotification(role, type, payload);

      if (!nextNotification) {
        return;
      }

      setNotifications((current) => {
        if (current.some((item) => item.id === nextNotification.id)) {
          return current;
        }

        return [nextNotification, ...current].slice(0, 20);
      });

      toast(nextNotification.title);
    };

    const handleCaseAvailable = (payload) => pushNotification('case:available', payload);
    const handleCaseUpdated = (payload) => pushNotification('case:updated', payload);

    socket.on('case:available', handleCaseAvailable);
    socket.on('case:updated', handleCaseUpdated);

    return () => {
      socket.off('case:available', handleCaseAvailable);
      socket.off('case:updated', handleCaseUpdated);
    };
  }, [isAuthenticated, role]);

  const markAllAsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
  }), [notifications, unreadCount]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }

  return context;
}
