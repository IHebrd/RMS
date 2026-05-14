import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronLeft } from 'lucide-react';
import './AdminNavbar.css';

function EmployerNavbar({ toggleSidebar, sidebarOpen, employerUser }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('employerToken');
    localStorage.removeItem('employerUser');
    navigate('/employer/login');
  };

  return (
    <nav className="rms-navbar">
      <div className="rms-navbar-left">
        <button 
          className="rms-menu-toggle" 
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
        <div className="rms-breadcrumb">
          <span>Espace Employé</span>
        </div>
      </div>

      <div className="rms-navbar-right">
        <button className="rms-notifications-btn">
          <Bell size={20} />
          <span className="rms-badge-notification">0</span>
        </button>

        <div className="rms-user-menu">
          <button 
            className="rms-user-info"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="rms-user-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              {employerUser?.first_name?.charAt(0) || 'E'}
            </div>
            <div className="rms-user-details">
              <span className="rms-user-name">
                {employerUser?.first_name} {employerUser?.last_name}
              </span>
              <span className="rms-user-role">Employé</span>
            </div>
          </button>

          {showUserMenu && (
            <div className="rms-user-dropdown">
              <button onClick={handleLogout} className="rms-logout-btn">
                <LogOut size={16} />
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default EmployerNavbar;
