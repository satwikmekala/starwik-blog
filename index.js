const express = require('express');
const path = require('path');
const db = require('./database');
const adminRoutes = require('./admin-routes');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Admin routes
app.use('/admin', adminRoutes);

// API route to get blog post data
app.get('/api/blog/:slug', (req, res) => {
  db.get('SELECT * FROM posts WHERE slug = ? AND status = "published"', [req.params.slug], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(row);
  });
});

// API route to get all published posts for homepage
app.get('/api/posts', (req, res) => {
  db.all('SELECT id, title, subtitle, slug, excerpt, created_at, reading_time FROM posts WHERE status = "published" ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Blog post routes
app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog-post.html'));
});

// Fallback route for blog posts with query parameters
app.get('/blog', (req, res) => {
  if (req.query.slug) {
    res.sendFile(path.join(__dirname, 'public', 'blog-post.html'));
  } else {
    res.redirect('/');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Starwik Blog is running on http://localhost:${PORT}`);
  console.log(`📝 Admin panel available at http://localhost:${PORT}/admin`);
  console.log(`📖 Blog posts available at http://localhost:${PORT}/blog/[slug]`);
}); 