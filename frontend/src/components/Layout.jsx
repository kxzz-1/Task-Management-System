import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-container">
      <TopNav onToggleSidebar={toggleSidebar} />
      <div className="body-container">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <main className="main-content" onClick={closeSidebar}>
          {/* This is where the react-router-dom will render the specific page content */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
