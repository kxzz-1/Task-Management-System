import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [systemPermissions, setSystemPermissions] = useState([]);

  // Create User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState(''); // Holds role name string
  const [newIsCustomized, setNewIsCustomized] = useState(false);
  const [newPermissions, setNewPermissions] = useState([]); // Array of codenames
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering & Searching State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal / Edit State
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editIsCustomized, setEditIsCustomized] = useState(false);
  const [editPermissions, setEditPermissions] = useState([]);

  // Fetch all initial data
  const fetchData = async () => {
    try {
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        api.get('/users/'),
        api.get('/roles/'),
        api.get('/system-permissions/')
      ]);
      setUsers(usersRes.data.results || usersRes.data);
      const rolesList = rolesRes.data.results || rolesRes.data;
      setRoles(rolesList);
      setSystemPermissions(permsRes.data.results || permsRes.data);
      
      // Default newRole to DEVELOPER if it exists in the backend list
      const defaultRole = rolesList.find(r => r.name === 'DEVELOPER') || rolesList[0];
      if (defaultRole) {
        setNewRole(defaultRole.name);
        setNewPermissions(defaultRole.permissions || []);
      }
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to group permissions by module
  const groupedPermissions = systemPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {});

  // Handle changing role in "Create User" form
  const handleNewRoleChange = (roleName) => {
    setNewRole(roleName);
    if (!newIsCustomized) {
      // Automatically precheck the permissions associated with this role
      const roleObj = roles.find(r => r.name === roleName);
      setNewPermissions(roleObj ? roleObj.permissions : []);
    }
  };

  // Handle changing role in "Edit User" modal
  const handleEditRoleChange = (roleName) => {
    setEditRole(roleName);
    if (!editIsCustomized) {
      const roleObj = roles.find(r => r.name === roleName);
      setEditPermissions(roleObj ? roleObj.permissions : []);
    }
  };

  // Handle toggling customization in Create Form
  const handleNewCustomizedToggle = (checked) => {
    setNewIsCustomized(checked);
    if (!checked) {
      // Revert back to selected role defaults
      const roleObj = roles.find(r => r.name === newRole);
      setNewPermissions(roleObj ? roleObj.permissions : []);
    }
  };

  // Handle toggling customization in Edit Modal
  const handleEditCustomizedToggle = (checked) => {
    setEditIsCustomized(checked);
    if (!checked) {
      const roleObj = roles.find(r => r.name === editRole);
      setEditPermissions(roleObj ? roleObj.permissions : []);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/users/', {
        username: newUsername,
        password: newPassword,
        first_name: newFirstName,
        last_name: newLastName,
        email: newEmail,
        role: newRole,
        is_permissions_customized: newIsCustomized,
        custom_permissions: newIsCustomized ? newPermissions : []
      });
      
      // Reset form
      setNewUsername('');
      setNewPassword('');
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewIsCustomized(false);
      
      const defaultRole = roles.find(r => r.name === 'DEVELOPER') || roles[0];
      if (defaultRole) {
        setNewRole(defaultRole.name);
        setNewPermissions(defaultRole.permissions || []);
      }
      
      setSuccess('User created successfully.');
      fetchData();
    } catch (err) {
      setError('Failed to create user. Ensure username is unique.');
      console.error("Create user error", err);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDeleteUser = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (confirmDeleteId === id) {
      try {
        await api.delete(`/users/${id}/`);
        setConfirmDeleteId(null);
        setSuccess('User deleted successfully.');
        fetchData();
      } catch (err) {
        console.error("Failed to delete user", err);
        setError("Failed to delete user.");
      }
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleSaveChanges = async () => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/users/${selectedUser.id}/`, { 
        username: editUsername,
        first_name: editFirstName,
        last_name: editLastName,
        email: editEmail,
        role: editRole,
        is_permissions_customized: editIsCustomized,
        custom_permissions: editIsCustomized ? editPermissions : []
      });
      setSelectedUser(null);
      setSuccess('User updated successfully.');
      fetchData();
    } catch (err) {
      console.error("Failed to update user", err);
      setError("Failed to update user. Ensure username is unique.");
    }
  };

  const openModal = (user) => {
    setSelectedUser(user);
    setEditUsername(user.username || '');
    setEditFirstName(user.first_name || '');
    setEditLastName(user.last_name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || '');
    setEditIsCustomized(user.is_permissions_customized || false);
    
    // If they have customized overrides, load them. Else load default role permissions.
    if (user.is_permissions_customized) {
      setEditPermissions(user.custom_permissions || []);
    } else {
      const roleObj = roles.find(r => r.name === user.role);
      setEditPermissions(roleObj ? roleObj.permissions : []);
    }
  };

  const handleToggleNewPermission = (codename) => {
    setNewPermissions(prev =>
      prev.includes(codename) ? prev.filter(c => c !== codename) : [...prev, codename]
    );
  };

  const handleToggleEditPermission = (codename) => {
    setEditPermissions(prev =>
      prev.includes(codename) ? prev.filter(c => c !== codename) : [...prev, codename]
    );
  };

  // Filter Logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.id.toString() === searchTerm;
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => navigate(-1)}>← Back</button>
          <h1 style={{ margin: 0 }}>User Management</h1>
        </div>
      </div>

      {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="success-message" style={{ marginBottom: '1rem' }}>{success}</div>}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--text-bright)', marginBottom: '1rem' }}>Create New User</h3>
        
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Username *</label>
              <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Password *</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Role *</label>
              <select value={newRole} onChange={(e) => handleNewRoleChange(e.target.value)} style={inputStyle}>
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>First Name</label>
              <input type="text" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Last Name</label>
              <input type="text" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Email</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Module-Wise Permissions Control */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '1rem', fontWeight: 'bold' }}>
              <input 
                type="checkbox" 
                checked={newIsCustomized} 
                onChange={(e) => handleNewCustomizedToggle(e.target.checked)} 
              />
              Customize Permissions (Override Role Defaults)
            </label>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1.5rem',
              opacity: newIsCustomized ? 1 : 0.5,
              pointerEvents: newIsCustomized ? 'auto' : 'none',
              transition: 'opacity 0.2s ease'
            }}>
              {Object.keys(groupedPermissions).map(module => (
                <div key={module} style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', textTransform: 'capitalize', color: 'var(--primary-color)' }}>{module} Module</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {groupedPermissions[module].map(perm => (
                      <label key={perm.codename} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <input 
                          type="checkbox" 
                          checked={newPermissions.includes(perm.codename)} 
                          onChange={() => handleToggleNewPermission(perm.codename)}
                          disabled={!newIsCustomized}
                        />
                        {perm.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <button type="submit" className="btn-primary" style={{ width: '150px' }}>Create User</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--text-bright)' }}>System Users</h3>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="Search ID or Username..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, width: '200px', padding: '0.25rem 0.5rem' }} 
            />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ ...inputStyle, width: '150px', padding: '0.25rem 0.5rem' }}
            >
              <option value="">All Roles</option>
              {roles.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Role</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id} onClick={() => openModal(u)} style={{ cursor: 'pointer' }}>
                <td style={{ color: 'var(--text-bright)', fontWeight: 'bold' }}>#{u.id}</td>
                <td style={{ color: 'var(--text-bright)', fontWeight: '500' }}>{u.username}</td>
                <td>{u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : <span style={{color: 'var(--text-main)'}}>N/A</span>}</td>
                <td>
                  <span className={`role-badge role-${u.role}`}>
                    {u.role || 'None'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    className="btn-danger" 
                    style={confirmDeleteId === u.id ? { backgroundColor: '#FF5630', color: 'white' } : {}}
                    onClick={(e) => handleDeleteUser(u.id, e)}
                  >
                    {confirmDeleteId === u.id ? 'Confirm?' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && <p style={{marginTop: '1rem'}}>No users found matching filters.</p>}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--text-bright)', margin: 0 }}>Edit User: #{selectedUser.id}</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setSelectedUser(null)}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'center' }}>
                <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Username:</label>
                <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} style={inputStyle} />
                
                <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>First Name:</label>
                <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} style={inputStyle} />
                
                <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Last Name:</label>
                <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} style={inputStyle} />
                
                <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Email:</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={inputStyle} />
                
                <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Role:</label>
                <select value={editRole} onChange={(e) => handleEditRoleChange(e.target.value)} style={inputStyle}>
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Edit Modal Permissions Control */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '1rem', fontWeight: 'bold' }}>
                  <input 
                    type="checkbox" 
                    checked={editIsCustomized} 
                    onChange={(e) => handleEditCustomizedToggle(e.target.checked)} 
                  />
                  Customize Permissions (Override Role Defaults)
                </label>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '1rem',
                  opacity: editIsCustomized ? 1 : 0.5,
                  pointerEvents: editIsCustomized ? 'auto' : 'none',
                  transition: 'opacity 0.2s ease'
                }}>
                  {Object.keys(groupedPermissions).map(module => (
                    <div key={module} style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '0.75rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', textTransform: 'capitalize', color: 'var(--primary-color)' }}>{module}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {groupedPermissions[module].map(perm => (
                          <label key={perm.codename} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                            <input 
                              type="checkbox" 
                              checked={editPermissions.includes(perm.codename)} 
                              onChange={() => handleToggleEditPermission(perm.codename)}
                              disabled={!editIsCustomized}
                            />
                            {perm.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setSelectedUser(null)}>Close</button>
              <button className="btn-primary" onClick={handleSaveChanges}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const inputStyle = {
  padding: '0.5rem', 
  borderRadius: '4px', 
  border: '1px solid var(--border)',
  backgroundColor: 'var(--bg-main)', 
  color: 'var(--text-bright)',
  fontFamily: 'inherit'
};

export default Users;
