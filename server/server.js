require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'lost-item-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if the file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Simple session storage (in production, use proper session management)
const sessions = new Map();

// ===== AUTHENTICATION MIDDLEWARE =====
const authenticateUser = (req, res, next) => {
  const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
  if (sessionId && sessions.has(sessionId)) {
    req.user = sessions.get(sessionId);
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Mock authentication endpoint for testing
app.get('/api/me', (req, res) => {
  // For testing purposes, return a mock driver user
  // In production, implement proper session management
  res.json({ 
    id: 1, 
    firstname: 'Test', 
    lastname: 'Driver', 
    role: 'Driver', 
    username: 'testdriver' 
  });
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      message: 'Database connection successful', 
      timestamp: result.rows[0].now 
    });
  } catch (err) {
    console.error('Database connection test failed:', err);
    res.status(500).json({ 
      error: 'Database connection failed', 
      details: err.message 
    });
  }
});

// Initialize lost_items table
const initializeLostItemsTable = async () => {
  try {
    // Check if table exists first
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_items'
      );
    `);

    if (!tableExists.rows[0].exists) {
      // Create the table only if it doesn't exist
      await pool.query(`
        CREATE TABLE lost_items (
          id SERIAL PRIMARY KEY,
          lostitem VARCHAR(255) NOT NULL,
          route VARCHAR(255) NOT NULL,
          date DATE NOT NULL,
          sacco VARCHAR(255) NOT NULL,
          description TEXT,
          image_url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Lost items table created successfully');
    } else {
      console.log('Lost items table already exists');
    }
  } catch (err) {
    console.error('Error initializing lost_items table:', err);
  }
};

// Initialize table on startup
initializeLostItemsTable();

// ===== LOST & FOUND ENDPOINTS =====

// GET all lost items
app.get('/api/lost-items', async (req, res) => {
  try {
    // Ensure table exists before querying
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_items'
      );
    `);

    if (!tableExists.rows[0].exists) {
      // Create the table if it doesn't exist
      await pool.query(`
        CREATE TABLE lost_items (
          id SERIAL PRIMARY KEY,
          lostitem VARCHAR(255) NOT NULL,
          route VARCHAR(255) NOT NULL,
          date DATE NOT NULL,
          sacco VARCHAR(255) NOT NULL,
          description TEXT,
          image_url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Created lost_items table');
      // Return empty array since table was just created
      return res.json([]);
    }

    // Query the table - make sure column names match exactly
    const result = await pool.query(`
      SELECT 
        id, 
        lostitem, 
        route, 
        date, 
        sacco, 
        description, 
        image_url, 
        created_at 
      FROM lost_items 
      ORDER BY created_at DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching lost items:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});

// GET a single lost item by ID
app.get('/api/lost-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }
    
    const result = await pool.query(`
      SELECT 
        id, 
        lostitem, 
        route, 
        date, 
        sacco, 
        description, 
        image_url, 
        created_at 
      FROM lost_items 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lost item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching lost item:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});

// CREATE a new lost item report
app.post('/api/lost-item', upload.single('image'), async (req, res) => {
  try {
    const { lostitem, route, date, sacco, description } = req.body;
    
    // Validate required fields
    if (!lostitem || !route || !date || !sacco) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      }
      return res.status(400).json({ 
        error: 'Missing required fields: lostitem, route, date, and sacco are required' 
      });
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      if (req.file) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      }
      return res.status(400).json({ 
        error: 'Invalid date format. Please use YYYY-MM-DD' 
      });
    }
    
    // Get image URL if file was uploaded
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    // Insert into database
    const result = await pool.query(`
      INSERT INTO lost_items (lostitem, route, date, sacco, description, image_url, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
      RETURNING *
    `, [lostitem, route, date, sacco, description || null, imageUrl]);
    
    res.status(201).json({
      message: 'Lost item reported successfully',
      item: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating lost item report:', err);
    
    // Delete uploaded file if database insert fails
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    }
    
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});

