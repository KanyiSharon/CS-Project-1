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
    fileSize: 10 * 1024 * 1024, // 5MB limit
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
// Add these endpoints to your existing server.js file

// Initialize driver_alerts table
const initializeDriverAlertsTable = async () => {
  try {
    // Check if table exists first
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'driver_alerts'
      );
    `);

    if (!tableExists.rows[0].exists) {
      // Create the table only if it doesn't exist
      await pool.query(`
        CREATE TABLE driver_alerts (
          id SERIAL PRIMARY KEY,
          driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('traffic_jam', 'accident', 'road_closure', 'weather_warning', 'police_checkpoint', 'route_diversion', 'other')),
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          location_name VARCHAR(255) NOT NULL,
          severity_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
          image_data BYTEA,
          image_filename VARCHAR(255),
          image_mimetype VARCHAR(100),
          expiry_time TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes for better performance
      await pool.query(`
        CREATE INDEX idx_driver_alerts_driver_id ON driver_alerts(driver_id);
        CREATE INDEX idx_driver_alerts_alert_type ON driver_alerts(alert_type);
        CREATE INDEX idx_driver_alerts_created_at ON driver_alerts(created_at DESC);
        CREATE INDEX idx_driver_alerts_location ON driver_alerts(location_name);
      `);

      console.log('Driver alerts table created successfully with indexes');

      // Insert sample data
      await pool.query(`
        INSERT INTO driver_alerts (driver_id, alert_type, title, description, location_name, severity_level) VALUES
        (1, 'traffic_jam', 'Heavy Traffic on Uhuru Highway', 'Massive traffic jam from Nyayo Stadium to CBD. Consider alternative routes.', 'Uhuru Highway', 'high'),
        (1, 'accident', 'Accident at Globe Roundabout', 'Multi-vehicle accident blocking two lanes. Police on scene.', 'Globe Roundabout', 'critical'),
        (1, 'road_closure', 'Moi Avenue Closed', 'Road closure due to construction work. Use Tom Mboya Street instead.', 'Moi Avenue', 'medium')
      `);

      console.log('Sample driver alerts data inserted');
    } else {
      console.log('Driver alerts table already exists');
    }
  } catch (err) {
    console.error('Error initializing driver_alerts table:', err);
  }
};

// Add this to your existing initialization calls
initializeDriverAlertsTable();

