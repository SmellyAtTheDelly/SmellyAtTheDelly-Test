# 💙 Daily Routine App - MVP

A two-person private daily routine companion for **James & Nieben** to build habits, share progress, and support each other.

## 🎨 Features

### Core Features (Implemented)
- ✅ **Routine System** - Morning, Afternoon, Night routines with tasks
- ✅ **Daily Tasks** - Quick task capture with categories and due dates
- ✅ **Habit Tracking** - Streak tracking with gamified badges
- ✅ **Mood Check-ins** - Emoji-based mood tracking
- ✅ **Shared Support Feed** - View each other's progress and add reactions
- ✅ **Admin Panel** - James can manage users and permissions

### Design
- 🎨 **Blue & Black Theme** - Clean, modern, energizing
- 💙 **Primary**: #1E90FF (Bright Blue)
- 🖤 **Background**: #0A0A0C (Deep Black)
- ✨ **Smooth animations** and **motivational microcopy**

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn

### Installation

1. **Navigate to the server directory**:
   ```bash
   cd daily-routine-app/server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file** (optional):
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   ```
   http://localhost:3000
   ```

## 👥 Default Users

The app comes with two pre-configured users:

### James (Owner)
- **Email**: `james@routine.app`
- **Password**: `password123`
- **Role**: Owner (Full admin access)

### Nieben (Member)
- **Email**: `nieben@routine.app`
- **Password**: `password123`
- **Role**: Member

## 📱 How to Use

### 1. Login
Use the credentials above to log in as either James or Nieben.

### 2. Set Your Mood
Click on an emoji at the top to track how you're feeling today.

### 3. Add Tasks
- Go to **Dashboard** → Click **"+ Add Task"**
- Fill in the task details
- Mark tasks as complete by clicking the checkbox

### 4. Create Routines
- Go to **Routines** → Click **"+ Add Routine"**
- Name your routine (e.g., "Morning Routine")
- Add tasks to your routine
- Track your progress with the visual progress bar

### 5. Build Habits
- Go to **Habits** → Click **"+ Add Habit"**
- Create a habit (e.g., "Drink 8 glasses of water")
- Mark it complete each day to build your streak 🔥
- Earn badges at 3, 7, and 30-day milestones

### 6. Support Each Other
- Go to **Support Feed**
- See what your partner completed today
- Add reactions (👏 👍 🔥 💪 ❤️) to encourage each other

### 7. Admin Features (James Only)
- Go to **Admin** tab
- Activate/deactivate Nieben
- Update nicknames
- Manage user permissions

## 🗂️ Project Structure

```
daily-routine-app/
├── server/
│   ├── server.js          # Express API server
│   ├── database.js        # SQLite database setup
│   ├── middleware/
│   │   └── auth.js        # JWT authentication
│   ├── package.json       # Server dependencies
│   └── routine.db         # SQLite database (created on first run)
│
└── public/
    ├── index.html         # Login page
    ├── dashboard.html     # Main app dashboard
    ├── css/
    │   └── styles.css     # Blue/Black theme styles
    └── js/
        ├── auth.js        # Login authentication
        ├── api.js         # API helper functions
        └── app.js         # Main app logic
```

## 🔐 Security Notes

⚠️ **For Production**:
1. Change the `JWT_SECRET` in `.env`
2. Use strong passwords (current defaults are for MVP only)
3. Enable HTTPS
4. Consider using a production database (PostgreSQL, MySQL)
5. Add rate limiting and additional security middleware

## 🎯 API Endpoints

### Authentication
- `POST /auth/login` - Login with email/password
- `GET /users/me` - Get current user info

### Routines
- `GET /routines` - Get all routines
- `POST /routines` - Create new routine
- `GET /routines/:id/tasks` - Get routine tasks
- `POST /routines/:id/tasks` - Add task to routine
- `PATCH /routines/:routineId/tasks/:taskId` - Update routine task

### Tasks
- `GET /tasks` - Get all tasks
- `POST /tasks` - Create new task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### Habits
- `GET /habits` - Get all habits with completion history
- `POST /habits` - Create new habit
- `PATCH /habits/:id` - Complete habit for today

### Moods
- `POST /moods` - Create mood check-in
- `GET /moods` - Get mood history

### Reactions
- `POST /reactions` - Add reaction to task
- `GET /reactions/:taskId` - Get reactions for task

### Feed
- `GET /feed` - Get recent activity from both users

### Admin (Owner Only)
- `GET /admin/users` - Get all users
- `PATCH /admin/users/:id` - Update user (activate/deactivate, nickname)

## 📊 Database Schema

- **users** - User accounts (James & Nieben)
- **routines** - Morning/Afternoon/Night routines
- **routine_tasks** - Tasks within routines
- **tasks** - Daily standalone tasks
- **habits** - Repeatable habits with streaks
- **habit_completions** - History of habit completions
- **moods** - Mood check-ins
- **reactions** - Encouragement reactions on tasks

## 🎨 Customization

### Change Theme Colors
Edit `/public/css/styles.css`:
```css
:root {
  --blue-primary: #1E90FF;  /* Change to your preferred blue */
  --black: #0A0A0C;         /* Change background color */
}
```

### Add More Motivational Messages
Edit `/public/js/app.js`:
```javascript
const motivationalMessages = [
  "One small win at a time 💙",
  "Your custom message here",
  // Add more...
];
```

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is taken, change it in `.env`:
```
PORT=3001
```

### Database Locked
If you get "database is locked", make sure only one server instance is running.

### Cannot Connect to Server
- Make sure the server is running (`npm start` in the server directory)
- Check the console for any error messages
- Try accessing `http://localhost:3000` directly

## 📝 Future Enhancements (Not in MVP)

- Full calendar view
- Voice task input
- Weather-based suggestions
- Personal journal
- Photo uploads in routines
- AI motivation coach
- Wearable integration
- Mobile apps (iOS/Android)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Ensure all dependencies are installed

## 📄 License

This is a private app for James & Nieben. Not for public distribution.

---

**Built with ❤️ for daily growth and mutual support**

*"One small win at a time 💙"*
