import React, { useState, useEffect, useCallback } from 'react';

import { FaBell, FaTimes, FaCheck } from 'react-icons/fa';
import './App.css';

function Dashboard({ onLogout }) {
  const [grinderData, setGrinderData] = useState({
    forward: false,
    reverse: false,
    jam: false,
      LOWLEVEL: false,

    autoMode: true,
    manualMode: false,
   
    gatewayConnected: true,
  });

  const [alarms, setAlarms] = useState([]);
  const [alarmCount, setAlarmCount] = useState(0);
  const [showAlarmPanel, setShowAlarmPanel] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [ isResetting , setIsResetting] = useState(false);

  const API_URL = 'https://backend-7irv.onrender.com';
  const token = localStorage.getItem('token');

  // Fetch alarms function - defined before useEffect
  const fetchAlarms = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/alarms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAlarms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching alarms:', error);
      setAlarms([]);
    }
  }, [token]);

  // Fetch grinder data

  useEffect(() => {
    const fetchGrinderData = async () => {
      try {
        console.log('Fetching grinder data with token:', token ? 'Token exists' : 'No token');
        const response = await fetch(`${API_URL}/api/grinder-data`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Received data:', data);
        setGrinderData({...data});
      } catch (error) {
        console.error('Error fetching grinder data:', error);
      }
    };


    // Initial fetch
    fetchGrinderData();

    // Poll every 2 seconds for live updates
    const interval = setInterval(fetchGrinderData, 2000);

    return () => clearInterval(interval);
  }, [token]);

  // Fetch alarm count

  useEffect(() => {
    const fetchAlarmCount = async () => {
      try {
        const response = await fetch(`${API_URL}/api/alarms/count`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setAlarmCount(data.count);
      } catch (error) {
        console.error('Error fetching alarm count:', error);
      }
    };

    fetchAlarmCount();
    const interval = setInterval(fetchAlarmCount, 3000);

    return () => clearInterval(interval);
  }, [token]);


  // Fetch alarms when panel is opened
  useEffect(() => {
    if (showAlarmPanel) {
      fetchAlarms();
    }
  }, [showAlarmPanel, fetchAlarms]);


  const handleReset = async () => {
    setIsResetting(true);
    try {
      const response = await fetch(`${API_URL}/api/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setResetMessage('Reset sent successfully');
        setTimeout(() => setResetMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error resetting:', error);
      setResetMessage('Reset failed');
      setTimeout(() => setResetMessage(''), 3000);
    } finally {
      setIsResetting(false);
    }
  };

  const acknowledgeAlarm = async (id) => {
    try {
      await fetch(`${API_URL}/api/alarms/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      fetchAlarms();
      // Update count
      const response = await fetch(`${API_URL}/api/alarms/count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAlarmCount(data.count);
    } catch (error) {
      console.error('Error acknowledging alarm:', error);
    }
  };

  const acknowledgeAllAlarms = async () => {
    try {
      await fetch(`${API_URL}/api/alarms/acknowledge-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      fetchAlarms();
      setAlarmCount(0);
    } catch (error) {
      console.error('Error acknowledging all alarms:', error);
    }
  };

  const deleteAlarm = async (id) => {
    try {
      await fetch(`${API_URL}/api/alarms/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchAlarms();
      // Update count
      const response = await fetch(`${API_URL}/api/alarms/count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAlarmCount(data.count);
    } catch (error) {
      console.error('Error deleting alarm:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleString();
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo-section">
          <div className="logo-icon">📊</div>
          <h1>LOGO Grinder Dashboard</h1>
        </div>
        
        <div className="header-right">
          <div className="status-indicator">
            <span className={`status-dot ${grinderData.gatewayConnected ? 'connected' : 'disconnected'}`}></span>
            <span>Gateway</span>
          </div>
          <div className="alarm-bell" onClick={() => setShowAlarmPanel(!showAlarmPanel)}>
            <FaBell />
            {alarmCount > 0 && <span className="alarm-count">{alarmCount}</span>}
          </div>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {/* Main Dashboard */}
      <div className="dashboard-content">
        <div className="dashboard-grid">
          {/* Motor Image */}
          <div className="motor-section">
              <div className="motor-image">
              <div className="motor-body">
                <div className="motor-coils"></div>
                <div className="motor-shaft"></div>
              </div>
            </div>
          </div>

          {/* Top Row Indicators */}
          <div className="indicators-top">
            <div className="indicator-lamp">
              <div className={`lamp green ${grinderData.forward ? 'active' : ''}`}>
                <div className="lamp-glow"></div>
              </div>
              <p>Forward</p>
            </div>

            <div className="indicator-lamp">
              <div className={`lamp yellow ${grinderData.reverse ? 'active' : ''}`}>
                <div className="lamp-glow"></div>
              </div>
              <p>Reverse</p>
            </div>

            <div className="indicator-lamp">
              <div className={`lamp red ${grinderData.jam ? 'active' : ''}`}>
                <div className="lamp-glow"></div>
                <div className="lamp-icon">🔔</div>
              </div>
              <p>Jam / Buzzer</p>
            </div>

            
          </div>

          {/* Bottom Row Indicators */}
          <div className="indicators-bottom">
            <div className="indicator-lamp">
              <div className={`lamp red ${grinderData.LOWLEVEL ? 'active' : ''}`}>
                <div className="lamp-glow"></div>
                <div className="lamp-icon"></div>
              </div>
              <p> LOW LEVEL</p>
            </div>

            <div className="indicator-lamp">
              <div className={`lamp cyan ${grinderData.autoMode ? 'active' : ''}`}>
                <div className="lamp-glow"></div>
                <div className="lamp-icon">⚙️</div>
              </div>
              <p>AUTO</p>
            </div>

            <div className="indicator-lamp">
              <div className={`lamp blue ${grinderData.manualMode ? 'active' : ''}`}>
                <div className="lamp-glow"></div>
                <div className="lamp-icon">✋</div>
              </div>
              <p>MANUAL</p>
            </div>

            <div className="reset-section">
              <button 
                className="reset-button" 
                onClick={handleReset}
                disabled={isResetting}
              >
                RESET
              </button>
              {resetMessage && (
                <p className="reset-message">{resetMessage}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alarm Panel */}
      {showAlarmPanel && (
        <div className="alarm-panel-overlay" onClick={() => setShowAlarmPanel(false)}>
          <div className="alarm-panel" onClick={(e) => e.stopPropagation()}>
            <div className="alarm-panel-header">
              <h2>Alarms & Notifications</h2>
              <div className="alarm-panel-actions">
                {alarmCount > 0 && (
                  <button className="ack-all-btn" onClick={acknowledgeAllAlarms}>
                    <FaCheck /> Acknowledge All
                  </button>
                )}
                <button className="close-btn" onClick={() => setShowAlarmPanel(false)}>
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="alarm-list">
              {alarms.length === 0 ? (
                <div className="no-alarms">
                  <p>No alarms to display</p>
                </div>
              ) : (
                alarms.map((alarm) => (
                  <div 
                    key={alarm._id} 
                    className={`alarm-item ${alarm.severity} ${alarm.acknowledged ? 'acknowledged' : ''}`}
                  >
                    <div className="alarm-content">
                      <div className="alarm-header">
                        <span className="alarm-type">{alarm.type}</span>
                        <span className="alarm-time">{formatTimestamp(alarm.timestamp)}</span>
                      </div>
                      <p className="alarm-message">{alarm.message}</p>
                      <div className="alarm-severity">
                        <span className={`severity-badge ${alarm.severity}`}>
                          {alarm.severity.toUpperCase()}
                        </span>
                        {alarm.acknowledged && (
                          <span className="acknowledged-badge">
                            <FaCheck /> Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="alarm-actions">
                      {!alarm.acknowledged && (
                        <button 
                          className="ack-btn"
                          onClick={() => acknowledgeAlarm(alarm._id)}
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button 
                        className="delete-btn"
                        onClick={() => deleteAlarm(alarm._id)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
