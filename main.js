const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const simpleGit = require('simple-git');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // Load the index.html of the app
  mainWindow.loadURL(
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : url.format({
          pathname: path.join(__dirname, 'dist', 'index.html'),
          protocol: 'file:',
          slashes: true
        })
  );

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function() {
  if (mainWindow === null) createWindow();
});

// IPC handlers for Git operations
ipcMain.handle('select-repository', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled) {
    const repoPath = result.filePaths[0];
    try {
      const git = simpleGit(repoPath);
      const isRepo = await git.checkIsRepo();
      
      if (isRepo) {
        return { success: true, path: repoPath };
      } else {
        return { success: false, error: 'Selected directory is not a Git repository' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, canceled: true };
});

ipcMain.handle('select-files', async (event, repoPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    defaultPath: repoPath
  });
  
  if (!result.canceled) {
    return { success: true, files: result.filePaths };
  }
  
  return { success: false, canceled: true };
});

ipcMain.handle('analyze-changes', async (event, repoPath, files) => {
  try {
    const git = simpleGit(repoPath);
    const status = await git.status();
    
    // Get file changes for AI commit message generation
    const fileChanges = [];
    
    for (const file of files) {
      const relativePath = path.relative(repoPath, file);
      
      // Check if file is new or modified
      const isNew = status.not_added.includes(relativePath);
      const isModified = status.modified.includes(relativePath);
      
      if (isNew || isModified) {
        let content = '';
        try {
          content = fs.readFileSync(file, 'utf8');
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
        }
        
        fileChanges.push({
          path: relativePath,
          status: isNew ? 'new' : 'modified',
          content: content.substring(0, 1000) // Limit content size
        });
      }
    }
    
    // Here we would call the AI service to generate commit messages
    // For now, we'll simulate it with a basic algorithm
    const suggestedMessage = generateCommitMessage(fileChanges);
    
    return {
      success: true,
      changes: fileChanges,
      suggestedMessage
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('commit-and-push', async (event, repoPath, files, commitMessage) => {
  try {
    const git = simpleGit(repoPath);
    
    // Add files
    for (const file of files) {
      const relativePath = path.relative(repoPath, file);
      await git.add(relativePath);
    }
    
    // Commit changes
    await git.commit(commitMessage);
    
    // Push changes
    const pushResult = await git.push();
    
    return { success: true, result: pushResult };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Simple commit message generator (placeholder for AI service)
function generateCommitMessage(fileChanges) {
  if (fileChanges.length === 0) return 'Update repository';
  
  const fileTypes = new Set();
  const actions = new Set();
  
  fileChanges.forEach(file => {
    const extension = path.extname(file.path).replace('.', '');
    if (extension) fileTypes.add(extension);
    actions.add(file.status);
  });
  
  const fileTypeStr = Array.from(fileTypes).join(', ');
  const actionStr = actions.has('new') ? (actions.has('modified') ? 'Add and update' : 'Add') : 'Update';
  
  if (fileChanges.length === 1) {
    return `${actionStr} ${fileChanges[0].path}`;
  } else {
    return `${actionStr} ${fileChanges.length} ${fileTypeStr} files`;
  }
}

// Calculate resource usage for pricing
ipcMain.handle('calculate-resource-usage', async (event, repoPath, files) => {
  try {
    let totalSize = 0;
    let complexity = 1;
    
    for (const file of files) {
      const stats = fs.statSync(file);
      totalSize += stats.size;
    }
    
    // Check for merge conflicts (increases complexity)
    const git = simpleGit(repoPath);
    const status = await git.status();
    
    if (status.conflicted.length > 0) {
      complexity = 2; // Double the complexity for merge conflicts
    }
    
    // Calculate resource usage
    const resourceUsage = (totalSize / 1024) * complexity;
    
    // Calculate price (resource usage * 3)
    const price = resourceUsage * 3;
    
    return {
      success: true,
      resourceUsage,
      price: Math.max(0.50, price.toFixed(2)), // Minimum price of $0.50
      hasMergeConflicts: status.conflicted.length > 0
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
