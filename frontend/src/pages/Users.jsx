import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  
  // Create User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('DEVELOPER');
  const [error, setError] = useState('');

  // Filtering & Searching State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users/', {
        username: newUsername,
        password: newPassword,
        first_name: newFirstName,
        last_name: newLastName,
        email: newEmail,
        role: newRole
      });
      setNewUsername('');
      setNewPassword('');
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewRole('DEVELOPER');
      fetchUsers();
    } catch (error) {
      setError('Failed to create user. Ensure username is unique.');
      console.error("Create user error", error);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDeleteUser = async (id, e) => {
    e.stopPropagation(); // prevent opening modal
    e.preventDefault();
    
    if (confirmDeleteId === id) {
      try {
        await api.delete(`/users/${id}/`);
        setConfirmDeleteId(null);
        fetchUsers();
      } catch (err) {
        console.error("Failed to delete user", err);
        alert("Failed to delete user.");
      }
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000); // reset after 3 seconds
    }
  };

  const handleSaveChanges = async () => {
    try {
      await api.patch(`/users/${selectedUser.id}/`, { 
        username: editUsername,
        first_name: editFirstName,
        last_name: editLastName,
        email: editEmail,
        role: editRole 
      });
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to update user", err);
      alert("Failed to update user. Ensure username is unique.");
    }
  };

  const openModal = (user) => {
    setSelectedUser(user);
    setEditUsername(user.username || '');
    setEditFirstName(user.first_name || '');
    setEditLastName(user.last_name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'DEVELOPER');
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

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--text-bright)', marginBottom: '1rem' }}>Create New User</h3>
        {error && <div style={{ color: '#FF5630', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Username *</label>
              <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Password *</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Role *</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={inputStyle}>
                <option value="ADMIN">Admin</option>
                <option value="PM">Project Manager</option>
                <option value="DEVELOPER">Developer</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>First Name</label>
              <input type="text" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Last Name</label>
              <input type="text" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Email</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />
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
              <option value="ADMIN">Admin</option>
              <option value="PM">Project Manager</option>
              <option value="DEVELOPER">Developer</option>
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
                    {u.role}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--text-bright)', margin: 0 }}>Edit User: #{selectedUser.id}</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setSelectedUser(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1rem', alignItems: 'center' }}>
                
                <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Username:</label>
                <input 
                  type="text" 
                  value={editUsername} 
                  onChange={(e) => setEditUsername(e.target.value)} 
                  style={inputStyle} 
                />
                
                <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>First Name:</label>
                <input 
                  type="text" 
                  value={editFirstName} 
                  onChange={(e) => setEditFirstName(e.target.value)} 
                  style={inputStyle} 
                />
                
                <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Last Name:</label>
                <input 
                  type="text" 
                  value={editLastName} 
                  onChange={(e) => setEditLastName(e.target.value)} 
                  style={inputStyle} 
                />
                
                <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Email:</label>
                <input 
                  type="email" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  style={inputStyle} 
                />
                
                <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Role:</label>
                <select 
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  style={inputStyle}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="PM">Project Manager</option>
                  <option value="DEVELOPER">Developer</option>
                </select>
                
              </div>
            </div>
            <div className="modal-footer">
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