// Configure multer for alert image uploads
const alertImageStorage = multer.memoryStorage(); // Store in memory for database storage
const uploadAlertImage = multer({
  storage: alertImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 5MB limit
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

// ===== DRIVER ALERTS ENDPOINTS =====

// GET all driver alerts (with pagination and filtering)
app.get('/api/driver-alerts', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      alert_type, 
      severity_level, 
      location, 
      driver_id,
      active_only = 'true' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build WHERE clause based on filters
    if (alert_type) {
      whereClause.push(`alert_type = $${paramIndex}`);
      queryParams.push(alert_type);
      paramIndex++;
    }

    if (severity_level) {
      whereClause.push(`severity_level = $${paramIndex}`);
      queryParams.push(severity_level);
      paramIndex++;
    }

    if (location) {
      whereClause.push(`location_name ILIKE $${paramIndex}`);
      queryParams.push(`%${location}%`);
      paramIndex++;
    }

    if (driver_id) {
      whereClause.push(`driver_id = $${paramIndex}`);
      queryParams.push(driver_id);
      paramIndex++;
    }

    // Filter out expired alerts if active_only is true
    if (active_only === 'true') {
      whereClause.push(`(expiry_time IS NULL OR expiry_time > NOW())`);
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    // Get alerts with driver information
    const alertsQuery = `
      SELECT 
        da.id,
        da.driver_id,
        da.alert_type,
        da.title,
        da.description,
        da.location_name,
        da.severity_level,
        da.image_filename,
        da.image_mimetype,
        da.expiry_time,
        da.created_at,
        u.firstname,
        u.lastname,
        u.username,
        CASE 
          WHEN da.image_data IS NOT NULL THEN true 
          ELSE false 
        END as has_image
      FROM driver_alerts da
      JOIN users u ON da.driver_id = u.id
      ${whereString}
      ORDER BY da.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await pool.query(alertsQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM driver_alerts da
      JOIN users u ON da.driver_id = u.id
      ${whereString}
    `;
    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const countResult = await pool.query(countQuery, countParams);
    const totalAlerts = parseInt(countResult.rows[0].total);

    res.json({
      alerts: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalAlerts / limit),
        total_alerts: totalAlerts,
        has_next: (page * limit) < totalAlerts,
        has_prev: page > 1
      }
    });
  } catch (err) {
    console.error('Error fetching driver alerts:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});

// GET a single driver alert by ID
app.get('/api/driver-alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }
    
    const result = await pool.query(`
      SELECT 
        da.id,
        da.driver_id,
        da.alert_type,
        da.title,
        da.description,
        da.location_name,
        da.severity_level,
        da.image_filename,
        da.image_mimetype,
        da.expiry_time,
        da.created_at,
        u.firstname,
        u.lastname,
        u.username,
        CASE 
          WHEN da.image_data IS NOT NULL THEN true 
          ELSE false 
        END as has_image
      FROM driver_alerts da
      JOIN users u ON da.driver_id = u.id
      WHERE da.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching driver alert:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});

// GET image for a specific alert
app.get('/api/driver-alerts/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }
    
    const result = await pool.query(`
      SELECT image_data, image_mimetype, image_filename
      FROM driver_alerts 
      WHERE id = $1 AND image_data IS NOT NULL
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const { image_data, image_mimetype, image_filename } = result.rows[0];
    
    res.set({
      'Content-Type': image_mimetype,
      'Content-Disposition': `inline; filename="${image_filename}"`,
      'Cache-Control': 'public, max-age=86400' // Cache for 1 day
    });
    
    res.send(image_data);
  } catch (err) {
    console.error('Error fetching alert image:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});

// CREATE a new driver alert
app.post('/api/driver-alerts', uploadAlertImage.single('image'), async (req, res) => {
  try {
    const { 
      // driver_id, 
      alert_type, 
      title, 
      description, 
      location_name, 
      severity_level = 'medium',
      expiry_time 
    } = req.body;
    
    // HARDCODE DRIVER ID HERE - Change this value as needed
    const driver_id = 1; // <-- This is where you hardcode the driver ID
    
    // Validate required fields
    if (!alert_type || !title || !description || !location_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: driver_id, alert_type, title, description, and location_name are required' 
      });
    }
    
    // Validate alert_type
    const validAlertTypes = ['traffic_jam', 'accident', 'road_closure', 'weather_warning', 'police_checkpoint', 'route_diversion', 'other'];
    if (!validAlertTypes.includes(alert_type)) {
      return res.status(400).json({ 
        error: 'Invalid alert_type. Must be one of: ' + validAlertTypes.join(', ') 
      });
    }
    
    // Validate severity_level
    const validSeverityLevels = ['low', 'medium', 'high', 'critical'];
    if (!validSeverityLevels.includes(severity_level)) {
      return res.status(400).json({ 
        error: 'Invalid severity_level. Must be one of: ' + validSeverityLevels.join(', ') 
      });
    }
    
    // Validate expiry_time format if provided
    let expiryTimeValue = null;
    if (expiry_time) {
      expiryTimeValue = new Date(expiry_time);
      if (isNaN(expiryTimeValue.getTime())) {
        return res.status(400).json({ 
          error: 'Invalid expiry_time format. Please use ISO 8601 format (YYYY-MM-DDTHH:mm:ss)' 
        });
      }
      
      // Check if expiry time is in the future
      if (expiryTimeValue <= new Date()) {
        return res.status(400).json({ 
          error: 'Expiry time must be in the future' 
        });
      }
    }
    
    // Verify driver exists
    const driverExists = await pool.query('SELECT id FROM users WHERE id = $1', [driver_id]);
    if (driverExists.rows.length === 0) {
      return res.status(400).json({ error: 'Driver not found' });
    }
    
    // Prepare image data
    let imageData = null;
    let imageFilename = null;
    let imageMimetype = null;
    
    if (req.file) {
      imageData = req.file.buffer;
      imageFilename = req.file.originalname;
      imageMimetype = req.file.mimetype;
    }
    
    // Insert into database
    const result = await pool.query(`
      INSERT INTO driver_alerts (
        driver_id, 
        alert_type, 
        title, 
        description, 
        location_name, 
        severity_level, 
        image_data, 
        image_filename, 
        image_mimetype, 
        expiry_time,
        created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) 
      RETURNING id, driver_id, alert_type, title, description, location_name, severity_level, image_filename, expiry_time, created_at
    `, [
      driver_id, 
      alert_type, 
      title, 
      description, 
      location_name, 
      severity_level, 
      imageData, 
      imageFilename, 
      imageMimetype, 
      expiryTimeValue
    ]);
    
    // Get driver information for response
    const driverInfo = await pool.query(`
      SELECT firstname, lastname, username FROM users WHERE id = $1
    `, [driver_id]);
    
    const alertWithDriver = {
      ...result.rows[0],
      firstname: driverInfo.rows[0].firstname,
      lastname: driverInfo.rows[0].lastname,
      username: driverInfo.rows[0].username,
      has_image: imageData !== null
    };
    
    res.status(201).json({
      message: 'Driver alert created successfully',
      alert: alertWithDriver
    });
  } catch (err) {
    console.error('Error creating driver alert:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});

// UPDATE a driver alert (only by the original driver or admin)
app.put('/api/driver-alerts/:id', uploadAlertImage.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      alert_type, 
      title, 
      description, 
      location_name, 
      severity_level,
      expiry_time,
      driver_id // for authorization check
    } = req.body;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }
    
    // Check if alert exists and get current data
    const existingAlert = await pool.query(`
      SELECT driver_id, image_data, image_filename, image_mimetype 
      FROM driver_alerts 
      WHERE id = $1
    `, [id]);
    
    if (existingAlert.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // Authorization check - only the original driver can update
    if (driver_id && existingAlert.rows[0].driver_id !== parseInt(driver_id)) {
      return res.status(403).json({ error: 'You can only update your own alerts' });
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (alert_type) {
      const validAlertTypes = ['traffic_jam', 'accident', 'road_closure', 'weather_warning', 'police_checkpoint', 'route_diversion', 'other'];
      if (!validAlertTypes.includes(alert_type)) {
        return res.status(400).json({ 
          error: 'Invalid alert_type. Must be one of: ' + validAlertTypes.join(', ') 
        });
      }
      updateFields.push(`alert_type = $${paramIndex}`);
      updateValues.push(alert_type);
      paramIndex++;
    }
    
    if (title) {
      updateFields.push(`title = $${paramIndex}`);
      updateValues.push(title);
      paramIndex++;
    }
    
    if (description) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(description);
      paramIndex++;
    }
    
    if (location_name) {
      updateFields.push(`location_name = $${paramIndex}`);
      updateValues.push(location_name);
      paramIndex++;
    }
    
    if (severity_level) {
      const validSeverityLevels = ['low', 'medium', 'high', 'critical'];
      if (!validSeverityLevels.includes(severity_level)) {
        return res.status(400).json({ 
          error: 'Invalid severity_level. Must be one of: ' + validSeverityLevels.join(', ') 
        });
      }
      updateFields.push(`severity_level = $${paramIndex}`);
      updateValues.push(severity_level);
      paramIndex++;
    }
    
    if (expiry_time !== undefined) {
      let expiryTimeValue = null;
      if (expiry_time) {
        expiryTimeValue = new Date(expiry_time);
        if (isNaN(expiryTimeValue.getTime())) {
          return res.status(400).json({ 
            error: 'Invalid expiry_time format. Please use ISO 8601 format (YYYY-MM-DDTHH:mm:ss)' 
          });
        }
        
        if (expiryTimeValue <= new Date()) {
          return res.status(400).json({ 
            error: 'Expiry time must be in the future' 
          });
        }
      }
      updateFields.push(`expiry_time = $${paramIndex}`);
      updateValues.push(expiryTimeValue);
      paramIndex++;
    }
    
    // Handle image update
    if (req.file) {
      updateFields.push(`image_data = $${paramIndex}`);
      updateValues.push(req.file.buffer);
      paramIndex++;
      
      updateFields.push(`image_filename = $${paramIndex}`);
      updateValues.push(req.file.originalname);
      paramIndex++;
      
      updateFields.push(`image_mimetype = $${paramIndex}`);
      updateValues.push(req.file.mimetype);
      paramIndex++;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Add ID parameter
    updateValues.push(id);
    
    const updateQuery = `
      UPDATE driver_alerts 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, driver_id, alert_type, title, description, location_name, severity_level, image_filename, expiry_time, created_at
    `;
    
    const result = await pool.query(updateQuery, updateValues);
    
    // Get driver information for response
    const driverInfo = await pool.query(`
      SELECT firstname, lastname, username FROM users WHERE id = $1
    `, [result.rows[0].driver_id]);
    
    const alertWithDriver = {
      ...result.rows[0],
      firstname: driverInfo.rows[0].firstname,
      lastname: driverInfo.rows[0].lastname,
      username: driverInfo.rows[0].username,
      has_image: result.rows[0].image_filename !== null
    };
    
    res.json({
      message: 'Driver alert updated successfully',
      alert: alertWithDriver
    });
  } catch (err) {
    console.error('Error updating driver alert:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});

// DELETE a driver alert (only by the original driver or admin)
app.delete('/api/driver-alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body; // for authorization check
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }
    
    // Check if alert exists
    const existingAlert = await pool.query(`
      SELECT driver_id FROM driver_alerts WHERE id = $1
    `, [id]);
    
    if (existingAlert.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // Authorization check - only the original driver can delete
    if (driver_id && existingAlert.rows[0].driver_id !== parseInt(driver_id)) {
      return res.status(403).json({ error: 'You can only delete your own alerts' });
    }
    
    // Delete the alert
    const result = await pool.query(`
      DELETE FROM driver_alerts 
      WHERE id = $1 
      RETURNING id, title, alert_type, created_at
    `, [id]);
    
    res.json({
      message: 'Driver alert deleted successfully',
      alert: result.rows[0]
    });
  } catch (err) {
    console.error('Error deleting driver alert:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});

// GET alerts by location (for mobile app geolocation features)
app.get('/api/driver-alerts/location/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { radius = 10, active_only = 'true' } = req.query; // radius in km for future coordinate-based search
    
    let whereClause = `location_name ILIKE $1`;
    let queryParams = [`%${location}%`];
    
    // Filter out expired alerts if active_only is true
    if (active_only === 'true') {
      whereClause += ` AND (expiry_time IS NULL OR expiry_time > NOW())`;
    }
    
    const result = await pool.query(`
      SELECT 
        da.id,
        da.driver_id,
        da.alert_type,
        da.title,
        da.description,
        da.location_name,
        da.severity_level,
        da.image_filename,
        da.expiry_time,
        da.created_at,
        u.firstname,
        u.lastname,
        u.username,
        CASE 
          WHEN da.image_data IS NOT NULL THEN true 
          ELSE false 
        END as has_image
      FROM driver_alerts da
      JOIN users u ON da.driver_id = u.id
      WHERE ${whereClause}
      ORDER BY da.created_at DESC
      LIMIT 100
    `, queryParams);
    
    res.json({
      location: location,
      alerts: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching alerts by location:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});

// GET alert statistics (for dashboard)
app.get('/api/driver-alerts/stats', async (req, res) => {
  try {
    const { period = '7d' } = req.query; // 1d, 7d, 30d, 90d
    
    let dateFilter = '';
    switch (period) {
      case '1d':
        dateFilter = "created_at >= NOW() - INTERVAL '1 day'";
        break;
      case '7d':
        dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        dateFilter = "created_at >= NOW() - INTERVAL '90 days'";
        break;
      default:
        dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
    }
    
    // Get total alerts
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total FROM driver_alerts WHERE ${dateFilter}
    `);
    
    // Get alerts by type
    const typeResult = await pool.query(`
      SELECT alert_type, COUNT(*) as count 
      FROM driver_alerts 
      WHERE ${dateFilter}
      GROUP BY alert_type 
      ORDER BY count DESC
    `);
    
    // Get alerts by severity
    const severityResult = await pool.query(`
      SELECT severity_level, COUNT(*) as count 
      FROM driver_alerts 
      WHERE ${dateFilter}
      GROUP BY severity_level 
      ORDER BY count DESC
    `);
    
    // Get active alerts (not expired)
    const activeResult = await pool.query(`
      SELECT COUNT(*) as active 
      FROM driver_alerts 
      WHERE ${dateFilter} AND (expiry_time IS NULL OR expiry_time > NOW())
    `);
    
    res.json({
      period: period,
      total_alerts: parseInt(totalResult.rows[0].total),
      active_alerts: parseInt(activeResult.rows[0].active),
      by_type: typeResult.rows,
      by_severity: severityResult.rows
    });
  } catch (err) {
    console.error('Error fetching alert statistics:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});

// Clean up expired alerts (can be called by a cron job)
app.post('/api/driver-alerts/cleanup', async (req, res) => {
  try {
    const result = await pool.query(`
      DELETE FROM driver_alerts 
      WHERE expiry_time IS NOT NULL AND expiry_time <= NOW()
      RETURNING id, title, expiry_time
    `);
    
    res.json({
      message: 'Expired alerts cleaned up successfully',
      deleted_count: result.rows.length,
      deleted_alerts: result.rows
    });
  } catch (err) {
    console.error('Error cleaning up expired alerts:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: err.message 
    });
  }
});
// ===== RATINGS ENDPOINTS =====

// Initialize ratings table
const initializeRatingsTable = async () => {
  try {
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ratings'
      );
    `);

    if (!tableExists.rows[0].exists) {
      await pool.query(`
        CREATE TABLE ratings (
          id SERIAL PRIMARY KEY,
          commuter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          sacco_id INTEGER REFERENCES saccos(sacco_id) ON DELETE CASCADE,
          cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
          safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
          service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
          average_rating DECIMAL(3,2) GENERATED ALWAYS AS (
            (cleanliness_rating + safety_rating + service_rating)::DECIMAL / 3
          ) STORED,
          review_text TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Ratings table created successfully');
    }
  } catch (err) {
    console.error('Error initializing ratings table:', err);
  }
};

// Call this during startup
initializeRatingsTable();

// GET all ratings
app.get('/api/ratings', async (req, res) => {
  try {
    const { sacco_id, commuter_id, sort = 'newest', page = 1, limit = 10 } = req.query;
    
    let whereClauses = [];
    let queryParams = [];
    let paramIndex = 1;

    if (sacco_id) {
      whereClauses.push(`r.sacco_id = $${paramIndex}`);
      queryParams.push(sacco_id);
      paramIndex++;
    }

    if (commuter_id) {
      whereClauses.push(`r.commuter_id = $${paramIndex}`);
      queryParams.push(commuter_id);
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Determine sort order
    let orderBy;
    switch (sort) {
      case 'highest':
        orderBy = 'r.average_rating DESC';
        break;
      case 'lowest':
        orderBy = 'r.average_rating ASC';
        break;
      case 'newest':
      default:
        orderBy = 'r.created_at DESC';
    }

    // Get paginated results
    const offset = (page - 1) * limit;
    const result = await pool.query(`
      SELECT 
        r.*,
        u.firstname AS commuter_firstname,
        u.lastname AS commuter_lastname,
        s.name AS sacco_name
      FROM ratings r
      JOIN users u ON r.commuter_id = u.id
      JOIN saccos s ON r.sacco_id = s.sacco_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset]);

    // Get total count for pagination
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM ratings r
      ${whereClause}
    `, queryParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      ratings: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRatings: total,
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Error fetching ratings:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET average ratings for a sacco
app.get('/api/ratings/average/:sacco_id', async (req, res) => {
  try {
    const { sacco_id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        AVG(cleanliness_rating) AS avg_cleanliness,
        AVG(safety_rating) AS avg_safety,
        AVG(service_rating) AS avg_service,
        AVG(average_rating) AS overall_avg,
        COUNT(*) AS total_ratings
      FROM ratings
      WHERE sacco_id = $1
    `, [sacco_id]);

    if (result.rows[0].total_ratings === '0') {
      return res.status(404).json({ error: 'No ratings found for this sacco' });
    }

    res.json({
      sacco_id,
      avg_cleanliness: parseFloat(result.rows[0].avg_cleanliness).toFixed(1),
      avg_safety: parseFloat(result.rows[0].avg_safety).toFixed(1),
      avg_service: parseFloat(result.rows[0].avg_service).toFixed(1),
      overall_avg: parseFloat(result.rows[0].overall_avg).toFixed(1),
      total_ratings: parseInt(result.rows[0].total_ratings)
    });
  } catch (err) {
    console.error('Error fetching average ratings:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST a new rating
app.post('/api/ratings', async (req, res) => {
  try {
    const { commuter_id, sacco_id, cleanliness_rating, safety_rating, service_rating, review_text } = req.body;

    // Validate required fields
    if (!commuter_id || !sacco_id || !cleanliness_rating || !safety_rating || !service_rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate rating values
    const validateRating = (rating) => rating >= 1 && rating <= 5;
    if (!validateRating(cleanliness_rating) || !validateRating(safety_rating) || !validateRating(service_rating)) {
      return res.status(400).json({ error: 'Ratings must be between 1 and 5' });
    }

    // Check if user has already rated this sacco
    const existingRating = await pool.query(`
      SELECT id FROM ratings 
      WHERE commuter_id = $1 AND sacco_id = $2
    `, [commuter_id, sacco_id]);

    if (existingRating.rows.length > 0) {
      return res.status(400).json({ error: 'You have already rated this sacco' });
    }

    // Insert new rating
    const result = await pool.query(`
      INSERT INTO ratings (
        commuter_id, 
        sacco_id, 
        cleanliness_rating, 
        safety_rating, 
        service_rating, 
        review_text
      ) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [commuter_id, sacco_id, cleanliness_rating, safety_rating, service_rating, review_text || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating rating:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT update a rating
app.put('/api/ratings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cleanliness_rating, safety_rating, service_rating, review_text } = req.body;

    // Validate rating values if provided
    const validateRating = (rating) => rating === undefined || (rating >= 1 && rating <= 5);
    if (!validateRating(cleanliness_rating) || !validateRating(safety_rating) || !validateRating(service_rating)) {
      return res.status(400).json({ error: 'Ratings must be between 1 and 5' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (cleanliness_rating !== undefined) {
      updates.push(`cleanliness_rating = $${paramIndex}`);
      values.push(cleanliness_rating);
      paramIndex++;
    }

    if (safety_rating !== undefined) {
      updates.push(`safety_rating = $${paramIndex}`);
      values.push(safety_rating);
      paramIndex++;
    }

    if (service_rating !== undefined) {
      updates.push(`service_rating = $${paramIndex}`);
      values.push(service_rating);
      paramIndex++;
    }

    if (review_text !== undefined) {
      updates.push(`review_text = $${paramIndex}`);
      values.push(review_text);
      paramIndex++;
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = NOW()`);

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const result = await pool.query(`
      UPDATE ratings
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating rating:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE a rating
app.delete('/api/ratings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM ratings 
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    res.json({ message: 'Rating deleted successfully' });
  } catch (err) {
    console.error('Error deleting rating:', err);
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