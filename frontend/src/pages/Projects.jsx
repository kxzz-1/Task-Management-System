import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [pms, setPms] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Modal State for Creation
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newManager, setNewManager] = useState('');

  // Modal State for Editing
  const [editProject, setEditProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editManager, setEditManager] = useState('');

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects/');
      setProjects(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  const fetchPMs = async () => {
    try {
      // role filter now works on the backend via django-filter
      const response = await api.get('/users/?role=PM');
      setPms(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch PMs", error);
    }
  };

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'ADMIN') {
      fetchPMs();
    }
  }, [user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects/', {
        name: newName,
        description: newDescription,
        manager: newManager || null
      });
      setNewName('');
      setNewDescription('');
      setNewManager('');
      setShowModal(false);
      fetchProjects();
    } catch (error) {
      console.error("Failed to create project", error);
      alert("Failed to create project.");
    }
  };

  const openEditModal = (project, e) => {
    e.stopPropagation();
    setEditProject(project);
    setEditName(project.name);
    setEditDescription(project.description);
    setEditManager(project.manager || '');
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/projects/${editProject.id}/`, {
        name: editName,
        description: editDescription,
        manager: editManager || null
      });
      setEditProject(null);
      fetchProjects();
    } catch (error) {
      console.error("Failed to update project", error);
      alert("Failed to update project.");
    }
  };

  const handleMarkComplete = async (projectId, e) => {
    e.stopPropagation();
    try {
      await api.post(`/projects/${projectId}/mark-complete/`);
      fetchProjects();
    } catch (error) {
      console.error("Failed to mark project complete", error);
      alert("Failed to mark project as complete.");
    }
  };

  const activeProjects = projects.filter(p => p.status !== 'COMPLETED');
  const completedProjects = projects.filter(p => p.status === 'COMPLETED');

  const renderProjectCard = (project) => (
    <div
      key={project.id}
      className="card"
      style={{ marginBottom: 0, cursor: 'pointer', transition: 'border-color 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      onClick={() => navigate(`/projects/${project.id}`)}
      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
      onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div>
        <h3 style={{ color: 'var(--text-bright)', marginBottom: '0.5rem' }}>{project.name}</h3>
        <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{project.description || "No description provided."}</p>
        <div className="kanban-meta" style={{ marginTop: '1rem', flexDirection: 'column', gap: '0.3rem' }}>
          <div>Manager: {project.manager_username || 'None'}</div>
          <div>Created by: {project.created_by_username || 'Unknown'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }} onClick={e => e.stopPropagation()}>
        {user?.role === 'ADMIN' && project.status !== 'COMPLETED' && (
          <button className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={(e) => openEditModal(project, e)}>Edit</button>
        )}
        {(user?.role === 'ADMIN' || user?.role === 'PM') && project.status !== 'COMPLETED' && (
          <button
            className="btn-small"
            style={{ backgroundColor: 'rgba(54,179,126,0.15)', color: '#36B37E', border: '1px solid rgba(54,179,126,0.3)' }}
            onClick={(e) => handleMarkComplete(project.id, e)}
          >
            ✓ Mark Complete
          </button>
        )}
        {project.status === 'COMPLETED' && (
          <span style={{ fontSize: '0.75rem', color: '#36B37E', fontWeight: '600' }}>✓ Completed</span>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Projects</h1>
        {user?.role === 'ADMIN' && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        )}
      </div>

      {/* Active Projects */}
      <h2 style={{ color: 'var(--text-bright)', fontSize: '1rem', marginBottom: '0.75rem' }}>Active Projects</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {activeProjects.length === 0 ? <p style={{ color: 'var(--text-main)' }}>No active projects.</p> : activeProjects.map(renderProjectCard)}
      </div>

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '0.75rem' }}>Completed Projects</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', opacity: 0.7 }}>
            {completedProjects.map(renderProjectCard)}
          </div>
        </>
      )}

      {/* Project Creation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--text-bright)', margin: 0 }}>Create New Project</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleCreateProject}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Project Name *</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required style={inputStyle} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Description</label>
                  <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Assign Project Manager</label>
                  <select value={newManager} onChange={(e) => setNewManager(e.target.value)} style={inputStyle}>
                    <option value="">No Manager Assigned</option>
                    {pms.map(pm => (
                      <option key={pm.id} value={pm.id}>{pm.username}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Edit Modal */}
      {editProject && (
        <div className="modal-overlay" onClick={() => setEditProject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--text-bright)', margin: 0 }}>Edit Project</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setEditProject(null)}>&times;</button>
            </div>
            
            <form onSubmit={handleEditProject}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Project Name *</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required style={inputStyle} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Description</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Assign Project Manager</label>
                  <select value={editManager} onChange={(e) => setEditManager(e.target.value)} style={inputStyle}>
                    <option value="">No Manager Assigned</option>
                    {pms.map(pm => (
                      <option key={pm.id} value={pm.id}>{pm.username}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditProject(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const inputStyle = {
  padding: '0.75rem', 
  borderRadius: '4px', 
  border: '1px solid var(--border)',
  backgroundColor: 'var(--bg-main)', 
  color: 'var(--text-bright)',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box'
};

export default Projects;
