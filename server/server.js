require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true // This is the key fix!
}));
app.use(express.json());

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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});