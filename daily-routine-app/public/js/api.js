// API helper functions

const API_BASE = window.location.origin;

// Get auth token
function getToken() {
  return localStorage.getItem('token');
}

// Get current user
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// API request helper
async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth API
const authAPI = {
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),

  getMe: () => apiRequest('/users/me')
};

// Tasks API
const tasksAPI = {
  getAll: () => apiRequest('/tasks'),

  create: (taskData) => apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  }),

  update: (id, updates) => apiRequest(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),

  delete: (id) => apiRequest(`/tasks/${id}`, {
    method: 'DELETE'
  })
};

// Routines API
const routinesAPI = {
  getAll: () => apiRequest('/routines'),

  create: (name) => apiRequest('/routines', {
    method: 'POST',
    body: JSON.stringify({ name })
  }),

  getTasks: (routineId) => apiRequest(`/routines/${routineId}/tasks`),

  addTask: (routineId, taskData) => apiRequest(`/routines/${routineId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(taskData)
  }),

  updateTask: (routineId, taskId, updates) => apiRequest(`/routines/${routineId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  })
};

// Habits API
const habitsAPI = {
  getAll: () => apiRequest('/habits'),

  create: (title) => apiRequest('/habits', {
    method: 'POST',
    body: JSON.stringify({ title })
  }),

  complete: (id) => apiRequest(`/habits/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed: true })
  })
};

// Moods API
const moodsAPI = {
  getAll: (limit = 30) => apiRequest(`/moods?limit=${limit}`),

  create: (emoji, note) => apiRequest('/moods', {
    method: 'POST',
    body: JSON.stringify({ emoji, note })
  })
};

// Reactions API
const reactionsAPI = {
  create: (taskId, emoji) => apiRequest('/reactions', {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId, emoji })
  }),

  getForTask: (taskId) => apiRequest(`/reactions/${taskId}`)
};

// Feed API
const feedAPI = {
  get: () => apiRequest('/feed')
};

// Admin API
const adminAPI = {
  getUsers: () => apiRequest('/admin/users'),

  updateUser: (id, updates) => apiRequest(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  })
};
