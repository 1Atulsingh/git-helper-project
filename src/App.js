import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Repository from './components/Repository';
import Payment from './components/Payment';
import Settings from './components/Settings';
import './styles/main.css';

const { ipcRenderer } = window.require('electron');

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user profile from local storage
    const storedUser = localStorage.getItem('easygit_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
    
    // Check for free usage eligibility
    checkFreeUsageEligibility();
  }, []);

  const checkFreeUsageEligibility = () => {
    const lastFreeUsage = localStorage.getItem('easygit_last_free_usage');
    const now = new Date();
    
    if (!lastFreeUsage) {
      localStorage.setItem('easygit_free_usage_available', 'true');
      return;
    }
    
    const lastUsageDate = new Date(lastFreeUsage);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    if (lastUsageDate < threeMonthsAgo) {
      localStorage.setItem('easygit_free_usage_available', 'true');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="logo">
            <h1>EasyGit</h1>
          </div>
          <nav>
            <ul>
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/repository">Repository</Link></li>
              <li><Link to="/settings">Settings</Link></li>
            </ul>
          </nav>
          <div className="user-info">
            {user ? (
              <span>{user.name}</span>
            ) : (
              <button className="btn-primary">Sign In</button>
            )}
          </div>
        </header>
        
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/repository" element={<Repository />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} EasyGit - Simplifying Git for Everyone</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
