import React, { useState, useEffect } from 'react';

const { ipcRenderer } = window.require('electron');

const Repository = () => {
  const [repoPath, setRepoPath] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [resourceUsage, setResourceUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasMergeConflicts, setHasMergeConflicts] = useState(false);
  const [freeUsageAvailable, setFreeUsageAvailable] = useState(false);

  useEffect(() => {
    // Check if free usage is available
    const freeUsage = localStorage.getItem('easygit_free_usage_available');
    setFreeUsageAvailable(freeUsage === 'true');
  }, []);

  const selectRepository = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await ipcRenderer.invoke('select-repository');
      
      if (result.success) {
        setRepoPath(result.path);
        setSelectedFiles([]);
        setCommitMessage('');
        setResourceUsage(null);
      } else if (!result.canceled) {
        setError(result.error || 'Failed to select repository');
      }
    } catch (err) {
      setError('Error selecting repository: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectFiles = async () => {
    if (!repoPath) {
      setError('Please select a repository first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const result = await ipcRenderer.invoke('select-files', repoPath);
      
      if (result.success) {
        setSelectedFiles(result.files);
        
        // Analyze changes and get AI commit message
        const analysis = await ipcRenderer.invoke('analyze-changes', repoPath, result.files);
        
        if (analysis.success) {
          setCommitMessage(analysis.suggestedMessage);
          
          // Calculate resource usage and price
          const usage = await ipcRenderer.invoke('calculate-resource-usage', repoPath, result.files);
          
          if (usage.success) {
            setResourceUsage(usage);
            setHasMergeConflicts(usage.hasMergeConflicts);
          }
        }
      }
    } catch (err) {
      setError('Error selecting files: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const commitAndPush = async () => {
    if (!repoPath || selectedFiles.length === 0) {
      setError('Please select a repository and files first');
      return;
    }

    if (!commitMessage.trim()) {
      setError('Please provide a commit message');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // If this is not a free usage, we would handle payment here
      // For now, we'll simulate successful payment
      const paymentSuccessful = true;
      
      if (paymentSuccessful) {
        const result = await ipcRenderer.invoke('commit-and-push', repoPath, selectedFiles, commitMessage);
        
        if (result.success) {
          setSuccess('Repository updated successfully!');
          
          // Update usage history
          const historyItem = {
            date: new Date().toISOString(),
            repository: repoPath.split('/').pop(),
            fileCount: selectedFiles.length,
            free: freeUsageAvailable,
            price: resourceUsage ? resourceUsage.price : 0
          };
          
          const storedHistory = localStorage.getItem('easygit_usage_history');
          const history = storedHistory ? JSON.parse(storedHistory) : [];
          history.unshift(historyItem);
          localStorage.setItem('easygit_usage_history', JSON.stringify(history.slice(0, 10)));
          
          // If free usage was used, mark it as used
          if (freeUsageAvailable) {
            localStorage.setItem('easygit_free_usage_available', 'false');
            localStorage.setItem('easygit_last_free_usage', new Date().toISOString());
            setFreeUsageAvailable(false);
          }
          
          // Reset state
          setSelectedFiles([]);
          setCommitMessage('');
          setResourceUsage(null);
        } else {
          setError(result.error || 'Failed to update repository');
        }
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      setError('Error updating repository: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="repository">
      <h2>Update Repository</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="card">
        <h3>Select Repository</h3>
        <p>Choose a local Git repository to update</p>
        
        <div className="form-group">
          <input 
            type="text" 
            className="form-control" 
            value={repoPath} 
            readOnly 
            placeholder="No repository selected" 
          />
        </div>
        
        <button 
          className="btn-primary" 
          onClick={selectRepository} 
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Select Repository'}
        </button>
      </div>
      
      {repoPath && (
        <div className="card">
          <h3>Select Files</h3>
          <p>Choose the files you want to update</p>
          
          <button 
            className="btn-primary" 
            onClick={selectFiles} 
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Select Files'}
          </button>
          
          {selectedFiles.length > 0 && (
            <div className="file-list-container">
              <h4>Selected Files ({selectedFiles.length})</h4>
              <ul className="file-list">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="file-item">
                    {file.split('/').pop()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {selectedFiles.length > 0 && (
        <div className="card">
          <h3>Commit Message</h3>
          <p>Review and edit the AI-suggested commit message</p>
          
          <div className="commit-message-container">
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Enter commit message"
            />
          </div>
          
          {resourceUsage && (
            <div className="resource-usage">
              <h3>Resource Usage</h3>
              <p>
                Based on the size and complexity of your changes, the following resource usage has been calculated:
              </p>
              <div className="price-display">
                {freeUsageAvailable ? 'FREE' : `$${resourceUsage.price}`}
              </div>
              {freeUsageAvailable && (
                <p><small>Using your free update (one every 3 months)</small></p>
              )}
            </div>
          )}
          
          {hasMergeConflicts && (
            <div className="merge-conflict">
              <h3>Merge Conflicts Detected</h3>
              <p>
                We've detected potential merge conflicts. EasyGit will help you resolve these conflicts during the update process.
              </p>
            </div>
          )}
          
          <button 
            className="btn-primary" 
            onClick={commitAndPush} 
            disabled={loading}
            style={{ marginTop: '1rem' }}
          >
            {loading ? 'Processing...' : 'Commit & Push'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Repository;
