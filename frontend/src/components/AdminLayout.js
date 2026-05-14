import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import AdminNavbar from './AdminNavbar';
import './AdminLayout.css';

function AdminLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('adminUser');
    if (user) {
      setAdminUser(JSON.parse(user));
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="rms-admin-layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`rms-admin-main ${!sidebarOpen ? 'expanded' : ''}`}>
        <AdminNavbar 
          toggleSidebar={toggleSidebar} 
          sidebarOpen={sidebarOpen}
          adminUser={adminUser}
        />
        <div className="rms-admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;