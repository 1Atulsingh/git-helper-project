import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    githubUsername: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load user profile from local storage
    const storedUser = localStorage.getItem('easygit_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prevUser => ({
      ...prevUser,
      [name]: value
    }));
  };

  const saveSettings = () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate inputs
      if (!user.name.trim()) {
        setError('Name is required');
        return;
      }
      
      if (!user.email.trim()) {
        setError('Email is required');
        return;
      }
      
      // Save user profile to local storage
      localStorage.setItem('easygit_user', JSON.stringify(user));
      
      setSuccess('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Error saving settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings">
      <h2>Settings</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="card">
        <h3>User Profile</h3>
        <p>Configure your user information for Git commits</p>
        
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            value={user.name}
            onChange={handleChange}
            placeholder="Your name"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-control"
            value={user.email}
            onChange={handleChange}
            placeholder="Your email"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="githubUsername">GitHub Username</label>
          <input
            type="text"
            id="githubUsername"
            name="githubUsername"
            className="form-control"
            value={user.githubUsername}
            onChange={handleChange}
            placeholder="Your GitHub username"
          />
        </div>
        
        <button
          className="btn-primary"
          onClick={saveSettings}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      
      <div className="card">
        <h3>About EasyGit</h3>
        <p>
          EasyGit is a tool designed to simplify GitHub repository updates while maintaining proper version control.
          It provides an intuitive interface for committing and pushing changes with AI-suggested commit messages.
        </p>
        <p>
          <strong>Version:</strong> 1.0.0
        </p>
      </div>
    </div>
  );
};

export default Settings;
