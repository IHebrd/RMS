import React, { useEffect, useState } from 'react';
import ResponsableSidebar from './ResponsableSidebar';
import ResponsableNavbar from './ResponsableNavbar';
import './AdminLayout.css';

function ResponsableLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [responsableUser, setResponsableUser] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('responsableUser');
    if (user) {
      setResponsableUser(JSON.parse(user));
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="rms-admin-layout">
      <ResponsableSidebar isOpen={sidebarOpen} />
      <div className={`rms-admin-main ${!sidebarOpen ? 'expanded' : ''}`}>
        <ResponsableNavbar 
          toggleSidebar={toggleSidebar} 
          sidebarOpen={sidebarOpen}
          responsableUser={responsableUser}
        />
        <div className="rms-admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default ResponsableLayout;
