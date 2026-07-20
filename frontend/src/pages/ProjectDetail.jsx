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
  const canEditTaskDetails = (user?.role === 'ADMIN' || user?.role === 'PM') && project?.status !== 'COMPLETED';

  // Modal state for adding a new task
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  // Modal state for editing a task
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskAssignee, setEditTaskAssignee] = useState('');

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
    const canManage = user?.effective_permissions?.includes('create_task') || user?.effective_permissions?.includes('edit_task');
    if (canManage) {
      fetchDevelopers();
    }
  }, [id, user]);

  // Determine current active columns for this project
  let columns = project?.statuses && project.statuses.length > 0
    ? [...project.statuses]
    : [{ id: 'todo', name: 'TODO' }, { id: 'inprogress', name: 'IN_PROGRESS' }, { id: 'done', name: 'DONE' }];

  // Ensure "DONE" is always the last column
  const doneIndex = columns.findIndex(c => c.name === 'DONE');
  if (doneIndex !== -1 && doneIndex !== columns.length - 1) {
    const [doneCol] = columns.splice(doneIndex, 1);
    columns.push(doneCol);
  }

  const moveTask = async (taskId, currentStatus) => {
    const currentIndex = columns.findIndex(c => c.name === currentStatus);
    if (currentIndex === -1 || currentIndex === columns.length - 1) return;

    const nextStatusName = columns[currentIndex + 1].name;

    try {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatusName } : t));
      await api.patch(`/tasks/${taskId}/`, { status: nextStatusName });
    } catch (error) {
      console.error("Failed to update task", error);
      fetchProjectDetails();
    }
  };

  const moveTaskBack = async (taskId, currentStatus) => {
    const currentIndex = columns.findIndex(c => c.name === currentStatus);
    if (currentIndex === -1 || currentIndex === 0) return;

    const prevStatusName = columns[currentIndex - 1].name;

    try {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: prevStatusName } : t));
      await api.patch(`/tasks/${taskId}/`, { status: prevStatusName });
    } catch (error) {
      console.error("Failed to move task back", error);
      fetchProjectDetails();
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const firstStatusName = columns[0].name;

    try {
      await api.post('/tasks/', {
        title: newTaskTitle,
        description: newTaskDescription,
        status: firstStatusName,
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

  const openEditTaskModal = (task) => {
    setSelectedTask(task);
    setEditTaskTitle(task.title || '');
    setEditTaskDescription(task.description || '');
    setEditTaskAssignee(task.assigned_to || '');
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/tasks/${selectedTask.id}/`, {
        title: editTaskTitle,
        description: editTaskDescription,
        assigned_to: editTaskAssignee || null
      });
      setSelectedTask(null);
      await refreshTasks();
    } catch (err) {
      console.error('Failed to update task', err);
      alert('Failed to update task');
    }
  };

  const assignDeveloper = async (taskId, devId) => {
    try {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, assigned_to: devId } : t));
      await api.patch(`/tasks/${taskId}/`, { assigned_to: devId });
      fetchProjectDetails();
    } catch (error) {
      console.error("Failed to assign developer", error);
    }
  };

  if (!project) return <div>Loading project...</div>;

  const renderColumn = (col) => {
    const columnTasks = tasks.filter(t => t.status === col.name);

    // Check if task can move to next status
    const currentIndex = columns.findIndex(c => c.name === col.name);
    const hasNextStatus = currentIndex !== -1 && currentIndex < columns.length - 1;
    const nextStatusObj = hasNextStatus ? columns[currentIndex + 1] : null;

    // Check if task can move to previous status
    const hasPrevStatus = currentIndex > 0;
    const prevStatusObj = hasPrevStatus ? columns[currentIndex - 1] : null;

    return (
      <div key={col.id || col.name} className="kanban-column">
        <div className="kanban-header">
          {col.name.replace('_', ' ')}
          <span style={{ color: 'var(--text-main)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
            {columnTasks.length}
          </span>
        </div>

        {columnTasks.map(task => (
          <div 
            key={task.id} 
            className="kanban-task"
            onClick={() => openEditTaskModal(task)}
            style={{ cursor: 'pointer' }}
          >
            <h3>{task.title}</h3>

            <div className="kanban-meta" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span>👤 {task.assigned_to_username || 'Unassigned'}</span>

              {(user?.role === 'ADMIN' || user?.role === 'PM') && project?.status !== 'COMPLETED' && (
                <select
                  value={task.assigned_to || ""}
                  onChange={(e) => assignDeveloper(task.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ padding: '0.25rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-bright)', border: '1px solid var(--border)', borderRadius: '4px' }}
                >
                  <option value="">Assign Dev...</option>
                  {developers.map(dev => (
                    <option key={dev.id} value={dev.id}>{dev.username}</option>
                  ))}
                </select>
              )}
            </div>

            {user?.effective_permissions?.includes('edit_task') && project.status !== 'COMPLETED' && (hasPrevStatus || hasNextStatus) && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                {hasPrevStatus && (
                  <button
                    className="btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveTaskBack(task.id, task.status);
                    }}
                    style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                  >
                    ← Back
                  </button>
                )}
                {hasNextStatus && (
                  <button
                    className="btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveTask(task.id, task.status);
                    }}
                    style={{ flex: 2 }}
                  >
                    Move to {nextStatusObj.name.replace('_', ' ')} →
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

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
        {user?.effective_permissions?.includes('create_task') && project.status !== 'COMPLETED' && (
          <button className="btn-primary" onClick={() => setShowTaskModal(true)}>Add Task</button>
        )}
        {project.status === 'COMPLETED' && (
          <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontStyle: 'italic' }}>This project is closed. No further changes allowed.</span>
        )}
      </div>

      <div className="kanban-board">
        {columns.map(renderColumn)}
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

      {/* Edit Task Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--text-bright)', margin: 0 }}>
                {canEditTaskDetails ? 'Edit Task' : 'Task Details'}
              </h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setSelectedTask(null)}>&times;</button>
            </div>
            <form onSubmit={handleEditTask}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Title *</label>
                  <input 
                    type="text" 
                    value={editTaskTitle} 
                    onChange={e => setEditTaskTitle(e.target.value)} 
                    required 
                    disabled={!canEditTaskDetails}
                    style={inputStyle} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Description</label>
                  <textarea 
                    value={editTaskDescription} 
                    onChange={e => setEditTaskDescription(e.target.value)} 
                    disabled={!canEditTaskDetails}
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Assign Developer</label>
                  <select 
                    value={editTaskAssignee} 
                    onChange={e => setEditTaskAssignee(e.target.value)} 
                    disabled={!canEditTaskDetails}
                    style={inputStyle}
                  >
                    <option value="">Unassigned</option>
                    {developers.map(dev => (
                      <option key={dev.id} value={dev.id}>{dev.username}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setSelectedTask(null)}>
                  {canEditTaskDetails ? 'Cancel' : 'Close'}
                </button>
                {canEditTaskDetails && (
                  <button type="submit" className="btn-primary">Save Changes</button>
                )}
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
