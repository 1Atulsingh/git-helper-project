import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [usageHistory, setUsageHistory] = useState([]);
  const [freeUsageAvailable, setFreeUsageAvailable] = useState(false);

  useEffect(() => {
    // Load usage history from local storage
    const storedHistory = localStorage.getItem('easygit_usage_history');
    if (storedHistory) {
      setUsageHistory(JSON.parse(storedHistory));
    }

    // Check if free usage is available
    const freeUsage = localStorage.getItem('easygit_free_usage_available');
    setFreeUsageAvailable(freeUsage === 'true');
  }, []);

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      
      <div className="card">
        <h3>Welcome to EasyGit</h3>
        <p>
          EasyGit makes GitHub version control simple and accessible. 
          Update your repositories with proper version control without the complexity of Git commands.
        </p>
        {freeUsageAvailable && (
          <div className="alert alert-success">
            <strong>Good news!</strong> You have a free usage available. Start updating your repositories now!
          </div>
        )}
      </div>
      
      <div className="card">
        <h3>Quick Start</h3>
        <div className="quick-start-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Select Repository</h4>
              <p>Choose a local Git repository to update</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Select Files</h4>
              <p>Choose the files you want to update</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Review Changes</h4>
              <p>Review AI-suggested commit messages</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Commit & Push</h4>
              <p>Update your repository with proper version control</p>
            </div>
          </div>
        </div>
      </div>
      
      {usageHistory.length > 0 && (
        <div className="usage-history">
          <h3>Recent Activity</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Repository</th>
                <th>Files</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {usageHistory.map((item, index) => (
                <tr key={index}>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>{item.repository}</td>
                  <td>{item.fileCount} files</td>
                  <td>{item.free ? 'Free' : `$${item.price}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