// UPDATE lost item to mark as found
app.post('/api/found-item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }
    
    // Update description to indicate item was found
    const result = await pool.query(`
      UPDATE lost_items 
      SET description = COALESCE(description || ' ', '') || '[FOUND] Item has been found' 
      WHERE id = $1 
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lost item not found' });
    }
    
    res.json({
      message: 'Item marked as found successfully',
      item: result.rows[0]
    });
  } catch (err) {
    console.error('Error marking item as found:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});

// DELETE a lost item (admin function)
app.delete('/api/lost-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }
    
    // Get the item first to delete associated image
    const itemResult = await pool.query('SELECT image_url FROM lost_items WHERE id = $1', [id]);
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lost item not found' });
    }
    
    const imageUrl = itemResult.rows[0].image_url;
    
    // Delete from database
    const result = await pool.query('DELETE FROM lost_items WHERE id = $1 RETURNING *', [id]);
    
    // Delete associated image file if it exists
    if (imageUrl) {
      const imagePath = path.join(__dirname, imageUrl);
      fs.unlink(imagePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Error deleting image file:', err);
        }
      });
    }
    
    res.json({
      message: 'Lost item deleted successfully',
      item: result.rows[0]
    });
  } catch (err) {
    console.error('Error deleting lost item:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});

// ===== EXISTING ENDPOINTS =====

// GET all stages from the database
app.get('/api/stages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stages');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching stages:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET all saccos from the database
app.get('/api/saccos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM saccos');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching saccos:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET saccos with joined route and stage information
app.get('/api/saccos/details', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.sacco_id,
        s.name,
        s.base_fare_range,
        r.route_id,
        r.display_name AS route_name,
        st.stage_id,
        st.name AS stage_name
      FROM saccos s
      LEFT JOIN routes r ON s.route_id = r.route_id
      LEFT JOIN stages st ON s.sacco_stage_id = st.stage_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sacco details:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// fetch routes from the database
app.get('/api/routes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM routes');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching routes:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET operations (joined info from saccos, routes, and stages)
app.get('/api/operations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sc.sacco_id,
        sc.name AS sacco_name,
        sc.base_fare_range,
        r.display_name AS route_name,
        s1.name AS from_stage,
        s1.latitude AS stage_latitude,
        s1.longitude AS stage_longitude
      FROM saccos sc
      JOIN routes r ON sc.route_id = r.route_id
      JOIN stages s1 ON sc.sacco_stage_id = s1.stage_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching operations:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ===== POSTS ENDPOINTS =====

// GET all posts
app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET a single post by ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CREATE a new post
app.post('/api/posts', async (req, res) => {
  try {
    const { image_url, description, type } = req.body;
    const result = await pool.query(
      'INSERT INTO posts (image_url, description, type, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [image_url, description, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// UPDATE a post
app.put('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, description, type } = req.body;
    
    const result = await pool.query(
      'UPDATE posts SET image_url = $1, description = $2, type = $3 WHERE id = $4 RETURNING *',
      [image_url, description, type, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE a post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ message: 'Post deleted successfully', post: result.rows[0] });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ===== USERS ENDPOINTS =====

// GET all users (excluding passwords for security)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, firstname, lastname, username, email, specify FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET a single user by ID (excluding password)
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, firstname, lastname, username, email, specify FROM users WHERE id = $1', 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CREATE a new user
app.post('/api/users', async (req, res) => {
  try {
    const { firstname, lastname, username, password, email, specify } = req.body;
    
    // Check if username or email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    const result = await pool.query(
      'INSERT INTO users (firstname, lastname, username, password, email, specify) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, firstname, lastname, username, email, specify',
      [firstname, lastname, username, password, email, specify]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// UPDATE a user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, username, email, specify } = req.body;
    
    // Check if username or email already exists for other users
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
      [username, email, id]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    const result = await pool.query(
      'UPDATE users SET firstname = $1, lastname = $2, username = $3, email = $4, specify = $5 WHERE id = $6 RETURNING id, firstname, lastname, username, email, specify',
      [firstname, lastname, username, email, specify, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// UPDATE user password (separate endpoint for security)
app.put('/api/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
      [password, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE a user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, firstname, lastname, username, email, specify', 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ===== AUTHENTICATION ENDPOINTS =====

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await pool.query(
      'SELECT id, firstname, lastname, username, email, specify FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    res.json({ message: 'Login successful', user: result.rows[0] });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Check if username exists
app.get('/api/auth/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    
    res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    console.error('Error checking username:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Check if email exists
app.get('/api/auth/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    console.error('Error checking email:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: 'Only image files are allowed!' });
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});