import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Shield, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import './Sidebar.css';

function Sidebar({ isOpen }) {
  const menuItems = [
    { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord', color: '#6366f1' },
    { path: '/admin/organizations', icon: <Building2 size={20} />, label: 'Organisations', color: '#10b981' },
    { path: '/admin/responsables', icon: <Users size={20} />, label: 'Responsables', color: '#0ea5e9' },
    { path: '/admin/admins', icon: <Shield size={20} />, label: 'Administrateurs', color: '#f59e0b' },
    { path: '/admin/reclamations', icon: <FileText size={20} />, label: 'Réclamations', color: '#ef4444' },
  ];

  return (
    <div className={`rms-sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <div className="rms-sidebar-header">
        <div className="rms-logo">
          <div className="rms-logo-icon">
            <Building2 size={22} color="white" />
          </div>
          {isOpen && <span className="rms-logo-text">Gestion RMS</span>}
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

export default Sidebar;