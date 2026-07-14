import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';

const statusColor = {
  TODO: { bg: 'rgba(87,157,255,0.12)', color: '#579DFF' },
  IN_PROGRESS: { bg: 'rgba(255,171,0,0.12)', color: '#FFAB00' },
  DONE: { bg: 'rgba(54,179,126,0.12)', color: '#36B37E' },
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [myTasks, setMyTasks] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user?.role === 'DEVELOPER') {
          const res = await api.get('/tasks/');
          setMyTasks(res.data.results || res.data);
        } else if (user?.role === 'PM') {
          // First get only PM's managed projects
          const projectsRes = await api.get('/projects/');
          const pmProjects = projectsRes.data.results || projectsRes.data;
          setMyProjects(pmProjects);

          // Then fetch tasks only for those specific projects in parallel
          if (pmProjects.length > 0) {
            const taskRequests = pmProjects.map(p => api.get(`/tasks/?project=${p.id}`));
            const taskResponses = await Promise.all(taskRequests);
            const allPmTasks = taskResponses.flatMap(res => res.data.results || res.data);
            setMyTasks(allPmTasks);
          }
        } else if (user?.role === 'ADMIN') {
          const [projectsRes, tasksRes, usersRes] = await Promise.all([
            api.get('/projects/'),
            api.get('/tasks/'),
            api.get('/users/')
          ]);
          setMyProjects(projectsRes.data.results || projectsRes.data);
          setMyTasks(tasksRes.data.results || tasksRes.data);
          setAllUsers(usersRes.data.results || usersRes.data);
        }
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const displayName = user?.first_name || user?.username;

  return (
    <>
      {/* Welcome Banner */}
      <div className="page-header">
        <h1>Welcome back, {displayName}! 👋</h1>
        <p style={{ color: 'var(--text-main)', marginTop: '0.4rem' }}>
          Here's what's happening in your workspace.
        </p>
      </div>

      {loading && <p style={{ color: 'var(--text-main)' }}>Loading...</p>}

      {!loading && (
        <>
          {/* ── DEVELOPER: My Assigned Tasks ── */}
          {user?.role === 'DEVELOPER' && (
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--text-bright)', marginBottom: '1rem', fontSize: '1.1rem' }}>My Tasks</h2>
              {myTasks.length === 0 ? (
                <div className="card"><p>No tasks assigned to you yet.</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {myTasks.map(task => (
                    <div
                      key={task.id}
                      className="card"
                      style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => navigate(`/projects/${task.project}`)}
                      onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div>
                        <span style={{ color: 'var(--text-bright)', fontWeight: '500' }}>{task.title}</span>
                        {task.description && (
                          <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            {task.description.substring(0, 80)}{task.description.length > 80 ? '...' : ''}
                          </p>
                        )}
                      </div>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: statusColor[task.status]?.bg,
                        color: statusColor[task.status]?.color,
                        whiteSpace: 'nowrap'
                      }}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── PM: My Projects + Tasks in them ── */}
          {user?.role === 'PM' && (
            <>
              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--text-bright)', marginBottom: '1rem', fontSize: '1.1rem' }}>My Projects</h2>
                {myProjects.length === 0 ? (
                  <div className="card"><p>No projects assigned to you yet.</p></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {myProjects.map(project => (
                      <div
                        key={project.id}
                        className="card"
                        style={{ marginBottom: 0, cursor: 'pointer' }}
                        onClick={() => navigate(`/projects/${project.id}`)}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <span style={{ color: 'var(--text-bright)', fontWeight: '500' }}>📁 {project.name}</span>
                        {project.description && (
                          <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            {project.description.substring(0, 80)}{project.description.length > 80 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--text-bright)', marginBottom: '1rem', fontSize: '1.1rem' }}>Tasks Overview</h2>
                {myTasks.length === 0 ? (
                  <div className="card"><p>No tasks found in your projects.</p></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {myTasks.map(task => (
                      <div
                        key={task.id}
                        className="card"
                        style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => navigate(`/projects/${task.project}`)}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div>
                          <span style={{ color: 'var(--text-bright)', fontWeight: '500' }}>{task.title}</span>
                          <p style={{ color: 'var(--text-main)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                            Assigned to: {task.assigned_to_username || 'Unassigned'}
                          </p>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: statusColor[task.status]?.bg,
                          color: statusColor[task.status]?.color,
                          whiteSpace: 'nowrap'
                        }}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {/* ── ADMIN: System Overview ── */}
          {user?.role === 'ADMIN' && (
            <>
              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--text-bright)', marginBottom: '1rem', fontSize: '1.1rem' }}>All Projects</h2>
                {myProjects.length === 0 ? (
                  <div className="card"><p>No projects found.</p></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {myProjects.map(project => (
                      <div
                        key={project.id}
                        className="card"
                        style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => navigate(`/projects/${project.id}`)}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div>
                          <span style={{ color: 'var(--text-bright)', fontWeight: '500' }}>📁 {project.name}</span>
                          <p style={{ color: 'var(--text-main)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                            Manager: {project.manager_username || 'None'} · Created by: {project.created_by_username || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--text-bright)', marginBottom: '1rem', fontSize: '1.1rem' }}>All Tasks</h2>
                {myTasks.length === 0 ? (
                  <div className="card"><p>No tasks found.</p></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {myTasks.map(task => (
                      <div
                        key={task.id}
                        className="card"
                        style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => navigate(`/projects/${task.project}`)}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div>
                          <span style={{ color: 'var(--text-bright)', fontWeight: '500' }}>{task.title}</span>
                          <p style={{ color: 'var(--text-main)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                            Assigned to: {task.assigned_to_username || 'Unassigned'}
                          </p>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: statusColor[task.status]?.bg,
                          color: statusColor[task.status]?.color,
                          whiteSpace: 'nowrap'
                        }}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

            </>
          )}
        </>
      )}
    </>
  );
};

export default Dashboard;

