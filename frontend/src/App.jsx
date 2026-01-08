import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManageUsers from './pages/ManageUsers';
import ManageRoutes from './pages/ManageRoutes';
import ManageGeofences from './pages/ManageGeofences';
import ManageAssignments from './pages/ManageAssignments';
import MyAssignments from './pages/MyAssignments';
import Notifications from './pages/Notifications';
import LandingPage from './pages/LandingPage';
import './index.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loader" style={{ position: 'absolute', top: '50%', left: '50%' }}></div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'SUPER_USER') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'SUPER_USER') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <RootRedirect />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN', 'END_USER']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/manage-users" element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
              <ManageUsers />
            </ProtectedRoute>
          } />

          <Route path="/manage-routes" element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
              <ManageRoutes />
            </ProtectedRoute>
          } />

          <Route path="/manage-geofences" element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
              <ManageGeofences />
            </ProtectedRoute>
          } />

          <Route path="/manage-assignments" element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
              <ManageAssignments />
            </ProtectedRoute>
          } />

          <Route path="/my-assignments" element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN', 'END_USER']}>
              <MyAssignments />
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN', 'END_USER']}>
              <Notifications />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['SUPER_USER']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/" element={<LandingPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
