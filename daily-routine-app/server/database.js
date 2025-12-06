const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Initialize database
const db = new Database(path.join(__dirname, 'routine.db'));
db.pragma('journal_mode = WAL');

// Create tables
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner', 'member')),
      active INTEGER DEFAULT 1,
      avatar_url TEXT,
      nickname TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Routines table
  db.exec(`
    CREATE TABLE IF NOT EXISTS routines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Routine Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS routine_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      reminder_time TEXT,
      task_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
    )
  `);

  // Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      notes TEXT,
      due_date DATE DEFAULT (date('now')),
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'done')),
      category TEXT DEFAULT 'Personal',
      creator_id INTEGER NOT NULL,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Habits table
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      streak_count INTEGER DEFAULT 0,
      last_completed_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Habit completions table (for tracking history)
  db.exec(`
    CREATE TABLE IF NOT EXISTS habit_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      completed_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE(habit_id, completed_date)
    )
  `);

  // Moods table
  db.exec(`
    CREATE TABLE IF NOT EXISTS moods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      emoji TEXT NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Reactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      from_user_id INTEGER NOT NULL,
      emoji TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Seed initial users (James & Nieben)
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();

  if (existingUsers.count === 0) {
    const hashedPassword1 = bcrypt.hashSync('password123', 10);
    const hashedPassword2 = bcrypt.hashSync('password123', 10);

    db.prepare(`
      INSERT INTO users (name, email, password, role, active, nickname)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('James', 'james@routine.app', hashedPassword1, 'owner', 1, 'James');

    db.prepare(`
      INSERT INTO users (name, email, password, role, active, nickname)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Nieben', 'nieben@routine.app', hashedPassword2, 'member', 1, 'Nieben');

    console.log('✅ Default users created:');
    console.log('   James (Owner): james@routine.app / password123');
    console.log('   Nieben (Member): nieben@routine.app / password123');
  }
}

// Initialize on module load
initializeDatabase();

module.exports = db;
