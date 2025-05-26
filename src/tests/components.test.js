import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import Repository from '../components/Repository';
import Settings from '../components/Settings';

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock electron's ipcRenderer
const ipcRendererMock = {
  invoke: jest.fn()
};

window.require = jest.fn(() => ({
  electron: {
    ipcRenderer: ipcRendererMock
  }
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  test('renders dashboard with free usage available', () => {
    localStorageMock.getItem.mockReturnValueOnce(null); // No usage history
    localStorageMock.getItem.mockReturnValueOnce('true'); // Free usage available
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/You have a free usage available/i)).toBeInTheDocument();
  });

  test('renders dashboard with usage history', () => {
    const mockHistory = JSON.stringify([
      {
        date: '2025-05-20T10:00:00.000Z',
        repository: 'test-repo',
        fileCount: 3,
        free: true,
        price: 0
      }
    ]);
    
    localStorageMock.getItem.mockReturnValueOnce(mockHistory);
    localStorageMock.getItem.mockReturnValueOnce('false'); // No free usage available
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('test-repo')).toBeInTheDocument();
  });
});

describe('Repository Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
    ipcRendererMock.invoke.mockReset();
  });

  test('renders repository selection UI', () => {
    render(
      <BrowserRouter>
        <Repository />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Update Repository')).toBeInTheDocument();
    expect(screen.getByText('Select Repository')).toBeInTheDocument();
  });

  test('handles repository selection', async () => {
    ipcRendererMock.invoke.mockResolvedValueOnce({
      success: true,
      path: 'C:/test-repo'
    });
    
    render(
      <BrowserRouter>
        <Repository />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('Select Repository'));
    
    await waitFor(() => {
      expect(ipcRendererMock.invoke).toHaveBeenCalledWith('select-repository');
    });
  });

  test('handles file selection and analysis', async () => {
    localStorageMock.getItem.mockReturnValue('true'); // Free usage available
    
    ipcRendererMock.invoke
      .mockResolvedValueOnce({ success: true, path: 'C:/test-repo' }) // select-repository
      .mockResolvedValueOnce({ success: true, files: ['file1.js', 'file2.js'] }) // select-files
      .mockResolvedValueOnce({ success: true, suggestedMessage: 'Update JS files' }) // analyze-changes
      .mockResolvedValueOnce({ success: true, resourceUsage: 100, price: '2.99', hasMergeConflicts: false }); // calculate-resource-usage
    
    render(
      <BrowserRouter>
        <Repository />
      </BrowserRouter>
    );
    
    // Select repository
    fireEvent.click(screen.getByText('Select Repository'));
    
    await waitFor(() => {
      expect(ipcRendererMock.invoke).toHaveBeenCalledWith('select-repository');
    });
    
    // Select files
    fireEvent.click(screen.getByText('Select Files'));
    
    await waitFor(() => {
      expect(ipcRendererMock.invoke).toHaveBeenCalledWith('select-files', 'C:/test-repo');
    });
  });
});

describe('Settings Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  test('renders settings form', () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub Username')).toBeInTheDocument();
  });

  test('loads user profile from localStorage', () => {
    const mockUser = JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      githubUsername: 'testuser'
    });
    
    localStorageMock.getItem.mockReturnValueOnce(mockUser);
    
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );
    
    expect(screen.getByLabelText('Name').value).toBe('Test User');
    expect(screen.getByLabelText('Email').value).toBe('test@example.com');
    expect(screen.getByLabelText('GitHub Username').value).toBe('testuser');
  });

  test('saves settings to localStorage', async () => {
    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );
    
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('GitHub Username'), { target: { value: 'newuser' } });
    
    fireEvent.click(screen.getByText('Save Settings'));
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('easygit_user', JSON.stringify({
        name: 'New User',
        email: 'new@example.com',
        githubUsername: 'newuser'
      }));
    });
  });
});
