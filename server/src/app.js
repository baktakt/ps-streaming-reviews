const express = require('express');
const cors = require('cors');
const gamesRouter = require('./routes/games');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/games', gamesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
