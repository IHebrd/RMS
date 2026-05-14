import React, { useEffect, useState } from 'react';
import UserSidebar from './UserSidebar';
import UserNavbar from './UserNavbar';
import './AdminLayout.css';

function UserLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userUser, setUserUser] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('userUser');
    if (user) {
      setUserUser(JSON.parse(user));
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="rms-admin-layout">
      <UserSidebar isOpen={sidebarOpen} />
      <div className={`rms-admin-main ${!sidebarOpen ? 'expanded' : ''}`}>
        <UserNavbar 
          toggleSidebar={toggleSidebar} 
          sidebarOpen={sidebarOpen}
          userUser={userUser}
        />
        <div className="rms-admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default UserLayout;
