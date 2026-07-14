import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <NavLink 
        to="/" 
        className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}
        onClick={handleLinkClick}
      >
        Dashboard
      </NavLink>
      <NavLink 
        to="/projects" 
        className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}
        onClick={handleLinkClick}
      >
        Projects
      </NavLink>
      
      <NavLink 
        to="/profile" 
        className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}
        onClick={handleLinkClick}
      >
        My Profile
      </NavLink>
      
      {user?.role === 'ADMIN' && (
        <NavLink 
          to="/users" 
          className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}
          onClick={handleLinkClick}
        >
          User Management
        </NavLink>
      )}
      <div style={{ flex: 1 }}></div>
      <button 
        onClick={() => { logout(); handleLinkClick(); }}
        className="sidebar-item"
        style={{ 
          background: 'none', 
          border: 'none', 
          textAlign: 'left', 
          color: '#FF5630', 
          width: '100%',
          display: 'block',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 'inherit'
        }}
      >
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
