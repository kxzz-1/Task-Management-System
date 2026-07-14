import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';

const TopNav = ({ onToggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ projects: [], tasks: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });
  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);

  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : '??';

  // Apply theme on mount and whenever isDark changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!val.trim()) {
      setResults({ projects: [], tasks: [] });
      setShowDropdown(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          api.get(`/projects/?search=${encodeURIComponent(val)}`),
          api.get(`/tasks/?search=${encodeURIComponent(val)}`)
        ]);
        const projects = projectsRes.data.results || projectsRes.data;
        const tasks = tasksRes.data.results || tasksRes.data;
        setResults({ projects, tasks });
        setShowDropdown(true);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (type, item) => {
    setQuery('');
    setShowDropdown(false);
    if (type === 'project') {
      navigate(`/projects/${item.id}`);
    } else {
      // Navigate to the project that contains this task
      navigate(`/projects/${item.project}`);
    }
  };

  const hasResults = results.projects.length > 0 || results.tasks.length > 0;

  return (
    <nav className="topnav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button 
          onClick={onToggleSidebar} 
          className="sidebar-toggle"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-bright)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.25rem',
            lineHeight: 1
          }}
        >
          ☰
        </button>
        <div className="topnav-logo">
          <span className="logo-full">Task Management System</span>
          <span className="logo-short">TMS</span>
        </div>
      </div>

      <div className="topnav-search" style={{ position: 'relative' }} ref={wrapperRef}>
        <input
          type="text"
          placeholder="Search tasks, projects..."
          value={query}
          onChange={handleSearch}
          onFocus={() => hasResults && setShowDropdown(true)}
          style={{ width: '100%' }}
        />

        {showDropdown && (
          <div 
            className="topnav-search-dropdown"
            style={{
              position: 'absolute',
              top: '110%',
              left: '-8rem',
              width: '480px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              zIndex: 1000,
              overflow: 'hidden'
            }}
          >
            {loading && (
              <div style={{ padding: '1rem', color: 'var(--text-main)', textAlign: 'center' }}>Searching...</div>
            )}

            {!loading && !hasResults && (
              <div style={{ padding: '1rem', color: 'var(--text-main)', textAlign: 'center' }}>No results found.</div>
            )}

            {!loading && results.projects.length > 0 && (
              <>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
                  Projects
                </div>
                {results.projects.slice(0, 5).map(p => (
                  <div
                    key={`project-${p.id}`}
                    onClick={() => handleSelect('project', p)}
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = ''}
                  >
                    <span style={{ color: 'var(--text-bright)', fontWeight: '500' }}>📁 {p.name}</span>
                    {p.description && <span style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>{p.description.substring(0, 60)}...</span>}
                  </div>
                ))}
              </>
            )}

            {!loading && results.tasks.length > 0 && (
              <>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
                  Tasks
                </div>
                {results.tasks.slice(0, 5).map(t => (
                  <div
                    key={`task-${t.id}`}
                    onClick={() => handleSelect('task', t)}
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = ''}
                  >
                    <span style={{ color: 'var(--text-bright)', fontWeight: '500' }}>✅ {t.title}</span>
                    <span style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>Status: {t.status} · Assigned: {t.assigned_to_username || 'Unassigned'}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="topnav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(prev => !prev)}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '0.3rem 0.7rem',
            cursor: 'pointer',
            fontSize: '1rem',
            lineHeight: 1,
            color: 'var(--text-bright)'
          }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        <div className="topnav-profile" title={user?.username}>{initials}</div>
        <button
          onClick={logout}
          className="topnav-logout-btn"
          style={{ background: 'none', border: 'none', color: '#FF5630', cursor: 'pointer', fontWeight: '500' }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default TopNav;

