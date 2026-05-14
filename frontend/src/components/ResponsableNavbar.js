import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronLeft } from 'lucide-react';
import './AdminNavbar.css';

function ResponsableNavbar({ toggleSidebar, sidebarOpen, responsableUser }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('responsableToken');
    localStorage.removeItem('responsableUser');
    navigate('/responsable/login');
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
          <span>Espace Responsable</span>
        </div>
      </div>

      <div className="rms-navbar-right">
        <button className="rms-notifications-btn">
          <Bell size={20} />
          <span className="rms-badge-notification">3</span>
        </button>

        <div className="rms-user-menu">
          <button 
            className="rms-user-info"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="rms-user-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              {responsableUser?.first_name?.charAt(0) || 'R'}
            </div>
            <div className="rms-user-details">
              <span className="rms-user-name">
                {responsableUser?.first_name} {responsableUser?.last_name}
              </span>
              <span className="rms-user-role">Responsable</span>
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

export default ResponsableNavbar;
