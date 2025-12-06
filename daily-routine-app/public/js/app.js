// Main application logic

// Check authentication
const user = getCurrentUser();
if (!user) {
  window.location.href = '/index.html';
}

// ========================================
// GLOBAL STATE
// ========================================

let currentSection = 'dashboard';
let tasks = [];
let routines = [];
let habits = [];
let feed = [];
let selectedMood = null;

// ========================================
// MOTIVATIONAL MESSAGES
// ========================================

const motivationalMessages = [
  "One small win at a time 💙",
  "Let's make today count",
  "Show up for future you",
  "You've got this!",
  "Progress over perfection",
  "Small steps, big impact"
];

function showRandomMotivation() {
  const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
  document.getElementById('motivational-text').textContent = message;
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  initializeUI();
  loadAllData();
  setupEventListeners();
});

function initializeUI() {
  // Set user info
  const avatar = document.getElementById('user-avatar');
  const name = document.getElementById('user-name');
  const role = document.getElementById('user-role');

  avatar.textContent = user.name.charAt(0).toUpperCase();
  name.textContent = user.nickname || user.name;
  role.textContent = user.role === 'owner' ? '👑 Owner' : '✨ Member';

  // Show admin tab if owner
  if (user.role === 'owner') {
    document.getElementById('admin-tab').style.display = 'block';
  }

  // Show motivational message
  showRandomMotivation();

  // Set today's date for task form
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('task-date').value = today;
}

async function loadAllData() {
  try {
    await Promise.all([
      loadTasks(),
      loadRoutines(),
      loadHabits(),
      loadFeed()
    ]);
    renderCurrentSection();
  } catch (error) {
    console.error('Error loading data:', error);
    showNotification('Error loading data', 'error');
  }
}

async function loadTasks() {
  tasks = await tasksAPI.getAll();
  renderTasks();
  renderStats();
}

async function loadRoutines() {
  routines = await routinesAPI.getAll();
  renderRoutines();
}

async function loadHabits() {
  habits = await habitsAPI.getAll();
  renderHabits();
}

async function loadFeed() {
  feed = await feedAPI.get();
  renderFeed();
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  // Logout
  document.getElementById('logout-btn').addEventListener('click', logout);

  // Navigation tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const section = tab.dataset.section;
      switchSection(section);
    });
  });

  // Mood selector
  document.querySelectorAll('.mood-emoji').forEach(emoji => {
    emoji.addEventListener('click', async () => {
      const emojiValue = emoji.dataset.emoji;
      selectedMood = emojiValue;

      // Visual feedback
      document.querySelectorAll('.mood-emoji').forEach(e => e.classList.remove('selected'));
      emoji.classList.add('selected');

      // Save mood
      try {
        await moodsAPI.create(emojiValue, null);
        showNotification('Mood saved! Keep it up 💙', 'success');
      } catch (error) {
        console.error('Error saving mood:', error);
      }
    });
  });

  // Modal controls
  setupModalControls();

  // Form submissions
  setupForms();
}

function setupModalControls() {
  // Add Task Modal
  document.getElementById('add-task-btn').addEventListener('click', () => {
    openModal('task-modal');
  });
  document.getElementById('close-task-modal').addEventListener('click', () => {
    closeModal('task-modal');
  });

  // Add Routine Modal
  document.getElementById('add-routine-btn').addEventListener('click', () => {
    openModal('routine-modal');
  });
  document.getElementById('close-routine-modal').addEventListener('click', () => {
    closeModal('routine-modal');
  });

  // Add Habit Modal
  document.getElementById('add-habit-btn').addEventListener('click', () => {
    openModal('habit-modal');
  });
  document.getElementById('close-habit-modal').addEventListener('click', () => {
    closeModal('habit-modal');
  });

  // Routine Task Modal
  document.getElementById('close-routine-task-modal').addEventListener('click', () => {
    closeModal('routine-task-modal');
  });

  // Close modals on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
}

