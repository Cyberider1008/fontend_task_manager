const API_URL = "https://task-manager-igbz.onrender.com/api";

if (!API_URL) {
  throw new Error('Missing API_URL. Define this environment variable    .');
}

const trimSlash = (value) => value.replace(/\/+$|^\/+/, '');
const buildUrl = (path) => {
  const base = trimSlash(API_URL);
  const cleanPath = trimSlash(path);
  return `${base}/${cleanPath}/`;
};

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
};

const request = async (path, options = {}) => {
  const { method = 'GET', token, body, headers = {} } = options;
  const url = buildUrl(path);

  const requestHeaders = {
    ...headers,
  };

  if (body !== undefined && body !== null) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const parsedBody = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      typeof parsedBody === 'string'
        ? parsedBody
        : parsedBody?.detail || JSON.stringify(parsedBody || {});

    console.error('API request failed:', {
      url,
      method,
      status: response.status,
      body: parsedBody,
    });

    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return parsedBody;
};

export const API = {
  baseUrl: API_URL,
  login: (credentials) => request('login', { method: 'POST', body: credentials }),
  register: (credentials) => request('register', { method: 'POST', body: credentials }),
  getTasks: (token) => request('tasks', { token }),
  createTask: (taskData, token) => request('tasks', { method: 'POST', token, body: taskData }),
  updateTask: (taskId, taskData, token) => request(`tasks/${taskId}`, { method: 'PUT', token, body: taskData }),
  deleteTask: (taskId, token) => request(`tasks/${taskId}`, { method: 'DELETE', token }),
};
