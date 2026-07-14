import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${user.id}/`);
        setFirstName(res.data.first_name || '');
        setLastName(res.data.last_name || '');
        setEmail(res.data.email || '');
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    if (user?.id) fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.patch(`/users/${user.id}/`, {
        first_name: firstName,
        last_name: lastName,
        email: email
      });
      setSuccessMsg('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update profile.');
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Profile</h1>
        <button className="btn-secondary" onClick={() => navigate('/change-password')}>Change Password</button>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {successMsg && <div style={{ color: '#36B37E', marginBottom: '1rem', fontWeight: 'bold' }}>{successMsg}</div>}
        {errorMsg && <div style={{ color: '#FF5630', marginBottom: '1rem', fontWeight: 'bold' }}>{errorMsg}</div>}
        
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Username (Unchangeable)</label>
              <input type="text" value={user.username} disabled style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Role (Unchangeable)</label>
              <input type="text" value={user.role} disabled style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>First Name</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Last Name</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
             <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>Save Profile</button>
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
  width: '100%'
};

export default Profile;