function setupForms() {
  // Task Form
  document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const taskData = {
      title: document.getElementById('task-title').value,
      notes: document.getElementById('task-notes').value,
      category: document.getElementById('task-category').value,
      due_date: document.getElementById('task-date').value
    };

    try {
      await tasksAPI.create(taskData);
      await loadTasks();
      closeModal('task-modal');
      document.getElementById('task-form').reset();
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('task-date').value = today;
      showNotification('Task added! You crushed it! 💪', 'success');
    } catch (error) {
      console.error('Error creating task:', error);
      showNotification('Error creating task', 'error');
    }
  });

  // Routine Form
  document.getElementById('routine-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('routine-name').value;

    try {
      await routinesAPI.create(name);
      await loadRoutines();
      closeModal('routine-modal');
      document.getElementById('routine-form').reset();
      showNotification('Routine created! 🎉', 'success');
    } catch (error) {
      console.error('Error creating routine:', error);
      showNotification('Error creating routine', 'error');
    }
  });

  // Habit Form
  document.getElementById('habit-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('habit-title').value;

    try {
      await habitsAPI.create(title);
      await loadHabits();
      closeModal('habit-modal');
      document.getElementById('habit-form').reset();
      showNotification('Habit unlocked! 🔥', 'success');
    } catch (error) {
      console.error('Error creating habit:', error);
      showNotification('Error creating habit', 'error');
    }
  });

  // Routine Task Form
  document.getElementById('routine-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const routineId = document.getElementById('routine-task-routine-id').value;
    const taskData = {
      title: document.getElementById('routine-task-title').value,
      reminder_time: document.getElementById('routine-task-reminder').value || null
    };

    try {
      await routinesAPI.addTask(routineId, taskData);
      await loadRoutines();
      closeModal('routine-task-modal');
      document.getElementById('routine-task-form').reset();
      showNotification('Task added to routine! 💙', 'success');
    } catch (error) {
      console.error('Error adding routine task:', error);
      showNotification('Error adding task', 'error');
    }
  });
}

// ========================================
// NAVIGATION
// ========================================

function switchSection(section) {
  currentSection = section;

  // Update tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.section === section);
  });

  // Update sections
  document.querySelectorAll('.section').forEach(sec => {
    sec.classList.toggle('active', sec.id === `${section}-section`);
  });

  renderCurrentSection();
}

function renderCurrentSection() {
  switch (currentSection) {
    case 'dashboard':
      renderTasks();
      renderStats();
      break;
    case 'routines':
      renderRoutines();
      break;
    case 'habits':
      renderHabits();
      break;
    case 'feed':
      renderFeed();
      break;
    case 'admin':
      renderAdmin();
      break;
  }
}

// ========================================
// RENDER FUNCTIONS
// ========================================

