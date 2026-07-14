import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ChangePassword = () => {
  const navigate = useNavigate();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }
    
    if (newPassword.length < 5) {
      setErrorMsg("New password must be at least 5 characters.");
      return;
    }

    try {
      await api.post('/users/change-password/', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setSuccessMsg('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to update password. Please check your current password.');
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/profile')}>← Back to Profile</button>
          <h1 style={{ margin: 0 }}>Change Password</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        {successMsg && <div style={{ color: '#36B37E', marginBottom: '1rem', fontWeight: 'bold' }}>{successMsg}</div>}
        {errorMsg && <div style={{ color: '#FF5630', marginBottom: '1rem', fontWeight: 'bold' }}>{errorMsg}</div>}
        
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Current Password</label>
            <input 
              type="password" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              required 
              style={inputStyle} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>New Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
              style={inputStyle} 
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              style={inputStyle} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
             <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>Update Password</button>
          </div>
        </form>
      </div>
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

export default ChangePassword;
