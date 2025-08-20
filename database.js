const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'blog.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Blog posts table
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    tags TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reading_time INTEGER DEFAULT 5
  )`);

  // Migration: Add tags column if it doesn't exist
  db.run(`PRAGMA table_info(posts)`, (err, rows) => {
    if (err) {
      console.error('Error checking table structure:', err);
      return;
    }
  });
  
  // Check if tags column exists and add it if not
  db.all(`PRAGMA table_info(posts)`, (err, rows) => {
    if (err) {
      console.error('Error checking table structure:', err);
      return;
    }
    
    const hasTagsColumn = rows.some(row => row.name === 'tags');
    if (!hasTagsColumn) {
      db.run(`ALTER TABLE posts ADD COLUMN tags TEXT`, (alterErr) => {
        if (alterErr) {
          console.error('Error adding tags column:', alterErr);
        } else {
          console.log('✅ Added tags column to posts table');
        }
      });
    }
  });

  // Images table
  db.run(`CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('📄 Database initialized');
});

module.exports = db;
