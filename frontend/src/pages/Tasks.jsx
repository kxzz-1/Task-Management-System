import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const { user } = useContext(AuthContext);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks/');
      setTasks(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const moveTask = async (taskId, currentStatus) => {
    // Simple state machine: TODO -> IN_PROGRESS -> DONE
    let nextStatus = '';
    if (currentStatus === 'TODO') nextStatus = 'IN_PROGRESS';
    else if (currentStatus === 'IN_PROGRESS') nextStatus = 'DONE';
    else return; // Can't move past DONE for this simple demo

    try {
      // Optimistic UI update
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      
      // Patch to Django backend
      await api.patch(`/tasks/${taskId}/`, { status: nextStatus });
    } catch (error) {
      console.error("Failed to update task", error);
      // Revert on failure
      fetchTasks();
    }
  };

  // Group tasks by status
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
          <p>{task.project_name}</p>
          
          <div className="kanban-meta">
            <span>{task.assigned_to_username || 'Unassigned'}</span>
          </div>

          {task.status !== 'DONE' && (
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
        <h1>Tasks Board</h1>
        {(user?.role === 'ADMIN' || user?.role === 'PM') && (
          <button className="btn-primary">Create Task</button>
        )}
      </div>

      <div className="kanban-board">
        {renderColumn('TODO', todoTasks)}
        {renderColumn('IN PROGRESS', inProgressTasks)}
        {renderColumn('DONE', doneTasks)}
      </div>
    </>
  );
};

export default Tasks;
