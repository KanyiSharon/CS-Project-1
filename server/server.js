require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());

// Mock database data
const stages = [
  {
    id: 1,
    name: 'Kencom Stage',
    latitude: -1.286389,
    longitude: 36.817223
  },
  {
    id: 2,
    name: 'Ambassadeur Stage',
    latitude: -1.292198,
    longitude: 36.821945
  },
  {
    id: 3,
    name: 'Madaraka Stage',
    latitude: -1.307240,
    longitude: 36.813427
  }
];

const operations = [
  {
    id: 1,
    name: '2NK Sacco',
    fromStageId: 1,
    toStageId: 3,
    frequency: 'Every 5 mins'
  }
];

// API endpoints
app.get('/api/stages', (req, res) => {
  res.json(stages);
});

app.get('/api/operations', (req, res) => {
  const opsWithStages = operations.map(op => {
    const fromStage = stages.find(s => s.id === op.fromStageId);
    const toStage = stages.find(s => s.id === op.toStageId);
    
    return {
      ...op,
      fromStage,
      toStage
    };
  });
  
  res.json(opsWithStages);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});