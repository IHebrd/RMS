import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Building2, MessageSquare, User, Home } from 'lucide-react';
import './Sidebar.css';

function UserSidebar({ isOpen }) {
  const menuItems = [
    { path: '/user/dashboard', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord', color: '#6366f1' },
    { path: '/user/reclamations', icon: <FileText size={20} />, label: 'Mes Réclamations', color: '#ef4444' },
    { path: '/user/organizations', icon: <Building2 size={20} />, label: 'Organisations', color: '#f59e0b' },
    { path: '/user/messages/all', icon: <MessageSquare size={20} />, label: 'Mes Messages', color: '#8b5cf6' },
    { path: '/user/profile', icon: <User size={20} />, label: 'Mon Profil', color: '#0ea5e9' },
  ];

  return (
    <div className={`rms-sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <div className="rms-sidebar-header">
        <div className="rms-logo">
          <div className="rms-logo-icon">
            <Home size={22} color="white" />
          </div>
          {isOpen && <span className="rms-logo-text">Client RMS</span>}
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

export default UserSidebar;
