import { useEffect, useState } from 'react';
import './App.css';

const initialTask = {
  title: '',
  description: '',
  priority: 'low',
  status: 'todo',
  due_date: '',
  assignee: '',
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('accessToken') || '');
  const [authType, setAuthType] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState(initialTask);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  const requestHeaders = (hasJson = true) => {
    const headers = {};
    if (hasJson) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const login = async (credentials) => {
    const response = await fetch('/api/login/', {
      method: 'POST',
      headers: requestHeaders(),
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('accessToken', data.access);
      setToken(data.access);
      setMessage('Logged in successfully.');
      setError('');
      return true;
    }
    setError(data.detail || 'Login failed');
    return false;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (authType === 'register') {
      const response = await fetch('/api/register/', {
        method: 'POST',
        headers: requestHeaders(),
        body: JSON.stringify(authForm),
      });
      const data = await response.json();
      if (response.ok) {
        await login(authForm);
      } else {
        setError(data.username || data.password || JSON.stringify(data));
      }
      return;
    }

    await login(authForm);
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks/', {
        headers: requestHeaders(false),
      });
      if (!response.ok) {
        throw new Error('Unable to load tasks');
      }
      const data = await response.json();
      setTasks(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTaskChange = (e) => {
    setTaskForm({ ...taskForm, [e.target.name]: e.target.value });
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const payload = {
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      status: taskForm.status,
      due_date: taskForm.due_date || null,
    };

    if (taskForm.assignee) {
      payload.assignee = Number(taskForm.assignee);
    }

    const method = selectedTaskId ? 'PUT' : 'POST';
    const url = selectedTaskId ? `/api/tasks/${selectedTaskId}/` : '/api/tasks/';

    const response = await fetch(url, {
      method,
      headers: requestHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage(selectedTaskId ? 'Task updated.' : 'Task created.');
      setTaskForm(initialTask);
      setSelectedTaskId(null);
      fetchTasks();
    } else {
      setError(data.detail || JSON.stringify(data));
    }
  };

  const handleSelectTask = (task) => {
    setSelectedTaskId(task.id);
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'low',
      status: task.status || 'todo',
      due_date: task.due_date || '',
      assignee: task.assignee ?? '',
    });
    setMessage('');
    setError('');
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    const response = await fetch(`/api/tasks/${taskId}/`, {
      method: 'DELETE',
      headers: requestHeaders(false),
    });
    if (response.ok) {
      setMessage('Task deleted.');
      fetchTasks();
    } else {
      const data = await response.json();
      setError(data.detail || 'Delete failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken('');
    setTasks([]);
    setTaskForm(initialTask);
    setSelectedTaskId(null);
    setMessage('Logged out.');
  };

  if (!token) {
    return (
      <div className="app-shell">
        <div className="auth-card">
          <h1>Task Manager</h1>
          <div className="toggle-buttons">
            <button className={authType === 'login' ? 'active' : ''} onClick={() => setAuthType('login')}>
              Login
            </button>
            <button className={authType === 'register' ? 'active' : ''} onClick={() => setAuthType('register')}>
              Register
            </button>
          </div>
          <form onSubmit={handleAuthSubmit} className="auth-form">
            <label>
              Username
              <input name="username" value={authForm.username} onChange={handleAuthChange} required />
            </label>
            <label>
              Password
              <input name="password" type="password" value={authForm.password} onChange={handleAuthChange} required />
            </label>
            <button type="submit">{authType === 'login' ? 'Login' : 'Register'}</button>
          </form>
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="header-bar">
        <h1>My Tasks</h1>
        <button className="secondary" onClick={logout}>
          Logout
        </button>
      </header>

      <div className="main-grid">
        <section className="task-panel">
          <div className="panel-header">
            <h2>{selectedTaskId ? 'Edit Task' : 'Create Task'}</h2>
            <button className="secondary" onClick={() => { setSelectedTaskId(null); setTaskForm(initialTask); setMessage(''); setError(''); }}>
              New
            </button>
          </div>
          <form onSubmit={handleTaskSubmit} className="task-form">
            <label>
              Title
              <input name="title" value={taskForm.title} onChange={handleTaskChange} required />
            </label>
            <label>
              Description
              <textarea name="description" value={taskForm.description} onChange={handleTaskChange} rows="4" />
            </label>
            <label>
              Priority
              <select name="priority" value={taskForm.priority} onChange={handleTaskChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" value={taskForm.status} onChange={handleTaskChange}>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>
            <label>
              Due Date
              <input name="due_date" type="date" value={taskForm.due_date} onChange={handleTaskChange} />
            </label>
            <label>
              Assignee ID
              <input name="assignee" type="number" min="1" value={taskForm.assignee} onChange={handleTaskChange} placeholder="Optional user ID" />
            </label>
            <button type="submit">{selectedTaskId ? 'Save changes' : 'Create task'}</button>
          </form>
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}
        </section>

        <section className="task-list">
          <h2>Assigned / Created Tasks</h2>
          {tasks.length === 0 ? (
            <p>No tasks found yet.</p>
          ) : (
            <div className="task-items">
              {tasks.map((task) => (
                <article key={task.id} className="task-card">
                  <div className="task-card-top">
                    <h3>{task.title}</h3>
                    <span className={`status ${task.status}`}>{task.status.replace('_', ' ')}</span>
                  </div>
                  <p>{task.description || 'No description'}</p>
                  <div className="task-meta">
                    <span>Priority: {task.priority}</span>
                    <span>Due: {task.due_date || 'N/A'}</span>
                  </div>
                  <div className="task-meta">
                    <span>Creator: {task.creator}</span>
                    <span>Assignee: {task.assignee ?? 'Unassigned'}</span>
                  </div>
                  <div className="task-actions">
                    <button onClick={() => handleSelectTask(task)}>Edit</button>
                    <button className="danger" onClick={() => handleDeleteTask(task.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
