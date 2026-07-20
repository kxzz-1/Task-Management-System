import React, { useState, useEffect } from 'react';
import api from '../api';

const Roles = () => {
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' or 'statuses'
  
  // Roles list & permissions list state
  const [roles, setRoles] = useState([]);
  const [systemPermissions, setSystemPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Statuses state
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [newStatusName, setNewStatusName] = useState('');

  // Role Form state
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]); 
  const [isEditing, setIsEditing] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch roles, permissions, and task statuses
  const fetchData = async () => {
    try {
      const [rolesRes, permsRes, statusesRes] = await Promise.all([
        api.get('/roles/'),
        api.get('/system-permissions/'),
        api.get('/task-statuses/')
      ]);
      setRoles(rolesRes.data.results || rolesRes.data);
      setSystemPermissions(permsRes.data.results || permsRes.data);
      setTaskStatuses(statusesRes.data.results || statusesRes.data);
    } catch (err) {
      console.error('Failed to load configuration data', err);
      setError('Failed to load data from server.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group system permissions by module for clean rendering
  const groupedPermissions = systemPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {});

  // Handle selecting a role to view/edit
  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setSelectedPermissions(role.permissions || []);
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  // Handle clicking "Create New Role"
  const handleStartCreate = () => {
    setSelectedRole(null);
    setRoleName('');
    setSelectedPermissions([]);
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  // Toggle permission checkbox
  const handleTogglePermission = (codename) => {
    setSelectedPermissions((prev) =>
      prev.includes(codename)
        ? prev.filter((p) => p !== codename)
        : [...prev, codename]
    );
  };

  // Save Role Changes
  const handleSaveRole = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!roleName.trim()) {
      setError('Role name is required.');
      return;
    }

    try {
      const payload = {
        name: roleName.toUpperCase().replace(/\s+/g, '_'),
        permissions: selectedPermissions
      };

      if (selectedRole) {
        const res = await api.patch(`/roles/${selectedRole.id}/`, payload);
        setSuccess('Role updated successfully.');
        await fetchData();
        setSelectedRole(res.data);
      } else {
        await api.post('/roles/', payload);
        setSuccess('Role created successfully.');
        handleStartCreate();
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to save role', err);
      setError(err.response?.data?.name?.[0] || 'Failed to save role. Make sure the name is unique.');
    }
  };

  // Delete Role
  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    if (!window.confirm(`Are you sure you want to delete the role "${selectedRole.name}"?`)) return;

    setError('');
    setSuccess('');

    try {
      await api.delete(`/roles/${selectedRole.id}/`);
      setSuccess('Role deleted successfully.');
      handleStartCreate();
      await fetchData();
    } catch (err) {
      console.error('Failed to delete role', err);
      setError('Failed to delete role. It may be in use or protected.');
    }
  };

  // Add Task Status
  const handleAddTaskStatus = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newStatusName.trim()) {
      setError('Status name cannot be empty.');
      return;
    }

    try {
      const formattedName = newStatusName.toUpperCase().trim().replace(/\s+/g, '_');
      await api.post('/task-statuses/', { name: formattedName });
      setSuccess(`Status "${formattedName}" added successfully.`);
      setNewStatusName('');
      await fetchData();
    } catch (err) {
      console.error('Failed to add status', err);
      setError(err.response?.data?.name?.[0] || 'Failed to add status. Make sure the name is unique.');
    }
  };

  // Delete Task Status
  const handleDeleteTaskStatus = async (statusId, statusName) => {
    if (!window.confirm(`Are you sure you want to delete status "${statusName}"?`)) return;
    
    setError('');
    setSuccess('');

    try {
      await api.delete(`/task-statuses/${statusId}/`);
      setSuccess(`Status "${statusName}" deleted successfully.`);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete status', err);
      setError(err.response?.data?.error || 'Cannot delete status. It is likely currently in use by projects or tasks.');
    }
  };

  // Common styling for input elements (fits the dark theme)
  const inputStyle = {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
    backgroundColor: 'var(--bg-main, #1a1a1a)',
    color: 'var(--text-bright, #ffffff)',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  return (
    <div className="page-container">
      <h1>Administrative Configurations</h1>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        <button
          onClick={() => { setActiveTab('roles'); setError(''); setSuccess(''); }}
          style={{
            padding: '10px 15px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'roles' ? '2px solid var(--primary-color)' : 'none',
            color: activeTab === 'roles' ? 'var(--primary-color)' : 'var(--text-main)',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px'
          }}
        >
          Roles & Permissions
        </button>
        <button
          onClick={() => { setActiveTab('statuses'); setError(''); setSuccess(''); }}
          style={{
            padding: '10px 15px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'statuses' ? '2px solid var(--primary-color)' : 'none',
            color: activeTab === 'statuses' ? 'var(--primary-color)' : 'var(--text-main)',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px'
          }}
        >
          Task Statuses (Workflow Columns)
        </button>
      </div>

      {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}
      {success && <div className="success-message" style={{ marginBottom: '15px' }}>{success}</div>}

      {/* Tab Content: Roles & Permissions */}
      {activeTab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          
          {/* Left Side: Role List */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Roles</h3>
              <button className="btn btn-primary" onClick={handleStartCreate} style={{ padding: '5px 10px', fontSize: '14px' }}>
                + Add New
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: selectedRole?.id === role.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.03)',
                    color: selectedRole?.id === role.id ? '#fff' : 'inherit',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    border: '1px solid var(--border)'
                  }}
                >
                  {role.name}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Role Form */}
          <div className="card" style={{ padding: '20px' }}>
            <h3>{selectedRole ? `Edit Role: ${selectedRole.name}` : 'Create New Role'}</h3>
            
            <form onSubmit={handleSaveRole} style={{ marginTop: '15px' }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="roleName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Role Name
                </label>
                <input
                  id="roleName"
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. QA_ENGINEER"
                  disabled={selectedRole?.name === 'ADMIN'} 
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
                <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                  Format should be all uppercase (e.g. QA_ENGINEER).
                </small>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>
                  Module-Wise Permissions
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {Object.keys(groupedPermissions).map((module) => (
                    <div 
                      key={module} 
                      style={{ 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px', 
                        padding: '15px', 
                        backgroundColor: 'rgba(255, 255, 255, 0.01)' 
                      }}
                    >
                      <h4 style={{ textTransform: 'capitalize', marginTop: 0, marginBottom: '10px', color: 'var(--primary-color)' }}>
                        {module} Module
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                        {groupedPermissions[module].map((perm) => (
                          <label 
                            key={perm.codename} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.codename)}
                              onChange={() => handleTogglePermission(perm.codename)}
                              disabled={selectedRole?.name === 'ADMIN'} 
                            />
                            {perm.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={selectedRole?.name === 'ADMIN'}
                >
                  {selectedRole ? 'Update Role' : 'Create Role'}
                </button>
                
                {selectedRole && selectedRole.name !== 'ADMIN' && (
                  <button
                    type="button"
                    className="btn"
                    onClick={handleDeleteRole}
                    style={{ backgroundColor: '#FF5630', color: '#fff' }}
                  >
                    Delete Role
                  </button>
                )}
              </div>
            </form>
          </div>

        </div>
      )}

      {/* Tab Content: Task Statuses */}
      {activeTab === 'statuses' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          
          {/* Add Status Form */}
          <div className="card" style={{ padding: '20px', height: 'fit-content' }}>
            <h3>Create New Task Status</h3>
            <form onSubmit={handleAddTaskStatus} style={{ marginTop: '15px' }}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Status Name
                </label>
                <input
                  type="text"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  placeholder="e.g. QA_TESTING"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
                <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                  Enter name in uppercase (e.g. REVIEW or QA_TESTING).
                </small>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Add Status
              </button>
            </form>
          </div>

          {/* List of Statuses */}
          <div className="card" style={{ padding: '20px' }}>
            <h3>Global Task Statuses</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '15px' }}>
              The following statuses define the columns and workflows available for tasks across projects.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {taskStatuses.map((status) => (
                <div
                  key={status.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 15px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <span style={{ fontWeight: '600', color: 'var(--text-bright)' }}>
                    {status.name}
                  </span>
                  
                  {/* Prevent deleting core default statuses (TODO, IN_PROGRESS, DONE) to keep integrity */}
                  {!['TODO', 'IN_PROGRESS', 'DONE'].includes(status.name) ? (
                    <button
                      className="btn"
                      onClick={() => handleDeleteTaskStatus(status.id, status.name)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: 'rgba(255, 86, 48, 0.15)',
                        color: '#FF5630',
                        border: '1px solid rgba(255, 86, 48, 0.3)'
                      }}
                    >
                      Delete
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                      Core System Status
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Roles;
