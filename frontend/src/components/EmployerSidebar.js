import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, User, CreditCard, Building2 } from 'lucide-react';
import './Sidebar.css';

function EmployerSidebar({ isOpen }) {
  const menuItems = [
    { path: '/employer/dashboard', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord', color: '#6366f1' },
    { path: '/employer/tasks', icon: <CheckSquare size={20} />, label: 'Mes Tâches', color: '#10b981' },
    { path: '/employer/balance', icon: <CreditCard size={20} />, label: 'Mon Solde', color: '#f59e0b' },
    { path: '/employer/profile', icon: <User size={20} />, label: 'Mon Profil', color: '#0ea5e9' },
  ];

  return (
    <div className={`rms-sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <div className="rms-sidebar-header">
        <div className="rms-logo">
          <div className="rms-logo-icon">
            <Building2 size={22} color="white" />
          </div>
          {isOpen && <span className="rms-logo-text">Employer RMS</span>}
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

export default EmployerSidebar;
