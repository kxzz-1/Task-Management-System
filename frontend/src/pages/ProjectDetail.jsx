import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const { user } = useContext(AuthContext);
  // Modal state for adding a new task
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const fetchProjectDetails = async () => {
    try {
      const pRes = await api.get(`/projects/${id}/`);
      setProject(pRes.data);

      const tRes = await api.get(`/tasks/?project=${id}`);
      setTasks(tRes.data.results || tRes.data);
    } catch (error) {
      console.error("Failed to fetch project details", error);
    }
  };

  // Refresh tasks after creating a new one
  const refreshTasks = async () => {
    try {
      const tRes = await api.get(`/tasks/?project=${id}`);
      setTasks(tRes.data.results || tRes.data);
    } catch (e) {
      console.error('Failed to refresh tasks', e);
    }
  };

  const fetchDevelopers = async () => {
    try {
      const res = await api.get('/users/?role=DEVELOPER');
      setDevelopers(res.data.results || res.data);
    } catch (error) {
      console.error("Failed to fetch developers", error);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
    if (user?.role === 'ADMIN' || user?.role === 'PM') {
      fetchDevelopers();
    }
  }, [id, user?.role]);

  const moveTask = async (taskId, currentStatus) => {
    let nextStatus = '';
    if (currentStatus === 'TODO') nextStatus = 'IN_PROGRESS';
    else if (currentStatus === 'IN_PROGRESS') nextStatus = 'DONE';
    else return;

    try {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      await api.patch(`/tasks/${taskId}/`, { status: nextStatus });
    } catch (error) {
      console.error("Failed to update task", error);
      fetchProjectDetails();
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks/', {
        title: newTaskTitle,
        description: newTaskDescription,
        status: 'TODO',
        project: id,
        assigned_to: newTaskAssignee || null
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAssignee('');
      setShowTaskModal(false);
      await refreshTasks();
    } catch (err) {
      console.error('Failed to create task', err);
      alert('Failed to create task');
    }
  };

  const assignDeveloper = async (taskId, devId) => {
    try {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, assigned_to: devId } : t));
      await api.patch(`/tasks/${taskId}/`, { assigned_to: devId });
      fetchProjectDetails(); // re-fetch to get updated username
    } catch (error) {
      console.error("Failed to assign developer", error);
    }
  };

  if (!project) return <div>Loading project...</div>;

  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter(t => t.status === 'DONE');

  const renderColumn = (title, columnTasks) => (
    <div className="kanban-column">
      <div className="kanban-header">
        {title} <span style={{ color: 'var(--text-main)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{columnTasks.length}</span>
      </div>

      {columnTasks.map(task => (
        <div key={task.id} className="kanban-task">
          <h3>{task.title}</h3>

          <div className="kanban-meta" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span>👤 {task.assigned_to_username || 'Unassigned'}</span>

            {/* Admin/PM can assign developer */}
            {(user?.role === 'ADMIN' || user?.role === 'PM') && (
              <select
                value={task.assigned_to || ""}
                onChange={(e) => assignDeveloper(task.id, e.target.value)}
                style={{ padding: '0.25rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-bright)', border: '1px solid var(--border)', borderRadius: '4px' }}
              >
                <option value="">Assign Dev...</option>
                {developers.map(dev => (
                  <option key={dev.id} value={dev.id}>{dev.username}</option>
                ))}
              </select>
            )}
          </div>

          {task.status !== 'DONE' && project.status !== 'COMPLETED' && (
            <button
              className="btn-small"
              onClick={() => moveTask(task.id, task.status)}
            >
              Move to {task.status === 'TODO' ? 'In Progress' : 'Done'}
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {project.name}
            {project.status === 'COMPLETED' && (
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#36B37E', backgroundColor: 'rgba(54,179,126,0.15)', border: '1px solid rgba(54,179,126,0.3)', borderRadius: '12px', padding: '0.2rem 0.6rem' }}>✓ Completed</span>
            )}
          </h1>
          <p style={{ color: 'var(--text-main)', marginTop: '0.5rem' }}>{project.description}</p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'PM') && project.status !== 'COMPLETED' && (
          <button className="btn-primary" onClick={() => setShowTaskModal(true)}>Add Task</button>
        )}
        {project.status === 'COMPLETED' && (
          <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontStyle: 'italic' }}>This project is closed. No further changes allowed.</span>
        )}
      </div>

      <div className="kanban-board">
        {renderColumn('TODO', todoTasks)}
        {renderColumn('IN PROGRESS', inProgressTasks)}
        {renderColumn('DONE', doneTasks)}
      </div>

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--text-bright)', margin: 0 }}>Add New Task</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setShowTaskModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddTask}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Title *</label>
                  <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Description</label>
                  <textarea value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Assign Developer</label>
                  <select value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} style={inputStyle}>
                    <option value="">Unassigned</option>
                    {developers.map(dev => (
                      <option key={dev.id} value={dev.id}>{dev.username}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Task</button>
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
  backgroundColor: 'var(--bg-card)',
  color: 'var(--text-bright)',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box'
};

export default ProjectDetail;
