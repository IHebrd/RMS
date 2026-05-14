// src/App.js (Version complète avec Admin, Responsable, Employer et User)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// ==================== ADMIN PAGES ====================
import LoginAdmin from './pages/adminPages/Login';
import AdminDashboard from './pages/adminPages/AdminDashboard';
import Organizations from './pages/adminPages/Organizations';
import AddOrganization from './pages/adminPages/AddOrganization';
import EditOrganization from './pages/adminPages/EditOrganization';
import OrganizationResponsables from './pages/adminPages/OrganizationResponsables';
import AddResponsable from './pages/adminPages/AddResponsable';
import EditResponsable from './pages/adminPages/EditResponsable';
import Admins from './pages/adminPages/Admins';
import AddAdmin from './pages/adminPages/AddAdmin';
import EditAdmin from './pages/adminPages/EditAdmin';
import Reclamations from './pages/adminPages/Reclamations';

// ==================== RESPONSABLE PAGES ====================
import LoginResponsable from './pages/responsablesPages/Login';
import ResponsableDashboard from './pages/responsablesPages/ResponsableDashboard';
import ResponsableReclamations from './pages/responsablesPages/ResponsableReclamations';
import ResponsableEmployees from './pages/responsablesPages/ResponsableEmployees';
import ResponsableTasks from './pages/responsablesPages/ResponsableTasks';
import ResponsablePayments from './pages/responsablesPages/ResponsablePayments';
import ResponsablePerformance from './pages/responsablesPages/ResponsablePerformance';

// ==================== EMPLOYER PAGES ====================
import LoginEmployer from './pages/employerPages/LoginEmployer';
import EmployerDashboard from './pages/employerPages/EmployerDashboard';
import EmployerTasks from './pages/employerPages/EmployerTasks';
import EmployerProfile from './pages/employerPages/EmployerProfile';
import EmployerBalance from './pages/employerPages/EmployerBalance';

// ==================== USER PAGES ====================
import LoginUser from './pages/userPages/LoginUser';
import SignupUser from './pages/userPages/SignupUser';
import UserDashboard from './pages/userPages/UserDashboard';
import UserProfile from './pages/userPages/UserProfile';
import UserReclamations from './pages/userPages/UserReclamations';
import UserOrganizations from './pages/userPages/UserOrganizations';
import UserMessages from './pages/userPages/UserMessages';

// ==================== COMPOSANTS DE PROTECTION ====================

// Route protégée pour ADMIN
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const user = localStorage.getItem('adminUser');
  if (!token) return <Navigate to="/login" replace />;
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.role === 'admin') return children;
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  }
  return <Navigate to="/login" replace />;
};

// Route protégée pour RESPONSABLE
const ResponsableRoute = ({ children }) => {
  const token = localStorage.getItem('responsableToken');
  const user = localStorage.getItem('responsableUser');
  if (!token) return <Navigate to="/responsable/login" replace />;
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.role === 'responsable') return children;
    } catch (e) {
      return <Navigate to="/responsable/login" replace />;
    }
  }
  return <Navigate to="/responsable/login" replace />;
};

// Route protégée pour EMPLOYER
const EmployerRoute = ({ children }) => {
  const token = localStorage.getItem('employerToken');
  const user = localStorage.getItem('employerUser');
  if (!token) return <Navigate to="/employer/login" replace />;
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.role === 'employer') return children;
    } catch (e) {
      return <Navigate to="/employer/login" replace />;
    }
  }
  return <Navigate to="/employer/login" replace />;
};

// Route protégée pour USER
const UserRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  const user = localStorage.getItem('userUser');
  if (!token) return <Navigate to="/user/login" replace />;
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.role === 'user') return children;
    } catch (e) {
      return <Navigate to="/user/login" replace />;
    }
  }
  return <Navigate to="/user/login" replace />;
};

// Composant pour pages en construction
const ComingSoon = ({ title, icon }) => (
  <div style={{ textAlign: 'center', padding: '60px', background: '#f5f7fa', minHeight: '100vh' }}>
    <div style={{ fontSize: '80px', marginBottom: '20px' }}>{icon}</div>
    <h2 style={{ color: '#2d3748', marginBottom: '10px' }}>{title}</h2>
    <p style={{ color: '#718096' }}>Cette fonctionnalité sera bientôt disponible</p>
  </div>
);

