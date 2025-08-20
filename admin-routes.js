const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');
const db = require('./database');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Serve admin dashboard
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Get all posts
router.get('/api/posts', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single post
router.get('/api/posts/:id', (req, res) => {
  db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, row) => {
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

// Create new post
router.post('/api/posts', (req, res) => {
  const { title, subtitle, content, tags, status = 'draft' } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  const slug = slugify(title, { lower: true, strict: true });
  const excerpt = content.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  db.run(
    'INSERT INTO posts (title, subtitle, slug, content, excerpt, tags, status, reading_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [title, subtitle, slug, content, excerpt, tags || '[]', status, readingTime],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, slug });
    }
  );
});

// Update post
router.put('/api/posts/:id', (req, res) => {
  const { title, subtitle, content, tags, status } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  const slug = slugify(title, { lower: true, strict: true });
  const excerpt = content.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  db.run(
    'UPDATE posts SET title = ?, subtitle = ?, slug = ?, content = ?, excerpt = ?, tags = ?, status = ?, reading_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, subtitle, slug, content, excerpt, tags || '[]', status, readingTime, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ changes: this.changes, slug });
    }
  );
});

// Delete post
router.delete('/api/posts/:id', (req, res) => {
  db.run('DELETE FROM posts WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ changes: this.changes });
  });
});

// Upload image
router.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const imageData = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: `/uploads/${req.file.filename}`,
    size: req.file.size
  };

  db.run(
    'INSERT INTO images (filename, original_name, path, size) VALUES (?, ?, ?, ?)',
    [imageData.filename, imageData.originalName, imageData.path, imageData.size],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, ...imageData });
    }
  );
});

// Get all images
router.get('/api/images', (req, res) => {
  db.all('SELECT * FROM images ORDER BY uploaded_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Delete image
router.delete('/api/images/:id', (req, res) => {
  const imageId = req.params.id;
  
  // First, get the image info to delete the file
  db.get('SELECT * FROM images WHERE id = ?', [imageId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }
    
    // Delete the physical file
    const filePath = path.join(__dirname, 'public', 'uploads', row.filename);
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== 'ENOENT') {
        console.warn('Warning: Could not delete file:', unlinkErr.message);
      }
      
      // Delete from database regardless of file deletion success
      db.run('DELETE FROM images WHERE id = ?', [imageId], function(dbErr) {
        if (dbErr) {
          res.status(500).json({ error: dbErr.message });
          return;
        }
        
        if (this.changes === 0) {
          res.status(404).json({ error: 'Image not found' });
          return;
        }
        
        res.json({ 
          message: 'Image deleted successfully',
          changes: this.changes 
        });
      });
    });
  });
});

module.exports = router;
