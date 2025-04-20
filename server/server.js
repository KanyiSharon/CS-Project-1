require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());

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

//fetch routes from the database
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});