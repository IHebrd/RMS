import React, { useEffect, useState } from 'react';
import EmployerSidebar from './EmployerSidebar';
import EmployerNavbar from './EmployerNavbar';
import './AdminLayout.css';

function EmployerLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [employerUser, setEmployerUser] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('employerUser');
    if (user) {
      setEmployerUser(JSON.parse(user));
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="rms-admin-layout">
      <EmployerSidebar isOpen={sidebarOpen} />
      <div className={`rms-admin-main ${!sidebarOpen ? 'expanded' : ''}`}>
        <EmployerNavbar 
          toggleSidebar={toggleSidebar} 
          sidebarOpen={sidebarOpen}
          employerUser={employerUser}
        />
        <div className="rms-admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default EmployerLayout;