// ==================== APPLICATION PRINCIPALE ====================
function App() {
  return (
    <Router>
      <Routes>
        {/* ==================== ROUTES PUBLIQUES ==================== */}
        <Route path="/login" element={<LoginAdmin />} />
        <Route path="/responsable/login" element={<LoginResponsable />} />
        <Route path="/employer/login" element={<LoginEmployer />} />
        <Route path="/user/login" element={<LoginUser />} />
        <Route path="/user/signup" element={<SignupUser />} />

        {/* ==================== ROUTES ADMIN ==================== */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/organizations" element={<AdminRoute><Organizations /></AdminRoute>} />
        <Route path="/admin/organizations/new" element={<AdminRoute><AddOrganization /></AdminRoute>} />
        <Route path="/admin/organizations/edit/:id" element={<AdminRoute><EditOrganization /></AdminRoute>} />
        <Route path="/admin/organizations/:id/responsables" element={<AdminRoute><OrganizationResponsables /></AdminRoute>} />
        <Route path="/admin/organizations/:id/responsables/new" element={<AdminRoute><AddResponsable /></AdminRoute>} />
        <Route path="/admin/responsables/edit/:id" element={<AdminRoute><EditResponsable /></AdminRoute>} />
        <Route path="/admin/responsables" element={<AdminRoute><OrganizationResponsables /></AdminRoute>} />
        <Route path="/admin/admins" element={<AdminRoute><Admins /></AdminRoute>} />
        <Route path="/admin/admins/new" element={<AdminRoute><AddAdmin /></AdminRoute>} />
        <Route path="/admin/admins/edit/:id" element={<AdminRoute><EditAdmin /></AdminRoute>} />
        <Route path="/admin/reclamations" element={<AdminRoute><Reclamations /></AdminRoute>} />
        
        {/* Admin - Pages en construction */}
        <Route path="/admin/employers" element={<AdminRoute><ComingSoon title="Gestion des Employés" icon="👷" /></AdminRoute>} />
        <Route path="/admin/tasks" element={<AdminRoute><ComingSoon title="Gestion des Tâches" icon="✅" /></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute><ComingSoon title="Gestion des Paiements" icon="💰" /></AdminRoute>} />
        <Route path="/admin/proofs" element={<AdminRoute><ComingSoon title="Gestion des Preuves" icon="📎" /></AdminRoute>} />
        <Route path="/admin/messages" element={<AdminRoute><ComingSoon title="Messages" icon="💬" /></AdminRoute>} />

        {/* ==================== ROUTES RESPONSABLE ==================== */}
        <Route path="/responsable/dashboard" element={<ResponsableRoute><ResponsableDashboard /></ResponsableRoute>} />
        <Route path="/responsable/reclamations" element={<ResponsableRoute><ResponsableReclamations /></ResponsableRoute>} />
        <Route path="/responsable/employees" element={<ResponsableRoute><ResponsableEmployees /></ResponsableRoute>} />
        <Route path="/responsable/tasks" element={<ResponsableRoute><ResponsableTasks /></ResponsableRoute>} />
        <Route path="/responsable/payments" element={<ResponsableRoute><ResponsablePayments /></ResponsableRoute>} />
        <Route path="/responsable/performance" element={<ResponsableRoute><ResponsablePerformance /></ResponsableRoute>} />

        {/* ==================== ROUTES EMPLOYER ==================== */}
        <Route path="/employer/dashboard" element={<EmployerRoute><EmployerDashboard /></EmployerRoute>} />
        <Route path="/employer/tasks" element={<EmployerRoute><EmployerTasks /></EmployerRoute>} />
        <Route path="/employer/profile" element={<EmployerRoute><EmployerProfile /></EmployerRoute>} />
        <Route path="/employer/balance" element={<EmployerRoute><EmployerBalance /></EmployerRoute>} />

        {/* ==================== ROUTES USER ==================== */}
        <Route path="/user/dashboard" element={<UserRoute><UserDashboard /></UserRoute>} />
        <Route path="/user/profile" element={<UserRoute><UserProfile /></UserRoute>} />
        <Route path="/user/reclamations" element={<UserRoute><UserReclamations /></UserRoute>} />
        <Route path="/user/reclamations/new" element={<UserRoute><UserReclamations /></UserRoute>} />
        <Route path="/user/reclamations/:id" element={<UserRoute><UserReclamations /></UserRoute>} />
        <Route path="/user/organizations" element={<UserRoute><UserOrganizations /></UserRoute>} />
        <Route path="/user/messages/:id" element={<UserRoute><UserMessages /></UserRoute>} />

        {/* ==================== REDIRECTIONS ==================== */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;