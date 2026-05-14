import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, CheckSquare, CreditCard, BarChart2, Building2 } from 'lucide-react';
import './Sidebar.css';

function ResponsableSidebar({ isOpen }) {
  const menuItems = [
    { path: '/responsable/dashboard', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord', color: '#6366f1' },
    { path: '/responsable/reclamations', icon: <FileText size={20} />, label: 'Réclamations', color: '#ef4444' },
    { path: '/responsable/employees', icon: <Users size={20} />, label: 'Employés', color: '#0ea5e9' },
    { path: '/responsable/tasks', icon: <CheckSquare size={20} />, label: 'Tâches', color: '#10b981' },
    { path: '/responsable/payments', icon: <CreditCard size={20} />, label: 'Paiements', color: '#f59e0b' },
    { path: '/responsable/performance', icon: <BarChart2 size={20} />, label: 'Performance', color: '#8b5cf6' },
  ];

  return (
    <div className={`rms-sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <div className="rms-sidebar-header">
        <div className="rms-logo">
          <div className="rms-logo-icon">
            <Building2 size={22} color="white" />
          </div>
          {isOpen && <span className="rms-logo-text">Responsable RMS</span>}
        </div>
      </div>

      <nav className="rms-sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `rms-sidebar-link ${isActive ? 'active' : ''}`
            }
            style={({ isActive }) => ({
              '--active-color': item.color
            })}
          >
            <span className="rms-sidebar-icon" style={{ color: item.color }}>
              {item.icon}
            </span>
            {isOpen && <span className="rms-sidebar-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="rms-sidebar-footer">
        {isOpen && (
          <div className="rms-sidebar-version">
            <small>Version 1.0.0</small>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResponsableSidebar;
