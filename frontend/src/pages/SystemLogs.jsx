import React, { useState, useEffect } from 'react';
import api from '../api';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDatabaseDown, setIsDatabaseDown] = useState(false);
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (actionType) params.action = actionType;

      const response = await api.get('/logs/', { params });
      setLogs(response.data.logs || []);
      setIsDatabaseDown(response.data.is_database_down || false);
    } catch (err) {
      setError('Failed to load system logs from the server.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionType]);

  const getBorderColor = (log) => {
    if (log.type === 'System Error' || log.action === 'ERROR') {
      return '#FF5630'; // Red
    }
    if (log.action.includes('CREATED') || log.action.includes('COMPLETED')) {
      return '#36B37E'; // Green
    }
    return '#0052CC'; // Blue
  };

  const getActionColor = (action) => {
    if (action === 'ERROR' || action.includes('FAIL')) return '#FF5630';
    if (action.includes('CREATED') || action.includes('COMPLETED')) return '#36B37E';
    return '#0052CC';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: 'var(--text-bright)', margin: 0 }}>System Activity & Error Logs</h1>
        <button 
          onClick={fetchLogs} 
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            color: 'var(--text-bright)',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Logs
        </button>
      </div>

      {isDatabaseDown && (
        <div style={{
          background: '#FFF3CD',
          border: '1px solid #FFEBA8',
          color: '#856404',
          padding: '16px',
          borderRadius: '4px',
          marginBottom: '24px',
          fontWeight: '500',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          ⚠️ <strong>Warning:</strong> The main logs database is currently offline or unreachable. 
          Showing backup logs fetched directly from the application server disk file.
        </div>
      )}

      {error && (
        <div style={{
          background: '#FFEBE9',
          border: '1px solid #FFC4C0',
          color: '#FF5630',
          padding: '16px',
          borderRadius: '4px',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        background: 'var(--bg-card)',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Search Logs</label>
          <input 
            type="text"
            placeholder="Search by keywords or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-bright)',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ width: '200px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Filter Action</label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-bright)',
              outline: 'none'
            }}
          >
            <option value="">All Actions</option>
            <option value="PROJECT_CREATED">PROJECT_CREATED</option>
            <option value="PROJECT_COMPLETED">PROJECT_COMPLETED</option>
            <option value="TASK_CREATED">TASK_CREATED</option>
            <option value="TASK_UPDATED">TASK_UPDATED</option>
            <option value="STATUS_DELETED">STATUS_DELETED</option>
            <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
            <option value="ERROR">ERROR / CRITICAL</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-main)' }}>Loading system logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px', 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border)',
          borderRadius: '8px',
          color: 'var(--text-main)'
        }}>
          No logs found matching your filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.map((log) => (
            <div 
              key={log.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: `5px solid ${getBorderColor(log)}`,
                borderRadius: '6px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ flex: 1, paddingRight: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: `${getActionColor(log.action)}15`,
                    color: getActionColor(log.action),
                    border: `1px solid ${getActionColor(log.action)}30`
                  }}>
                    {log.action}
                  </span>
                  <span style={{ color: 'var(--text-main)', fontSize: '12px' }}>
                    Type: <strong>{log.type}</strong>
                  </span>
                  <span style={{ color: 'var(--text-main)', fontSize: '12px' }}>
                    By: <strong>{log.user_username}</strong>
                  </span>
                </div>
                <div style={{ 
                  color: 'var(--text-bright)', 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: log.action === 'ERROR' ? 'monospace' : 'inherit',
                  fontSize: log.action === 'ERROR' ? '12px' : '14px',
                  backgroundColor: log.action === 'ERROR' ? 'rgba(255,86,48,0.05)' : 'transparent',
                  padding: log.action === 'ERROR' ? '8px 12px' : 0,
                  borderRadius: '4px',
                  border: log.action === 'ERROR' ? '1px solid rgba(255,86,48,0.1)' : 'none'
                }}>
                  {log.description}
                </div>
              </div>
              <div style={{ color: 'var(--text-main)', fontSize: '11px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SystemLogs;
