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

// GET operations (joined info from saccos, routes, and stages)
app.get('/api/operations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sc.sacco_id,
        sc.name AS sacco_name,
        sc.base_fare,
        r.display_name AS route_name,
        s1.name AS from_stage,
        s1.latitude AS from_latitude,
        s1.longitude AS from_longitude
      FROM saccos sc
      JOIN routes r ON sc.route_id = r.route_id
      JOIN stages s1 ON sc.home_stage_id = s1.stage_id
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