function renderTasks() {
  const container = document.getElementById('tasks-list');
  const today = new Date().toISOString().split('T')[0];

  const todayTasks = tasks.filter(task =>
    task.due_date === today || task.status === 'todo'
  );

  if (todayTasks.length === 0) {
    container.innerHTML = '<p class="text-muted">No tasks for today. Add one to get started!</p>';
    return;
  }

  container.innerHTML = todayTasks.map(task => `
    <div class="task-item fade-in">
      <div class="task-checkbox ${task.status === 'done' ? 'checked' : ''}"
           onclick="toggleTask(${task.id})"></div>
      <div class="task-content">
        <div class="task-title ${task.status === 'done' ? 'completed' : ''}">${task.title}</div>
        ${task.notes ? `<div class="task-meta">${task.notes}</div>` : ''}
        <div class="task-meta">${task.category} • ${formatDate(task.due_date)}</div>
      </div>
      <div class="task-actions">
        <button class="btn btn-ghost btn-sm" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderStats() {
  const container = document.getElementById('stats-container');

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.due_date === today);
  const completedTasks = todayTasks.filter(t => t.status === 'done').length;
  const totalTasks = todayTasks.length;
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalHabits = habits.length;
  const todayHabits = habits.filter(h => h.last_completed_date === today).length;

  container.innerHTML = `
    <div class="mb-lg">
      <div class="flex-between mb-sm">
        <span>Tasks</span>
        <span class="text-secondary">${completedTasks} / ${totalTasks}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <div class="progress-text">${percentage}% Complete</div>
    </div>

    <div class="grid gap-md">
      <div class="card" style="padding: 1rem; background: var(--black-lighter);">
        <div class="text-muted" style="font-size: 0.75rem; margin-bottom: 0.25rem;">Habits Today</div>
        <div style="font-size: 1.5rem; font-weight: 600; color: var(--blue-primary);">${todayHabits} / ${totalHabits}</div>
      </div>
      <div class="card" style="padding: 1rem; background: var(--black-lighter);">
        <div class="text-muted" style="font-size: 0.75rem; margin-bottom: 0.25rem;">Active Streaks</div>
        <div style="font-size: 1.5rem; font-weight: 600; color: var(--blue-primary);">
          ${habits.filter(h => h.streak_count > 0).length} 🔥
        </div>
      </div>
    </div>
  `;
}

function renderRoutines() {
  const container = document.getElementById('routines-grid');

  if (routines.length === 0) {
    container.innerHTML = '<p class="text-muted">No routines yet. Create your first routine!</p>';
    return;
  }

  container.innerHTML = routines.map(routine => {
    const totalTasks = routine.tasks.length;
    const completedTasks = 0; // In a real app, we'd track daily completions
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return `
      <div class="routine-card fade-in">
        <div class="card-header">
          <h3 class="card-title">${routine.name}</h3>
          <button class="btn btn-sm btn-primary" onclick="openAddRoutineTask(${routine.id}, '${routine.name}')">
            + Task
          </button>
        </div>

        <div class="routine-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="progress-text">${completedTasks} / ${totalTasks} tasks</div>
        </div>

        <div class="task-list">
          ${routine.tasks.map(task => `
            <div class="task-item">
              <div class="task-checkbox"></div>
              <div class="task-content">
                <div class="task-title">${task.title}</div>
                ${task.reminder_time ? `<div class="task-meta">⏰ ${task.reminder_time}</div>` : ''}
              </div>
            </div>
          `).join('') || '<p class="text-muted">No tasks yet</p>'}
        </div>
      </div>
    `;
  }).join('');
}

function renderHabits() {
  const container = document.getElementById('habits-list');

  if (habits.length === 0) {
    container.innerHTML = '<p class="text-muted">No habits yet. Start building your first habit!</p>';
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = habits.map(habit => {
    const isCompletedToday = habit.last_completed_date === today;
    const streakCount = habit.streak_count || 0;

    // Generate last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const isCompleted = habit.completions && habit.completions.includes(dateStr);
      days.push({ date: dateStr, completed: isCompleted });
    }

    // Get badge
    let badge = '';
    if (streakCount >= 30) {
      badge = '<span class="badge">🏆 30 Day Master</span>';
    } else if (streakCount >= 7) {
      badge = '<span class="badge">⭐ Week Warrior</span>';
    } else if (streakCount >= 3) {
      badge = '<span class="badge">🌟 3 Day Starter</span>';
    }

    return `
      <div class="habit-item fade-in">
        <div class="habit-header">
          <div>
            <div class="habit-title">${habit.title}</div>
            ${badge}
          </div>
          <div class="habit-streak">
            <span class="streak-fire">🔥</span>
            <span>${streakCount}</span>
          </div>
        </div>

        <div class="habit-progress">
          <div class="progress-dots">
            ${days.map(day => `
              <div class="progress-dot ${day.completed ? 'completed' : ''}"
                   title="${formatDate(day.date)}"></div>
            `).join('')}
          </div>
        </div>

        <button class="btn ${isCompletedToday ? 'btn-ghost' : 'btn-success'} btn-sm"
                onclick="completeHabit(${habit.id})"
                ${isCompletedToday ? 'disabled' : ''}>
          ${isCompletedToday ? '✓ Completed Today' : 'Mark Complete'}
        </button>
      </div>
    `;
  }).join('');
}

function renderFeed() {
  const container = document.getElementById('feed-list');

  if (feed.length === 0) {
    container.innerHTML = '<p class="text-muted">No recent activity. Complete some tasks to get started!</p>';
    return;
  }

  container.innerHTML = feed.map(item => {
    const userInitial = (item.nickname || item.name).charAt(0).toUpperCase();
    const reactionEmojis = ['👏', '👍', '🔥', '💪', '❤️'];

    return `
      <div class="feed-item fade-in">
        <div class="feed-header">
          <div class="feed-user">
            <div class="feed-avatar">${userInitial}</div>
            <div>
              <div style="font-weight: 600;">${item.nickname || item.name}</div>
              <div class="text-muted" style="font-size: 0.875rem;">completed a task</div>
            </div>
          </div>
          <div class="feed-time">${formatTimeAgo(item.completed_at)}</div>
        </div>

        <div class="task-title" style="margin-bottom: 0.5rem;">${item.title}</div>
        ${item.notes ? `<div class="text-secondary" style="font-size: 0.875rem;">${item.notes}</div>` : ''}

        <div class="feed-reactions">
          ${reactionEmojis.map(emoji => `
            <button class="reaction-btn" onclick="addReaction(${item.id}, '${emoji}')">
              ${emoji}
              ${item.reactions && item.reactions.filter(r => r.emoji === emoji).length > 0
                ? `<span style="font-size: 0.75rem; margin-left: 0.25rem;">${item.reactions.filter(r => r.emoji === emoji).length}</span>`
                : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

async function renderAdmin() {
  if (user.role !== 'owner') {
    document.getElementById('admin-content').innerHTML = '<p class="text-muted">Admin access required</p>';
    return;
  }

  try {
    const users = await adminAPI.getUsers();
    const container = document.getElementById('admin-content');

    container.innerHTML = `
      <div class="card">
        <h3 class="card-title mb-lg">User Management</h3>
        ${users.map(u => `
          <div class="card mb-md" style="background: var(--black-lighter);">
            <div class="flex-between mb-md">
              <div>
                <div style="font-weight: 600; font-size: 1.125rem;">${u.name}</div>
                <div class="text-muted">${u.email}</div>
                <div class="text-muted" style="font-size: 0.75rem;">Role: ${u.role}</div>
              </div>
              <div class="user-avatar">${u.name.charAt(0).toUpperCase()}</div>
            </div>

            <div class="form-group">
              <label class="form-label">Nickname</label>
              <input type="text" class="form-input" value="${u.nickname || ''}"
                     id="nickname-${u.id}" placeholder="Enter nickname">
            </div>

            <div class="flex gap-md">
              <button class="btn ${u.active ? 'btn-ghost' : 'btn-primary'}"
                      onclick="toggleUserActive(${u.id}, ${!u.active})">
                ${u.active ? 'Deactivate' : 'Activate'}
              </button>
              <button class="btn btn-primary" onclick="updateUserNickname(${u.id})">
                Update Nickname
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error loading admin data:', error);
    showNotification('Error loading admin data', 'error');
  }
}

// ========================================
// ACTION FUNCTIONS
// ========================================

async function toggleTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const newStatus = task.status === 'done' ? 'todo' : 'done';

  try {
    await tasksAPI.update(taskId, { status: newStatus });
    await loadTasks();
    await loadFeed(); // Refresh feed to show completed task

    if (newStatus === 'done') {
      showNotification('Proud of you 💙', 'success');
    }
  } catch (error) {
    console.error('Error toggling task:', error);
    showNotification('Error updating task', 'error');
  }
}

async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    await tasksAPI.delete(taskId);
    await loadTasks();
    showNotification('Task deleted', 'success');
  } catch (error) {
    console.error('Error deleting task:', error);
    showNotification('Error deleting task', 'error');
  }
}

async function completeHabit(habitId) {
  try {
    await habitsAPI.complete(habitId);
    await loadHabits();
    showNotification('Habit unlocked! Keep the streak going 🔥', 'success');
  } catch (error) {
    console.error('Error completing habit:', error);
    showNotification('Error completing habit', 'error');
  }
}

async function addReaction(taskId, emoji) {
  try {
    await reactionsAPI.create(taskId, emoji);
    await loadFeed();
    showNotification('Reaction added!', 'success');
  } catch (error) {
    console.error('Error adding reaction:', error);
  }
}

function openAddRoutineTask(routineId, routineName) {
  document.getElementById('routine-task-routine-id').value = routineId;
  document.getElementById('routine-task-routine-name').textContent = routineName;
  openModal('routine-task-modal');
}

async function toggleUserActive(userId, active) {
  try {
    await adminAPI.updateUser(userId, { active });
    renderAdmin();
    showNotification(`User ${active ? 'activated' : 'deactivated'}`, 'success');
  } catch (error) {
    console.error('Error updating user:', error);
    showNotification('Error updating user', 'error');
  }
}

async function updateUserNickname(userId) {
  const nickname = document.getElementById(`nickname-${userId}`).value;

  try {
    await adminAPI.updateUser(userId, { nickname });
    renderAdmin();
    showNotification('Nickname updated!', 'success');
  } catch (error) {
    console.error('Error updating nickname:', error);
    showNotification('Error updating nickname', 'error');
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/index.html';
}

function formatDate(dateStr) {
  if (!dateStr) return 'No date';
  const date = new Date(dateStr);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
    animation: slideDown 0.3s ease;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeOut {
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
`;
document.head.appendChild(style);
