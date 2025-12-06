const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const db = require('./database');
const { authenticateToken, requireOwner, generateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ========================================
// AUTH ROUTES
// ========================================

// POST /auth/login
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        nickname: user.nickname,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /users/me
app.get('/users/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, active, avatar_url, nickname, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// ROUTINES ROUTES
// ========================================

// GET /routines - Get all routines for current user
app.get('/routines', authenticateToken, (req, res) => {
  try {
    const routines = db.prepare('SELECT * FROM routines WHERE user_id = ? ORDER BY created_at').all(req.user.id);

    // Get tasks for each routine
    const routinesWithTasks = routines.map(routine => {
      const tasks = db.prepare('SELECT * FROM routine_tasks WHERE routine_id = ? ORDER BY task_order, created_at').all(routine.id);
      return { ...routine, tasks };
    });

    res.json(routinesWithTasks);
  } catch (error) {
    console.error('Get routines error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /routines - Create new routine
app.post('/routines', authenticateToken, (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Routine name required' });
  }

  try {
    const result = db.prepare('INSERT INTO routines (name, user_id) VALUES (?, ?)').run(name, req.user.id);
    const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ...routine, tasks: [] });
  } catch (error) {
    console.error('Create routine error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /routines/:id/tasks - Get tasks for a routine
app.get('/routines/:id/tasks', authenticateToken, (req, res) => {
  try {
    const routine = db.prepare('SELECT * FROM routines WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    const tasks = db.prepare('SELECT * FROM routine_tasks WHERE routine_id = ? ORDER BY task_order, created_at').all(req.params.id);
    res.json(tasks);
  } catch (error) {
    console.error('Get routine tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /routines/:id/tasks - Add task to routine
app.post('/routines/:id/tasks', authenticateToken, (req, res) => {
  const { title, reminder_time, task_order } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title required' });
  }

  try {
    const routine = db.prepare('SELECT * FROM routines WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    const result = db.prepare('INSERT INTO routine_tasks (routine_id, title, reminder_time, task_order) VALUES (?, ?, ?, ?)').run(
      req.params.id,
      title,
      reminder_time || null,
      task_order || 0
    );

    const task = db.prepare('SELECT * FROM routine_tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (error) {
    console.error('Add routine task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /routines/:routineId/tasks/:taskId - Update routine task
app.patch('/routines/:routineId/tasks/:taskId', authenticateToken, (req, res) => {
  const { title, reminder_time, task_order } = req.body;

  try {
    const routine = db.prepare('SELECT * FROM routines WHERE id = ? AND user_id = ?').get(req.params.routineId, req.user.id);

    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (reminder_time !== undefined) {
      updates.push('reminder_time = ?');
      values.push(reminder_time);
    }
    if (task_order !== undefined) {
      updates.push('task_order = ?');
      values.push(task_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.taskId);

    db.prepare(`UPDATE routine_tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const task = db.prepare('SELECT * FROM routine_tasks WHERE id = ?').get(req.params.taskId);
    res.json(task);
  } catch (error) {
    console.error('Update routine task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// HABITS ROUTES
// ========================================

// GET /habits - Get all habits for current user
app.get('/habits', authenticateToken, (req, res) => {
  try {
    const habits = db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at').all(req.user.id);

    // Get completion history for each habit (last 7 days)
    const habitsWithHistory = habits.map(habit => {
      const completions = db.prepare(`
        SELECT completed_date FROM habit_completions
        WHERE habit_id = ? AND completed_date >= date('now', '-7 days')
        ORDER BY completed_date DESC
      `).all(habit.id);

      return { ...habit, completions: completions.map(c => c.completed_date) };
    });

    res.json(habitsWithHistory);
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /habits - Create new habit
app.post('/habits', authenticateToken, (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Habit title required' });
  }

  try {
    const result = db.prepare('INSERT INTO habits (title, user_id) VALUES (?, ?)').run(title, req.user.id);
    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ...habit, completions: [] });
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /habits/:id - Update habit (complete it for today)
app.patch('/habits/:id', authenticateToken, (req, res) => {
  const { completed } = req.body;

  try {
    const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const today = new Date().toISOString().split('T')[0];

    if (completed) {
      // Mark as completed for today
      try {
        db.prepare('INSERT INTO habit_completions (habit_id, completed_date) VALUES (?, ?)').run(req.params.id, today);

        // Update streak
        let newStreak = 1;
        if (habit.last_completed_date) {
          const lastDate = new Date(habit.last_completed_date);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive day
            newStreak = habit.streak_count + 1;
          } else if (diffDays === 0) {
            // Same day (already completed)
            newStreak = habit.streak_count;
          } else {
            // Streak broken
            newStreak = 1;
          }
        }

        db.prepare('UPDATE habits SET streak_count = ?, last_completed_date = ? WHERE id = ?').run(newStreak, today, req.params.id);
      } catch (err) {
        // Already completed today, ignore
      }
    }

    const updatedHabit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
    res.json(updatedHabit);
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// TASKS ROUTES
// ========================================

// GET /tasks - Get all tasks for current user
app.get('/tasks', authenticateToken, (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks WHERE creator_id = ? ORDER BY due_date, created_at DESC').all(req.user.id);
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /tasks - Create new task
app.post('/tasks', authenticateToken, (req, res) => {
  const { title, notes, due_date, category } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO tasks (title, notes, due_date, category, creator_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(title, notes || null, due_date || null, category || 'Personal', req.user.id);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /tasks/:id - Update task
app.patch('/tasks/:id', authenticateToken, (req, res) => {
  const { title, notes, status, due_date, category } = req.body;

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND creator_id = ?').get(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);

      if (status === 'done') {
        updates.push('completed_at = CURRENT_TIMESTAMP');
      }
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(due_date);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /tasks/:id - Delete task
app.delete('/tasks/:id', authenticateToken, (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND creator_id = ?').get(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// MOODS ROUTES
// ========================================

// POST /moods - Create mood check-in
app.post('/moods', authenticateToken, (req, res) => {
  const { emoji, note } = req.body;

  if (!emoji) {
    return res.status(400).json({ error: 'Emoji required' });
  }

  try {
    const result = db.prepare('INSERT INTO moods (user_id, emoji, note) VALUES (?, ?, ?)').run(req.user.id, emoji, note || null);
    const mood = db.prepare('SELECT * FROM moods WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(mood);
  } catch (error) {
    console.error('Create mood error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /moods - Get moods for current user
app.get('/moods', authenticateToken, (req, res) => {
  try {
    const limit = req.query.limit || 30;
    const moods = db.prepare('SELECT * FROM moods WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(req.user.id, limit);
    res.json(moods);
  } catch (error) {
    console.error('Get moods error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// REACTIONS ROUTES
// ========================================

// POST /reactions - Add reaction to a task
app.post('/reactions', authenticateToken, (req, res) => {
  const { task_id, emoji } = req.body;

  if (!task_id || !emoji) {
    return res.status(400).json({ error: 'Task ID and emoji required' });
  }

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task_id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const result = db.prepare('INSERT INTO reactions (task_id, from_user_id, emoji) VALUES (?, ?, ?)').run(task_id, req.user.id, emoji);
    const reaction = db.prepare('SELECT * FROM reactions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(reaction);
  } catch (error) {
    console.error('Create reaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /reactions/:taskId - Get reactions for a task
app.get('/reactions/:taskId', authenticateToken, (req, res) => {
  try {
    const reactions = db.prepare(`
      SELECT r.*, u.name, u.nickname
      FROM reactions r
      JOIN users u ON r.from_user_id = u.id
      WHERE r.task_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.taskId);

    res.json(reactions);
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// FEED ROUTE (Shared progress)
// ========================================

// GET /feed - Get recent activity from both users
app.get('/feed', authenticateToken, (req, res) => {
  try {
    // Get recent completed tasks from both users
    const tasks = db.prepare(`
      SELECT t.*, u.name, u.nickname
      FROM tasks t
      JOIN users u ON t.creator_id = u.id
      WHERE t.status = 'done' AND t.completed_at >= date('now', '-7 days')
      ORDER BY t.completed_at DESC
      LIMIT 20
    `).all();

    // Get reactions for each task
    const feed = tasks.map(task => {
      const reactions = db.prepare('SELECT * FROM reactions WHERE task_id = ?').all(task.id);
      return { ...task, reactions };
    });

    res.json(feed);
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// ADMIN ROUTES (Owner only)
// ========================================

// GET /admin/users - Get all users (owner only)
app.get('/admin/users', authenticateToken, requireOwner, (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, active, avatar_url, nickname, created_at FROM users').all();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /admin/users/:id - Update user (owner only)
app.patch('/admin/users/:id', authenticateToken, requireOwner, (req, res) => {
  const { active, nickname, avatar_url } = req.body;

  try {
    const updates = [];
    const values = [];

    if (active !== undefined) {
      updates.push('active = ?');
      values.push(active ? 1 : 0);
    }
    if (nickname !== undefined) {
      updates.push('nickname = ?');
      values.push(nickname);
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatar_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const user = db.prepare('SELECT id, name, email, role, active, avatar_url, nickname, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`\n🚀 Daily Routine API Server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend served at http://localhost:${PORT}\n`);
});
