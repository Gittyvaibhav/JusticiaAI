import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import SubmitCase from './pages/SubmitCase';
import CaseDetail from './pages/CaseDetail';
import LawyerDashboard from './pages/LawyerDashboard';
import AvailableCases from './pages/AvailableCases';
import ActiveCases from './pages/ActiveCases';

function ProtectedRoute({ role }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'lawyer' ? '/lawyer/dashboard' : '/user/dashboard'} replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute role="user" />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/submit-case" element={<SubmitCase />} />
          <Route path="/user/case/:id" element={<CaseDetail />} />
        </Route>

        <Route element={<ProtectedRoute role="lawyer" />}>
          <Route path="/lawyer/dashboard" element={<LawyerDashboard />} />
          <Route path="/lawyer/available-cases" element={<AvailableCases />} />
          <Route path="/lawyer/active-cases" element={<ActiveCases />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
